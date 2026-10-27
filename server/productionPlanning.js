import { requestContext } from "./requestContext.js";
import {
  PRODUCTION_PLAN_STATUSES,
  canTransitionProductionPlan,
  calculateNetProductionRequirement,
  calculateRequiredFfb,
  normalizePlanningQuantity,
  validatePlanningLine,
  validatePlanningPeriod,
} from "../packages/production/productionPlanningDomain.js";

const now = () => new Date().toISOString();
const parse = (value, fallback = []) => { try { return JSON.parse(value || JSON.stringify(fallback)); } catch { return fallback; } };
const fail = (res, status, code, message, details) => res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });

function hasPlanningPermission(req, permission) {
  const role = String(req.get("X-Role") || "").trim();
  const values = String(req.get("X-Permissions") || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (role === "Company Admin" || values.includes("*") || values.includes(permission)) return true;
  return process.env.NODE_ENV !== "production" && requestContext(req).actorId === "demo-user";
}

export function registerProductionPlanningModule(app, db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_plan_sequences (tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL, next_number INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (tenant_id, mill_id));
    CREATE TABLE IF NOT EXISTS production_plan_commands (tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, plan_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (tenant_id, mill_id, idempotency_key));
    CREATE TABLE IF NOT EXISTS production_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL, plan_no TEXT NOT NULL UNIQUE, period_type TEXT NOT NULL, period_from TEXT NOT NULL, period_to TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', planning_method TEXT NOT NULL DEFAULT 'DEMAND_CONSOLIDATION', status TEXT NOT NULL DEFAULT 'DRAFT', remarks TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL, approved_by TEXT, approved_at TEXT, revision INTEGER NOT NULL DEFAULT 1, idempotency_key TEXT, UNIQUE(tenant_id,mill_id,plan_no));
    CREATE TABLE IF NOT EXISTS production_plan_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER NOT NULL, product TEXT NOT NULL, product_type TEXT NOT NULL DEFAULT 'FINISHED_PRODUCT', uom TEXT NOT NULL DEFAULT 'MT', gross_demand REAL NOT NULL DEFAULT 0, available_inventory REAL NOT NULL DEFAULT 0, reserved_inventory REAL NOT NULL DEFAULT 0, safety_stock REAL NOT NULL DEFAULT 0, already_planned_quantity REAL NOT NULL DEFAULT 0, net_requirement REAL NOT NULL DEFAULT 0, planned_quantity REAL NOT NULL DEFAULT 0, required_by_date TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'NORMAL', expected_yield_percent REAL, estimated_ffb_quantity REAL, planning_remarks TEXT NOT NULL DEFAULT '', FOREIGN KEY(plan_id) REFERENCES production_plans(id));
    CREATE TABLE IF NOT EXISTS production_plan_demand_allocations (id INTEGER PRIMARY KEY AUTOINCREMENT, plan_line_id INTEGER NOT NULL, delivery_request_line_id TEXT NOT NULL, delivery_request_no TEXT NOT NULL DEFAULT '', customer_name TEXT NOT NULL DEFAULT '', contract_number TEXT NOT NULL DEFAULT '', allocated_quantity REAL NOT NULL, uom TEXT NOT NULL DEFAULT 'MT', required_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ALLOCATED', UNIQUE(plan_line_id,delivery_request_line_id), FOREIGN KEY(plan_line_id) REFERENCES production_plan_lines(id));
    CREATE TABLE IF NOT EXISTS production_plan_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER NOT NULL, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, FOREIGN KEY(plan_id) REFERENCES production_plans(id));
  `);
  for (const column of ["revision INTEGER NOT NULL DEFAULT 1", "idempotency_key TEXT"]) {
    try { db.exec(`ALTER TABLE production_plans ADD COLUMN ${column}`); } catch (e) { if (!String(e.message).includes("duplicate column")) throw e; }
  }

  const scope = (req) => requestContext(req);
  const requirePermission = (req, res, name) => hasPlanningPermission(req, name) || (fail(res, 403, "PLANNING_PERMISSION_DENIED", `Permission required: ${name}.`), false);
  const audit = (id, s, action, details = {}) => db.prepare("INSERT INTO production_plan_audit (plan_id,tenant_id,actor_id,action,details_json,created_at) VALUES (?,?,?,?,?,?)").run(id, s.tenantId, s.actorId, action, JSON.stringify(details), now());
  const nextNo = (s) => {
    const row = db.prepare("INSERT INTO production_plan_sequences (tenant_id,mill_id,next_number) VALUES (?,?,2) ON CONFLICT(tenant_id,mill_id) DO UPDATE SET next_number=next_number+1 RETURNING next_number-1 AS value").get(s.tenantId, s.millId);
    return `PP-${now().slice(0, 10).replaceAll("-", "")}-${String(row.value).padStart(5, "0")}`;
  };
  const serialize = (plan) => {
    if (!plan) return null;
    const lines = db.prepare("SELECT * FROM production_plan_lines WHERE plan_id=? ORDER BY required_by_date,id").all(plan.id);
    const lineIds = lines.map((line) => line.id);
    const allocations = lineIds.length ? db.prepare(`SELECT * FROM production_plan_demand_allocations WHERE plan_line_id IN (${lineIds.map(() => "?").join(",")}) ORDER BY id`).all(...lineIds) : [];
    const allocationMap = new Map(lineIds.map((id) => [id, []]));
    allocations.forEach((row) => allocationMap.get(row.plan_line_id)?.push(row));
    const auditRows = db.prepare("SELECT * FROM production_plan_audit WHERE plan_id=? ORDER BY id DESC").all(plan.id).map((row) => ({ ...row, details: parse(row.details_json, {}) }));
    return { ...plan, revision: Number(plan.revision || 1), lines: lines.map((line) => ({ ...line, allocations: allocationMap.get(line.id) || [] })), audit: auditRows };
  };
  const list = (s, req) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const page = Math.max(1, Number(req.query.page || 1)); const offset = (page - 1) * limit;
    const total = db.prepare("SELECT COUNT(*) count FROM production_plans WHERE tenant_id=? AND mill_id=?").get(s.tenantId, s.millId).count;
    const rows = db.prepare("SELECT * FROM production_plans WHERE tenant_id=? AND mill_id=? ORDER BY id DESC LIMIT ? OFFSET ?").all(s.tenantId, s.millId, limit, offset);
    return { rows: rows.map(serialize), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  };
  const context = (s) => ({
    mills: db.prepare("SELECT id,code,name,status FROM production_mills WHERE tenant_id=? AND status='ACTIVE' ORDER BY name").all(s.tenantId),
    items: db.prepare("SELECT id,item_code,name,unit,item_type FROM items WHERE tenant_id=? AND mill_id=? AND status='Active' ORDER BY name").all(s.tenantId, s.millId),
    inventory: db.prepare("SELECT material,balance,uom,location,updated_at FROM production_inventory ORDER BY material,location").all(),
    stockPositions: db.prepare("SELECT material,location,balance,uom,updated_at FROM production_inventory ORDER BY material,location").all(),
    plans: db.prepare("SELECT id,plan_no,status,period_from,period_to,revision FROM production_plans WHERE tenant_id=? AND mill_id=? AND status NOT IN ('CANCELLED','CLOSED') ORDER BY period_from").all(s.tenantId, s.millId),
    productionOrders: db.prepare("SELECT id,order_no,planned_start,planned_end,planned_ffb_quantity,status FROM production_orders WHERE tenant_id=? AND mill_id=? ORDER BY planned_start").all(s.tenantId, s.millId),
  });

  const getPlans = (req, res) => {
    if (!requirePermission(req, res, "production.plan.read")) return;
    const result = list(scope(req), req);
    if (req.path.startsWith("/api/v1/")) return res.json({ data: result.rows, pagination: result.pagination });
    res.set("X-Pagination", JSON.stringify(result.pagination)); return res.json(result.rows);
  };
  const getContext = (req, res) => { if (requirePermission(req, res, "production.plan.read")) res.json(context(scope(req))); };
  const createPlan = (req, res) => {
    if (!requirePermission(req, res, "production.plan.create")) return;
    const s = scope(req); const body = req.body || {}; const periodErrors = validatePlanningPeriod(body);
    if (Object.keys(periodErrors).length || !Array.isArray(body.lines) || !body.lines.length) return fail(res, 400, "PRODUCTION_PLAN_VALIDATION_FAILED", "A valid planning period and at least one plan line are required.", periodErrors);
    const lineErrors = body.lines.map(validatePlanningLine); const firstLineError = lineErrors.find((item) => Object.keys(item).length);
    if (firstLineError) return fail(res, 400, "PRODUCTION_PLAN_LINE_INVALID", "One or more plan lines are invalid.", lineErrors);
    const idempotencyKey = String(req.get("Idempotency-Key") || body.idempotencyKey || "").trim();
    try {
      const id = db.transaction(() => {
        if (idempotencyKey) { const previous = db.prepare("SELECT plan_id FROM production_plan_commands WHERE tenant_id=? AND mill_id=? AND idempotency_key=?").get(s.tenantId, s.millId, idempotencyKey); if (previous) return Number(previous.plan_id); }
        const stamp = now(); const info = db.prepare("INSERT INTO production_plans (tenant_id,mill_id,plan_no,period_type,period_from,period_to,name,planning_method,status,remarks,created_by,created_at,revision,idempotency_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(s.tenantId, s.millId, nextNo(s), String(body.periodType || "CUSTOM").toUpperCase(), body.periodFrom, body.periodTo, body.name || "", body.planningMethod || "DEMAND_CONSOLIDATION", "DRAFT", body.remarks || "", s.actorId, stamp, 1, idempotencyKey || null);
        const planId = Number(info.lastInsertRowid); const lineInsert = db.prepare("INSERT INTO production_plan_lines (plan_id,product,product_type,uom,gross_demand,available_inventory,reserved_inventory,safety_stock,already_planned_quantity,net_requirement,planned_quantity,required_by_date,priority,expected_yield_percent,estimated_ffb_quantity,planning_remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"); const allocationInsert = db.prepare("INSERT INTO production_plan_demand_allocations (plan_line_id,delivery_request_line_id,delivery_request_no,customer_name,contract_number,allocated_quantity,uom,required_date) VALUES (?,?,?,?,?,?,?,?)");
        for (const line of body.lines) { const net = calculateNetProductionRequirement(line); const planned = normalizePlanningQuantity(line.plannedQuantity ?? net); const ffb = line.estimatedFfbQuantity == null ? calculateRequiredFfb(planned, line.expectedYieldPercent) : normalizePlanningQuantity(line.estimatedFfbQuantity); const row = lineInsert.run(planId, String(line.productId ?? line.product).trim(), line.productType || "FINISHED_PRODUCT", line.uom, Number(line.grossDemand || 0), Number(line.availableInventory || 0), Number(line.reservedInventory || 0), Number(line.safetyStock || 0), Number(line.alreadyPlannedQuantity || 0), net, planned, line.requiredByDate, line.priority || "NORMAL", line.expectedYieldPercent == null || line.expectedYieldPercent === "" ? null : Number(line.expectedYieldPercent), ffb, line.planningRemarks || ""); for (const allocation of (line.allocations || [])) allocationInsert.run(row.lastInsertRowid, allocation.deliveryRequestLineId, allocation.deliveryRequestNo || "", allocation.customerName || "", allocation.contractNumber || "", Number(allocation.allocatedQuantity), allocation.uom || line.uom, allocation.requiredDate || line.requiredByDate); }
        if (idempotencyKey) db.prepare("INSERT INTO production_plan_commands (tenant_id,mill_id,idempotency_key,plan_id,created_at) VALUES (?,?,?,?,?)").run(s.tenantId, s.millId, idempotencyKey, planId, stamp);
        audit(planId, s, "PRODUCTION_PLAN_CREATED", { lineCount: body.lines.length, idempotencyKey: idempotencyKey || null }); return planId;
      })();
      return res.status(201).json(serialize(db.prepare("SELECT * FROM production_plans WHERE id=? AND tenant_id=? AND mill_id=?").get(id, s.tenantId, s.millId)));
    } catch (e) { return fail(res, 400, "PRODUCTION_PLAN_SAVE_FAILED", e.message); }
  };
  const changeStatus = (req, res) => {
    if (!requirePermission(req, res, "production.plan.approve")) return;
    const s = scope(req); const existing = db.prepare("SELECT * FROM production_plans WHERE id=? AND tenant_id=? AND mill_id=?").get(req.params.id, s.tenantId, s.millId); const next = String(req.body?.status || "").toUpperCase();
    if (!existing) return fail(res, 404, "PRODUCTION_PLAN_NOT_FOUND", "Production Plan not found.");
    if (!PRODUCTION_PLAN_STATUSES.includes(next) || !canTransitionProductionPlan(existing.status, next)) return fail(res, 409, "PRODUCTION_PLAN_INVALID_TRANSITION", `Cannot transition Production Plan from ${existing.status} to ${next}.`);
    const expected = req.body?.expectedRevision == null ? Number(existing.revision || 1) : Number(req.body.expectedRevision); const stamp = now(); const approved = next === "APPROVED" ? s.actorId : existing.approved_by;
    const updated = db.prepare("UPDATE production_plans SET status=?,approved_by=?,approved_at=CASE WHEN ?='APPROVED' THEN ? ELSE approved_at END,revision=revision+1 WHERE id=? AND tenant_id=? AND mill_id=? AND revision=?").run(next, approved, next, stamp, existing.id, s.tenantId, s.millId, expected);
    if (!updated.changes) return fail(res, 409, "PRODUCTION_PLAN_REVISION_CONFLICT", "The plan was changed by another user. Refresh before retrying.");
    audit(existing.id, s, "PRODUCTION_PLAN_STATUS_CHANGED", { from: existing.status, to: next, fromRevision: expected, toRevision: expected + 1 });
    return res.json(serialize(db.prepare("SELECT * FROM production_plans WHERE id=?").get(existing.id)));
  };

  app.get(["/api/production-plans", "/api/v1/production-plans"], getPlans);
  app.get(["/api/production-plans/context", "/api/v1/production-plans/context"], getContext);
  app.post(["/api/production-plans", "/api/v1/production-plans"], createPlan);
  app.post(["/api/production-plans/:id/status", "/api/v1/production-plans/:id/status"], changeStatus);
}
