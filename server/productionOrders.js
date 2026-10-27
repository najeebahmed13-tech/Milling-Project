import { requestContext } from "./requestContext.js";
import { calculateExpectedQuantity, calculateRemainingDemand, canTransitionProductionOrder, validateProductionOrder } from "../packages/production/productionOrderDomain.js";

const now = () => new Date().toISOString();
const parse = (value, fallback = []) => { try { return JSON.parse(value || JSON.stringify(fallback)); } catch { return fallback; } };

export function registerProductionOrderModule(app, db) {
  for (const [table, column] of [["production_lines", "mill_id TEXT NOT NULL DEFAULT 'demo-mill'"], ["production_routings", "mill_id TEXT NOT NULL DEFAULT 'demo-mill'"]]) {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`); } catch (error) { if (!String(error.message).includes("duplicate column")) throw error; }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_mills (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
      legal_company TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', capacity REAL, capacity_uom TEXT NOT NULL DEFAULT 'MT',
      remarks TEXT NOT NULL DEFAULT '', timezone TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur', status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL, created_by TEXT NOT NULL DEFAULT 'system', updated_at TEXT, updated_by TEXT,
      UNIQUE(tenant_id, code)
    );
    CREATE TABLE IF NOT EXISTS production_mill_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT, mill_id TEXT NOT NULL, tenant_id TEXT NOT NULL,
      actor_id TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_order_sequences (
      tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL, next_number INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (tenant_id, mill_id)
    );
    CREATE TABLE IF NOT EXISTS production_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL,
      order_no TEXT NOT NULL UNIQUE, order_date TEXT NOT NULL, line_id INTEGER NOT NULL, routing_id INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '', planned_start TEXT NOT NULL, planned_end TEXT NOT NULL,
      planned_ffb_quantity REAL NOT NULL, ffb_uom TEXT NOT NULL DEFAULT 'MT', shift_ids_json TEXT NOT NULL DEFAULT '[]',
      supervisor_id INTEGER, status TEXT NOT NULL DEFAULT 'DRAFT', remarks TEXT NOT NULL DEFAULT '',
      routing_snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL, updated_at TEXT,
      FOREIGN KEY(line_id) REFERENCES production_lines(id), FOREIGN KEY(routing_id) REFERENCES production_routings(id)
    );
    CREATE TABLE IF NOT EXISTS production_order_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, contract_id INTEGER NOT NULL,
      contract_line_id TEXT NOT NULL, customer TEXT NOT NULL, demand_product TEXT NOT NULL, contract_quantity REAL NOT NULL,
      fulfilled_quantity REAL NOT NULL DEFAULT 0, already_planned_quantity REAL NOT NULL DEFAULT 0,
      remaining_available_demand REAL NOT NULL, planned_quantity REAL NOT NULL, demand_uom TEXT NOT NULL DEFAULT 'MT',
      FOREIGN KEY(order_id) REFERENCES production_orders(id), UNIQUE(order_id, contract_id, contract_line_id)
    );
    CREATE TABLE IF NOT EXISTS production_order_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product TEXT NOT NULL,
      expected_quantity REAL, output_uom TEXT NOT NULL DEFAULT 'MT', yield_percent REAL,
      manual_override INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(order_id) REFERENCES production_orders(id)
    );
    CREATE TABLE IF NOT EXISTS production_order_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, tenant_id TEXT NOT NULL,
      actor_id TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES production_orders(id)
    );
  `);
  for (const column of ["legal_company TEXT NOT NULL DEFAULT ''", "address TEXT NOT NULL DEFAULT ''", "country TEXT NOT NULL DEFAULT ''", "state TEXT NOT NULL DEFAULT ''", "city TEXT NOT NULL DEFAULT ''", "capacity REAL", "capacity_uom TEXT NOT NULL DEFAULT 'MT'", "remarks TEXT NOT NULL DEFAULT ''", "created_by TEXT NOT NULL DEFAULT 'system'", "updated_at TEXT", "updated_by TEXT"]) { try { db.exec(`ALTER TABLE production_mills ADD COLUMN ${column}`); } catch (error) { if (!String(error.message).includes("duplicate column")) throw error; } }
  db.prepare("INSERT OR IGNORE INTO production_mills (id,tenant_id,code,name,legal_company,address,country,state,city,capacity,capacity_uom,remarks,timezone,status,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run("demo-mill", "demo-tenant", "MAIN-MILL", "Main Mill", "", "", "Malaysia", "", "", 240, "MT", "", "Asia/Kuala_Lumpur", "ACTIVE", now(), "system");

  const context = (req) => requestContext(req);
  const activeLine = (id, scope) => db.prepare("SELECT * FROM production_lines WHERE id=? AND mill_id=? AND status='ACTIVE'").get(id, scope.millId);
  const activeRouting = (id, scope) => db.prepare("SELECT * FROM production_routings WHERE id=? AND mill_id=? AND status='ACTIVE'").get(id, scope.millId);
  const routingOutputs = (routing) => parse(routing?.outputs_json);
  const lineWithDependents = (line) => ({ ...line, millId: line.mill_id });
  const serializeOrder = (row) => ({
    ...row, shiftIds: parse(row.shift_ids_json), routingSnapshot: parse(row.routing_snapshot_json),
    allocations: db.prepare("SELECT * FROM production_order_allocations WHERE order_id=? ORDER BY id").all(row.id),
    outputs: db.prepare("SELECT * FROM production_order_outputs WHERE order_id=? ORDER BY id").all(row.id),
    audit: db.prepare("SELECT * FROM production_order_audit WHERE order_id=? ORDER BY id DESC").all(row.id).map((event) => ({ ...event, details: parse(event.details_json, {}) })),
  });
  const saveAudit = (orderId, scope, action, details) => db.prepare("INSERT INTO production_order_audit (order_id,tenant_id,actor_id,action,details_json,created_at) VALUES (?,?,?,?,?,?)").run(orderId, scope.tenantId, scope.actorId, action, JSON.stringify(details || {}), now());
  const nextOrderNo = (scope) => {
    const sequence = db.prepare("INSERT INTO production_order_sequences (tenant_id,mill_id,next_number) VALUES (?,?,2) ON CONFLICT(tenant_id,mill_id) DO UPDATE SET next_number=next_number+1 RETURNING next_number-1 AS value").get(scope.tenantId, scope.millId);
    return `PO-${now().slice(0, 10).replaceAll("-", "")}-${String(sequence.value).padStart(5, "0")}`;
  };
  const resolveAllocations = (allocations, excludeOrderId = null) => allocations.map((allocation) => {
    const contract = db.prepare("SELECT * FROM sales_contracts WHERE id=? AND state NOT IN ('CANCELLED','CLOSED')").get(allocation.contractId);
    const contractLines = parse(contract?.products_json); const line = contractLines[Number(allocation.contractLineId)];
    const planned = Number(db.prepare("SELECT COALESCE(SUM(planned_quantity),0) quantity FROM production_order_allocations WHERE contract_id=? AND contract_line_id=? AND order_id<>COALESCE(?,0) AND order_id IN (SELECT id FROM production_orders WHERE status NOT IN ('CANCELLED','CLOSED'))").get(allocation.contractId, String(allocation.contractLineId), excludeOrderId)?.quantity || 0);
    const fulfilled = Number(line?.fulfilledQuantity || line?.fulfilled || 0); const contractQuantity = Number(line?.quantity || line?.contractQuantity || 0);
    return { ...allocation, contractId: contract?.id, contractLineId: String(allocation.contractLineId), customer: contract?.customer || "", demandProduct: line?.product || line?.item || "", contractQuantity, fulfilledQuantity: fulfilled, alreadyPlannedQuantity: planned, remainingAvailableDemand: calculateRemainingDemand({ contractQuantity, fulfilledQuantity: fulfilled, plannedQuantity: planned }), demandUom: line?.uom || line?.unit || "MT", plannedQuantity: Number(allocation.plannedQuantity) };
  });

  app.get("/api/production-orders/context", (req, res) => {
    const scope = context(req);
    const contracts = db.prepare("SELECT * FROM sales_contracts WHERE state NOT IN ('CANCELLED','CLOSED') ORDER BY id DESC").all().map((contract) => ({
      id: contract.id, contractNumber: contract.contract_number, customer: contract.customer, state: contract.state,
      lines: parse(contract.products_json).map((line, index) => {
        const planned = Number(db.prepare("SELECT COALESCE(SUM(planned_quantity),0) quantity FROM production_order_allocations WHERE contract_id=? AND contract_line_id=? AND order_id IN (SELECT id FROM production_orders WHERE status NOT IN ('CANCELLED','CLOSED'))").get(contract.id, String(index)).quantity || 0);
        const fulfilled = Number(line.fulfilledQuantity || line.fulfilled || 0);
        return { ...line, lineId: String(index), product: line.product || line.item || "", contractQuantity: Number(line.quantity || line.contractQuantity || 0), fulfilledQuantity: fulfilled, alreadyPlannedQuantity: planned, remainingAvailableDemand: calculateRemainingDemand({ contractQuantity: line.quantity || line.contractQuantity, fulfilledQuantity: fulfilled, plannedQuantity: planned }), demandUom: line.uom || line.unit || "MT" };
      }),
    }));
    res.json({ mills: db.prepare("SELECT id,code,name,status FROM production_mills WHERE tenant_id=? AND status='ACTIVE' ORDER BY name").all(scope.tenantId), lines: db.prepare("SELECT * FROM production_lines WHERE mill_id=? AND status='ACTIVE' ORDER BY name").all(scope.millId).map(lineWithDependents), routings: db.prepare("SELECT * FROM production_routings WHERE mill_id=? AND status='ACTIVE' ORDER BY code").all(scope.millId).map((routing) => ({ ...routing, outputs: routingOutputs(routing) })), shifts: db.prepare("SELECT * FROM production_shifts WHERE mill_id=? AND status='ACTIVE' ORDER BY start_time").all(scope.millId), supervisors: db.prepare("SELECT id,name FROM users WHERE status='Active' ORDER BY name").all(), contracts });
  });

  app.get("/api/production-mills", (req, res) => { const scope = context(req); res.json(db.prepare("SELECT * FROM production_mills WHERE tenant_id=? ORDER BY name").all(scope.tenantId).map((mill) => ({ ...mill, audit: db.prepare("SELECT * FROM production_mill_audit WHERE mill_id=? AND tenant_id=? ORDER BY id DESC").all(mill.id, scope.tenantId) }))); });
  app.post("/api/production-mills", (req, res) => { const scope = context(req); const body = req.body || {}; const capacity = body.capacity === "" || body.capacity == null ? null : Number(body.capacity); if (!body.code || !body.name || !body.legalCompany || !body.address || !body.country || !body.state || !body.city || (capacity !== null && (!Number.isFinite(capacity) || capacity <= 0))) return res.status(400).json({ message: "Mill name, code, legal company and complete address are required; capacity is optional but must be positive when supplied." }); const id = `${scope.tenantId}-${String(body.code).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; const stamp = now(); try { db.transaction(() => { db.prepare("INSERT INTO production_mills (id,tenant_id,code,name,legal_company,address,country,state,city,capacity,capacity_uom,remarks,status,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, scope.tenantId, String(body.code).trim().toUpperCase(), String(body.name).trim(), String(body.legalCompany).trim(), String(body.address).trim(), String(body.country).trim(), String(body.state).trim(), String(body.city).trim(), capacity, body.capacityUom || "MT", body.remarks || "", body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE", stamp, scope.actorId); db.prepare("INSERT INTO production_mill_audit (mill_id,tenant_id,actor_id,action,details_json,created_at) VALUES (?,?,?,?,?,?)").run(id, scope.tenantId, scope.actorId, "MILL_CREATED", JSON.stringify({ code: body.code, name: body.name }), stamp); })(); res.status(201).json(db.prepare("SELECT * FROM production_mills WHERE id=?").get(id)); } catch (error) { const duplicate = error.code === "SQLITE_CONSTRAINT_UNIQUE"; res.status(duplicate ? 409 : 400).json({ message: duplicate ? "Mill code must be unique." : `Unable to save Mill Master record: ${error.message}` }); } });

  app.get("/api/production-orders", (req, res) => {
    const scope = context(req);
    const rows = db.prepare("SELECT * FROM production_orders WHERE tenant_id=? AND mill_id=? ORDER BY id DESC").all(scope.tenantId, scope.millId);
    res.json(rows.map(serializeOrder));
  });

  app.post("/api/production-orders", (req, res) => {
    const scope = context(req); const body = req.body; const line = activeLine(body.lineId, scope); const routing = activeRouting(body.routingId, scope);
    const errors = validateProductionOrder(body, { routingOutputs: routingOutputs(routing) });
    if (!line) errors.lineId = "Selected Production Line is not active for this Mill / Facility.";
    if (!routing) errors.routingId = "Selected Routing is not active for this Mill / Facility.";
    if (line && routing && line.id !== Number(body.lineId)) errors.lineId = "Production Line is invalid.";
    if (Object.keys(errors).length) return res.status(400).json({ code: "PRODUCTION_ORDER_VALIDATION_FAILED", message: Object.values(errors)[0], errors });
    const allocationRows = resolveAllocations(body.allocations);
    const allocationErrors = validateProductionOrder({ ...body, allocations: allocationRows }, { routingOutputs: routingOutputs(routing) });
    if (Object.keys(allocationErrors).length) return res.status(400).json({ code: "PRODUCTION_ORDER_VALIDATION_FAILED", message: Object.values(allocationErrors)[0], errors: allocationErrors });
    const duplicate = allocationRows.find((item, index) => allocationRows.findIndex((other) => other.contractId === item.contractId && String(other.contractLineId) === String(item.contractLineId)) !== index);
    if (duplicate) return res.status(400).json({ message: "The same Sales Contract Line cannot be allocated twice." });
    const orderId = db.transaction(() => {
      const orderNo = nextOrderNo(scope); const stamp = now();
      const info = db.prepare("INSERT INTO production_orders (tenant_id,mill_id,order_no,order_date,line_id,routing_id,description,planned_start,planned_end,planned_ffb_quantity,ffb_uom,shift_ids_json,supervisor_id,status,remarks,routing_snapshot_json,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(scope.tenantId, scope.millId, orderNo, body.orderDate, line.id, routing.id, body.description || "", body.plannedStart, body.plannedEnd, Number(body.plannedFfbQuantity), body.ffbUom || "MT", JSON.stringify(body.shiftIds || []), body.supervisorId || null, "DRAFT", body.remarks || "", JSON.stringify({ id: routing.id, code: routing.code, name: routing.name, version: routing.version, outputs: routingOutputs(routing), steps: db.prepare("SELECT * FROM production_route_steps WHERE routing_id=? ORDER BY sequence").all(routing.id) }), stamp, scope.actorId);
      const id = Number(info.lastInsertRowid); const insertAllocation = db.prepare("INSERT INTO production_order_allocations (order_id,contract_id,contract_line_id,customer,demand_product,contract_quantity,fulfilled_quantity,already_planned_quantity,remaining_available_demand,planned_quantity,demand_uom) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
      allocationRows.forEach((allocation) => insertAllocation.run(id, allocation.contractId, String(allocation.contractLineId), allocation.customer || "", allocation.demandProduct || "", Number(allocation.contractQuantity || 0), Number(allocation.fulfilledQuantity || 0), Number(allocation.alreadyPlannedQuantity || 0), Number(allocation.remainingAvailableDemand || 0), allocation.plannedQuantity, allocation.demandUom || "MT"));
      const insertOutput = db.prepare("INSERT INTO production_order_outputs (order_id,product,expected_quantity,output_uom,yield_percent,manual_override) VALUES (?,?,?,?,?,?)");
      (body.outputs || []).forEach((output) => insertOutput.run(id, output.product, output.expectedQuantity === "" || output.expectedQuantity == null ? calculateExpectedQuantity(body.plannedFfbQuantity, output.yieldPercent) : Number(output.expectedQuantity), output.outputUom || "MT", output.yieldPercent === "" ? null : Number(output.yieldPercent), output.manualOverride ? 1 : 0));
      saveAudit(id, scope, "PRODUCTION_ORDER_CREATED", { orderNo, status: "DRAFT" }); return id;
    })();
    res.status(201).json(serializeOrder(db.prepare("SELECT * FROM production_orders WHERE id=?").get(orderId)));
  });

  app.patch("/api/production-orders/:id", (req, res) => {
    const scope = context(req); const existing = db.prepare("SELECT * FROM production_orders WHERE id=? AND tenant_id=? AND mill_id=?").get(req.params.id, scope.tenantId, scope.millId);
    if (!existing) return res.status(404).json({ message: "Production Order not found." });
    if (existing.status !== "DRAFT") return res.status(409).json({ message: "Only Draft Production Orders can be edited." });
    const body = req.body; const line = activeLine(body.lineId || existing.line_id, scope); const routing = activeRouting(body.routingId || existing.routing_id, scope);
    const allocations = Array.isArray(body.allocations) ? resolveAllocations(body.allocations, existing.id) : db.prepare("SELECT * FROM production_order_allocations WHERE order_id=?").all(existing.id).map((item) => ({ ...item, contractId: item.contract_id, contractLineId: item.contract_line_id, plannedQuantity: item.planned_quantity, remainingAvailableDemand: item.remaining_available_demand, demandProduct: item.demand_product, demandUom: item.demand_uom }));
    const errors = validateProductionOrder({ ...body, orderDate: body.orderDate || existing.order_date, millId: body.millId || scope.millId, lineId: body.lineId || existing.line_id, routingId: body.routingId || existing.routing_id, plannedStart: body.plannedStart || existing.planned_start, plannedEnd: body.plannedEnd || existing.planned_end, plannedFfbQuantity: body.plannedFfbQuantity || existing.planned_ffb_quantity, allocations }, { routingOutputs: routingOutputs(routing) });
    if (!line) errors.lineId = "Selected Production Line is not active for this Mill / Facility."; if (!routing) errors.routingId = "Selected Routing is not active for this Mill / Facility.";
    if (Object.keys(errors).length) return res.status(400).json({ code: "PRODUCTION_ORDER_VALIDATION_FAILED", message: Object.values(errors)[0], errors });
    const update = db.transaction(() => {
      db.prepare("UPDATE production_orders SET order_date=?,line_id=?,routing_id=?,description=?,planned_start=?,planned_end=?,planned_ffb_quantity=?,ffb_uom=?,shift_ids_json=?,supervisor_id=?,remarks=?,routing_snapshot_json=?,updated_at=? WHERE id=? AND tenant_id=? AND mill_id=?").run(body.orderDate || existing.order_date, line.id, routing.id, body.description || "", body.plannedStart || existing.planned_start, body.plannedEnd || existing.planned_end, Number(body.plannedFfbQuantity || existing.planned_ffb_quantity), body.ffbUom || existing.ffb_uom, JSON.stringify(body.shiftIds || parse(existing.shift_ids_json)), body.supervisorId || existing.supervisor_id || null, body.remarks || "", JSON.stringify({ id: routing.id, code: routing.code, name: routing.name, version: routing.version, outputs: routingOutputs(routing), steps: db.prepare("SELECT * FROM production_route_steps WHERE routing_id=? ORDER BY sequence").all(routing.id) }), now(), existing.id, scope.tenantId, scope.millId);
      db.prepare("DELETE FROM production_order_allocations WHERE order_id=?").run(existing.id); const insertAllocation = db.prepare("INSERT INTO production_order_allocations (order_id,contract_id,contract_line_id,customer,demand_product,contract_quantity,fulfilled_quantity,already_planned_quantity,remaining_available_demand,planned_quantity,demand_uom) VALUES (?,?,?,?,?,?,?,?,?,?,?)"); allocations.forEach((allocation) => insertAllocation.run(existing.id, allocation.contractId, allocation.contractLineId, allocation.customer || "", allocation.demandProduct || "", Number(allocation.contractQuantity || 0), Number(allocation.fulfilledQuantity || 0), Number(allocation.alreadyPlannedQuantity || 0), Number(allocation.remainingAvailableDemand || 0), Number(allocation.plannedQuantity), allocation.demandUom || "MT"));
      db.prepare("DELETE FROM production_order_outputs WHERE order_id=?").run(existing.id); const insertOutput = db.prepare("INSERT INTO production_order_outputs (order_id,product,expected_quantity,output_uom,yield_percent,manual_override) VALUES (?,?,?,?,?,?)"); (body.outputs || []).forEach((output) => insertOutput.run(existing.id, output.product, output.expectedQuantity === "" || output.expectedQuantity == null ? calculateExpectedQuantity(body.plannedFfbQuantity || existing.planned_ffb_quantity, output.yieldPercent) : Number(output.expectedQuantity), output.outputUom || "MT", output.yieldPercent === "" ? null : Number(output.yieldPercent), output.manualOverride ? 1 : 0)); saveAudit(existing.id, scope, "PRODUCTION_ORDER_UPDATED", {});
    });
    update(); res.json(serializeOrder(db.prepare("SELECT * FROM production_orders WHERE id=?").get(existing.id)));
  });

  app.post("/api/production-orders/:id/status", (req, res) => {
    const scope = context(req); const existing = db.prepare("SELECT * FROM production_orders WHERE id=? AND tenant_id=? AND mill_id=?").get(req.params.id, scope.tenantId, scope.millId); const next = String(req.body.status || "").toUpperCase();
    if (!existing) return res.status(404).json({ message: "Production Order not found." });
    if (!canTransitionProductionOrder(existing.status, next)) return res.status(409).json({ message: `Cannot transition Production Order from ${existing.status} to ${next}.` });
    db.prepare("UPDATE production_orders SET status=?,updated_at=? WHERE id=? AND tenant_id=? AND mill_id=?").run(next, now(), existing.id, scope.tenantId, scope.millId); saveAudit(existing.id, scope, "PRODUCTION_ORDER_STATUS_CHANGED", { from: existing.status, to: next });
    res.json(serializeOrder(db.prepare("SELECT * FROM production_orders WHERE id=?").get(existing.id)));
  });

  app.get("/api/production-orders/:id/audit", (req, res) => { const scope = context(req); res.json(db.prepare("SELECT * FROM production_order_audit WHERE order_id=? AND tenant_id=? ORDER BY id DESC").all(req.params.id, scope.tenantId)); });
}
