import crypto from "node:crypto";
import { requestContext } from "./requestContext.js";
import { aggregateCheckpointResult, validateCheckpoint, validateCheckpointBatch, validateCheckpointParameters, validateObservation, evaluateQualityValue, isCheckpointEffective } from "../packages/quality/productionQualityDomain.js";
import { stationQualityCheckpointSeeds } from "../packages/quality/stationQualityStandards.js";

const now = () => new Date().toISOString();
const reference = (prefix) => `${prefix}-${now().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const processes = [
  ["Sterilization", "Cycle Wise"], ["Threshing", "Day Wise"], ["Digester", "Day Wise"], ["Pressing", "Day Wise"],
  ["Clarification", "Day Wise"], ["Purification", "Day Wise"], ["Vacuum", "Day Wise"], ["Storage Tank", "Day Wise"],
];

const toCheckpoint = (row) => row ? ({ ...row, mandatory: Boolean(row.mandatory), remarksRequiredOnFailure: Boolean(row.remarks_required_on_failure), correctiveActionRequired: Boolean(row.corrective_action_required), operationStage: row.operation_stage, machine: row.machine || "", dataType: row.data_type, targetValue: row.target_value, minLimit: row.min_limit, maxLimit: row.max_limit, warningMin: row.warning_min, warningMax: row.warning_max, samplingFrequency: row.sampling_frequency, sampleCount: row.sample_count, aggregationMethod: row.aggregation_method, passFailRule: row.pass_fail_rule, effectiveFrom: row.effective_from, effectiveTo: row.effective_to }) : null;
const toCheckpointParameter = (row) => row ? ({ ...row, checkpointId: row.checkpoint_id, dataType: row.data_type, targetValue: row.target_value, allowedVariancePercent: row.allowed_variance_percent, minLimit: row.min_limit, maxLimit: row.max_limit, warningMin: row.warning_min, warningMax: row.warning_max, passFailRule: row.pass_fail_rule }) : null;
const toObservation = (row) => row ? ({ ...row, checkpointId: row.checkpoint_id, observationNo: row.observation_no, operationStage: row.operation_stage, productionDate: row.production_date, cycleNumber: row.cycle_number, observedValue: row.observed_value, resultStatus: row.result_status, correctiveAction: row.corrective_action, recordedBy: row.recorded_by, recordedAt: row.recorded_at, verifiedBy: row.verified_by, verifiedAt: row.verified_at }) : null;

export function registerProductionQualityModule(app, db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_quality_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, name TEXT NOT NULL,
      process TEXT NOT NULL, operation_stage TEXT NOT NULL, frequency TEXT NOT NULL,
      sequence INTEGER NOT NULL DEFAULT 1, parameter TEXT NOT NULL, data_type TEXT NOT NULL DEFAULT 'DECIMAL',
      uom TEXT NOT NULL DEFAULT '', target_value TEXT NOT NULL DEFAULT '', min_limit REAL, max_limit REAL,
      warning_min REAL, warning_max REAL, mandatory INTEGER NOT NULL DEFAULT 1, sampling_frequency TEXT NOT NULL DEFAULT '',
      sample_count INTEGER NOT NULL DEFAULT 1, aggregation_method TEXT NOT NULL DEFAULT 'NONE', pass_fail_rule TEXT NOT NULL DEFAULT 'IN_RANGE',
      remarks_required_on_failure INTEGER NOT NULL DEFAULT 0, corrective_action_required INTEGER NOT NULL DEFAULT 0,
      effective_from TEXT NOT NULL, effective_to TEXT, version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'ACTIVE', created_by TEXT NOT NULL, created_at TEXT NOT NULL,
      updated_by TEXT, updated_at TEXT, UNIQUE(code, version)
    );
    CREATE TABLE IF NOT EXISTS production_quality_checkpoint_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, checkpoint_id INTEGER NOT NULL, version INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL, changed_by TEXT NOT NULL, changed_at TEXT NOT NULL,
      FOREIGN KEY (checkpoint_id) REFERENCES production_quality_checkpoints(id)
    );
    CREATE TABLE IF NOT EXISTS production_quality_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, observation_no TEXT NOT NULL UNIQUE, checkpoint_id INTEGER NOT NULL,
      checkpoint_version INTEGER NOT NULL, process TEXT NOT NULL, operation_stage TEXT NOT NULL, frequency TEXT NOT NULL,
      production_date TEXT NOT NULL, shift TEXT, run_id INTEGER, stage_id INTEGER, equipment TEXT, cycle_number TEXT,
      period_key TEXT NOT NULL, observed_value TEXT NOT NULL, uom TEXT NOT NULL DEFAULT '', result_status TEXT NOT NULL,
      evaluation_reason TEXT NOT NULL, remarks TEXT NOT NULL DEFAULT '', corrective_action TEXT NOT NULL DEFAULT '',
      config_snapshot_json TEXT NOT NULL, recorded_by TEXT NOT NULL, recorded_at TEXT NOT NULL,
      verified_by TEXT, verified_at TEXT, UNIQUE(checkpoint_id, production_date, cycle_number)
    );
    CREATE TABLE IF NOT EXISTS production_quality_observation_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT, observation_id INTEGER NOT NULL, checkpoint_parameter_id INTEGER,
      parameter TEXT NOT NULL, observed_value TEXT NOT NULL, uom TEXT NOT NULL DEFAULT '',
      result_status TEXT NOT NULL, evaluation_reason TEXT NOT NULL,
      FOREIGN KEY (observation_id) REFERENCES production_quality_observations(id),
      FOREIGN KEY (checkpoint_parameter_id) REFERENCES production_quality_checkpoint_parameters(id),
      UNIQUE(observation_id, parameter)
    );
    CREATE TABLE IF NOT EXISTS production_quality_audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
      action TEXT NOT NULL, actor TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_quality_checkpoint_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT, checkpoint_id INTEGER NOT NULL, parameter TEXT NOT NULL,
      data_type TEXT NOT NULL DEFAULT 'DECIMAL', uom TEXT NOT NULL DEFAULT '', material TEXT NOT NULL DEFAULT '',
      target_value TEXT NOT NULL DEFAULT '', allowed_variance_percent REAL, min_limit REAL, max_limit REAL, warning_min REAL, warning_max REAL,
      pass_fail_rule TEXT NOT NULL DEFAULT 'IN_RANGE', sequence INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (checkpoint_id) REFERENCES production_quality_checkpoints(id),
      UNIQUE(checkpoint_id, parameter)
    );
  `);

  for (const table of ["production_quality_checkpoints", "production_quality_observations", "production_quality_audit_events"]) {
    for (const column of ["tenant_id TEXT NOT NULL DEFAULT 'demo-tenant'", "mill_id TEXT NOT NULL DEFAULT 'demo-mill'"]) {
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`); } catch {}
    }
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_scope ON production_quality_checkpoints(tenant_id,mill_id,status,process)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_quality_observations_scope ON production_quality_observations(tenant_id,mill_id,production_date,result_status)");

  const checkpointParameterColumns = db.prepare("PRAGMA table_info(production_quality_checkpoint_parameters)").all().map((column) => column.name);
  if (!checkpointParameterColumns.includes("allowed_variance_percent")) db.exec("ALTER TABLE production_quality_checkpoint_parameters ADD COLUMN allowed_variance_percent REAL");
  const checkpointColumns = db.prepare("PRAGMA table_info(production_quality_checkpoints)").all().map((column) => column.name);
  if (!checkpointColumns.includes("machine")) db.exec("ALTER TABLE production_quality_checkpoints ADD COLUMN machine TEXT NOT NULL DEFAULT ''");

  if (!db.prepare("SELECT COUNT(*) count FROM production_quality_checkpoints").get().count) {
    const insert = db.prepare(`INSERT INTO production_quality_checkpoints (code,name,process,operation_stage,frequency,sequence,parameter,data_type,uom,target_value,min_limit,max_limit,warning_min,warning_max,mandatory,sampling_frequency,sample_count,aggregation_method,pass_fail_rule,remarks_required_on_failure,corrective_action_required,effective_from,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const seeded = [
      ["STER-TEMP", "Sterilizer temperature", "Sterilization", "Sterilizer cycle", "CYCLE", 1, "Temperature", "DECIMAL", "°C", "140", 135, 145, 137, 143],
      ["THR-LOSS", "Threshing loss", "Threshing", "Threshing line", "DAY", 1, "Loss", "DECIMAL", "%", "1.5", 0, 2, 0, 1.5],
      ["DIG-TEMP", "Digester temperature", "Digester", "Digester operation", "DAY", 1, "Temperature", "DECIMAL", "°C", "90", 85, 95, 87, 93],
      ["PRS-FFA", "Pressing FFA", "Pressing", "Screw press", "DAY", 1, "FFA", "DECIMAL", "%", "3.5", 0, 4.5, 0, 4],
      ["CLR-MOIST", "Clarification moisture", "Clarification", "Clarifier", "DAY", 1, "Moisture", "DECIMAL", "%", "0.25", 0, 0.5, 0, 0.35],
      ["PUR-MOIST", "Purification moisture", "Purification", "Purifier", "DAY", 1, "Moisture", "DECIMAL", "%", "0.2", 0, 0.4, 0, 0.3],
      ["VAC-TEMP", "Vacuum dryer temperature", "Vacuum", "Vacuum dryer", "DAY", 1, "Temperature", "DECIMAL", "°C", "105", 95, 115, 98, 112],
      ["TANK-TEMP", "Storage tank temperature", "Storage Tank", "CPO tank", "DAY", 1, "Temperature", "DECIMAL", "°C", "50", 40, 60, 43, 57],
    ];
    seeded.forEach(([code, name, process, stage, frequency, sequence, parameter, dataType, uom, target, min, max, warningMin, warningMax]) => insert.run(code, name, process, stage, frequency, sequence, parameter, dataType, uom, target, min, max, warningMin, warningMax, 1, "", 1, "NONE", "IN_RANGE", 1, 0, "2026-01-01", "ACTIVE", "System", now()));
  }

  const standardCheckpointInsert = db.prepare(`INSERT INTO production_quality_checkpoints (code,name,process,operation_stage,frequency,sequence,parameter,data_type,uom,target_value,min_limit,max_limit,warning_min,warning_max,mandatory,sampling_frequency,sample_count,aggregation_method,pass_fail_rule,remarks_required_on_failure,corrective_action_required,effective_from,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  db.transaction(() => {
    stationQualityCheckpointSeeds().forEach((checkpoint) => {
      if (db.prepare("SELECT 1 FROM production_quality_checkpoints WHERE code=? AND version=1").get(checkpoint.code)) return;
      standardCheckpointInsert.run(checkpoint.code, checkpoint.name, checkpoint.process, checkpoint.operationStage, checkpoint.frequency, checkpoint.sequence, checkpoint.parameter, checkpoint.dataType, checkpoint.uom, checkpoint.targetValue, checkpoint.minLimit, checkpoint.maxLimit, checkpoint.warningMin, checkpoint.warningMax, checkpoint.mandatory ? 1 : 0, checkpoint.samplingFrequency, checkpoint.sampleCount, checkpoint.aggregationMethod, checkpoint.passFailRule, checkpoint.remarksRequiredOnFailure ? 1 : 0, checkpoint.correctiveActionRequired ? 1 : 0, checkpoint.effectiveFrom, checkpoint.status, "System", now());
    });
  })();

  // Consolidate the original Clarification demo rows into the combined checkpoint model.
  const legacyClarificationCodes = ["QC-CLR-FFA", "QC-CLR-MOIST", "QC-CLR-IMP", "QC-CLR-DOBI", "QC-CLR-COLOR", "QC-CLR-NOS", "QC-CLR-DIRT"];
  db.transaction(() => {
    legacyClarificationCodes.forEach((code) => {
      const checkpoint = db.prepare("SELECT id, created_by FROM production_quality_checkpoints WHERE code=?").get(code);
      if (!checkpoint || checkpoint.created_by !== "System") return;
      const observations = db.prepare("SELECT COUNT(*) count FROM production_quality_observations WHERE checkpoint_id=?").get(checkpoint.id).count;
      if (observations) return;
      db.prepare("DELETE FROM production_quality_checkpoint_parameters WHERE checkpoint_id=?").run(checkpoint.id);
      db.prepare("DELETE FROM production_quality_checkpoints WHERE id=?").run(checkpoint.id);
    });
  })();

  const parameterInsert = db.prepare("INSERT OR IGNORE INTO production_quality_checkpoint_parameters (checkpoint_id,parameter,data_type,uom,target_value,allowed_variance_percent,min_limit,max_limit,warning_min,warning_max,pass_fail_rule,sequence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  db.transaction(() => {
    const seedsByCode = new Map(stationQualityCheckpointSeeds().map((seed) => [seed.code, seed]));
    db.prepare("SELECT * FROM production_quality_checkpoints").all().forEach((checkpoint) => {
      const seed = seedsByCode.get(checkpoint.code);
      const parameterSeeds = seed?.parameters?.length ? seed.parameters : [seed];
      parameterSeeds.forEach((parameter) => parameterInsert.run(checkpoint.id, parameter?.parameter || checkpoint.parameter, parameter?.dataType || checkpoint.data_type, parameter?.uom || checkpoint.uom, parameter?.targetValue || checkpoint.target_value, parameter?.allowedVariancePercent ?? null, parameter?.minLimit ?? checkpoint.min_limit, parameter?.maxLimit ?? checkpoint.max_limit, parameter?.warningMin ?? checkpoint.warning_min, parameter?.warningMax ?? checkpoint.warning_max, parameter?.passFailRule || checkpoint.pass_fail_rule, Number(parameter?.sequence || 1)));
    });
  })();

  // Enrich only untouched system-seeded Clarification records so existing demo databases receive the practical defaults.
  const clarificationSeeds = stationQualityCheckpointSeeds().filter((seed) => seed.process === "Clarification" && seed.maxLimit !== null);
  db.transaction(() => {
    clarificationSeeds.forEach((seed) => {
      const checkpoint = db.prepare("SELECT * FROM production_quality_checkpoints WHERE code=? AND created_by='System'").get(seed.code);
      if (!checkpoint || checkpoint.max_limit !== null) return;
      db.prepare("UPDATE production_quality_checkpoints SET target_value=?, min_limit=?, max_limit=?, warning_min=?, warning_max=? WHERE id=?").run(seed.targetValue, seed.minLimit, seed.maxLimit, seed.warningMin, seed.warningMax, checkpoint.id);
      db.prepare("UPDATE production_quality_checkpoint_parameters SET target_value=?, allowed_variance_percent=?, min_limit=?, max_limit=?, warning_min=?, warning_max=? WHERE checkpoint_id=?").run(seed.targetValue, seed.allowedVariancePercent, seed.minLimit, seed.maxLimit, seed.warningMin, seed.warningMax, checkpoint.id);
    });
  })();

  const audit = (entityType, entityId, action, actor, details, scope = { tenantId: "demo-tenant", millId: "demo-mill" }) => db.prepare("INSERT INTO production_quality_audit_events (tenant_id,mill_id,entity_type,entity_id,action,actor,details_json,created_at) VALUES (?,?,?,?,?,?,?,?)").run(scope.tenantId, scope.millId, entityType, entityId, action, actor, JSON.stringify(details || {}), now());
  const replaceCheckpointParameters = (checkpointId, parameters, fallback) => {
    const rows = Array.isArray(parameters) && parameters.length ? parameters : [fallback];
    const insert = db.prepare("INSERT INTO production_quality_checkpoint_parameters (checkpoint_id,parameter,data_type,uom,material,target_value,allowed_variance_percent,min_limit,max_limit,warning_min,warning_max,pass_fail_rule,sequence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
    db.prepare("DELETE FROM production_quality_checkpoint_parameters WHERE checkpoint_id=?").run(checkpointId);
    rows.forEach((parameter, index) => insert.run(checkpointId, parameter.parameter, parameter.dataType, parameter.uom || "", parameter.material || "", parameter.targetValue || "", parameter.allowedVariancePercent, parameter.minLimit, parameter.maxLimit, parameter.warningMin, parameter.warningMax, parameter.passFailRule, Number(parameter.sequence || index + 1)));
  };
  const checkpointParameters = (checkpointId) => db.prepare("SELECT * FROM production_quality_checkpoint_parameters WHERE checkpoint_id=? ORDER BY sequence, id").all(checkpointId).map(toCheckpointParameter);
  const observationResults = (observationId) => db.prepare("SELECT * FROM production_quality_observation_results WHERE observation_id=? ORDER BY id").all(observationId).map((row) => ({ ...row, observationId: row.observation_id, checkpointParameterId: row.checkpoint_parameter_id, observedValue: row.observed_value, resultStatus: row.result_status, evaluationReason: row.evaluation_reason }));
  const withObservationResults = (row) => row ? ({ ...toObservation(row), parameters: observationResults(row.id) }) : null;
  const withParameters = (row) => {
    if (!row) return null;
    const parameters = checkpointParameters(row.id);
    return { ...toCheckpoint(row), parameter: parameters.length > 1 ? parameters.map((item) => item.parameter).join(", ") : toCheckpoint(row).parameter, parameters };
  };
  const listCheckpoints = (query = {}, scope = { tenantId: "demo-tenant", millId: "demo-mill" }) => {
    const terms = ["tenant_id=?", "mill_id=?"];
    const args = [scope.tenantId, scope.millId];
    if (query.search) { terms.push("(code LIKE ? OR name LIKE ? OR parameter LIKE ?)"); args.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`); }
    if (query.process) { terms.push("process=?"); args.push(query.process); }
    if (query.frequency) { terms.push("frequency=?"); args.push(query.frequency); }
    if (query.status) { terms.push("status=?"); args.push(query.status); }
    const where = terms.length ? `WHERE ${terms.join(" AND ")}` : "";
    return db.prepare(`SELECT * FROM production_quality_checkpoints ${where} ORDER BY process, sequence, code`).all(...args).map(withParameters);
  };

  app.get("/api/production-quality/processes", (_req, res) => res.json(processes.map(([name, frequency]) => ({ name, frequency }))));
  app.get("/api/production-quality/checkpoints", (req, res) => res.json(listCheckpoints(req.query, requestContext(req))));
  app.get("/api/production-quality/checkpoints/:id", (req, res) => {
    const { tenantId, millId } = requestContext(req);
    const checkpoint = withParameters(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=? AND tenant_id=? AND mill_id=?").get(req.params.id, tenantId, millId));
    if (!checkpoint) return res.status(404).json({ message: "Quality checkpoint not found." });
    const history = db.prepare("SELECT * FROM production_quality_checkpoint_versions WHERE checkpoint_id=? ORDER BY version DESC").all(req.params.id);
    res.json({ ...checkpoint, history });
  });
  app.post("/api/production-quality/checkpoints/bulk", (req, res) => {
    const scope = requestContext(req);
    const actor = scope.actorId;
    const existing = listCheckpoints({}, scope);
    const validation = validateCheckpointBatch(req.body.checkpoints, existing);
    if (!validation.valid) return res.status(400).json({ message: "Checkpoint batch is invalid.", errors: validation.errors });
    const insert = db.prepare(`INSERT INTO production_quality_checkpoints (tenant_id,mill_id,code,name,process,operation_stage,frequency,sequence,parameter,data_type,uom,target_value,min_limit,max_limit,warning_min,warning_max,mandatory,sampling_frequency,sample_count,aggregation_method,pass_fail_rule,remarks_required_on_failure,corrective_action_required,effective_from,effective_to,version,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    try {
      const createdIds = db.transaction(() => validation.value.map((value) => {
      const info = insert.run(value.code, value.name, value.process, value.operationStage, value.frequency, value.sequence, value.parameter, value.dataType, value.uom, value.targetValue, value.minLimit, value.maxLimit, value.warningMin, value.warningMax, value.mandatory ? 1 : 0, value.samplingFrequency, value.sampleCount, value.aggregationMethod, value.passFailRule, value.remarksRequiredOnFailure ? 1 : 0, value.correctiveActionRequired ? 1 : 0, value.effectiveFrom || now().slice(0, 10), value.effectiveTo || null, 1, value.status, actor, now());
        audit("checkpoint", info.lastInsertRowid, "CREATED", actor, value, scope);
        return info.lastInsertRowid;
      }))();
      res.status(201).json(createdIds.map((id) => toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(id))));
    } catch (error) { res.status(400).json({ message: error.code === "SQLITE_CONSTRAINT_UNIQUE" ? "Checkpoint code and version must be unique." : "Unable to save checkpoint batch." }); }
  });
  app.post("/api/production-quality/checkpoints", (req, res) => {
    const scope = requestContext(req);
    const actor = scope.actorId;
    const existing = listCheckpoints({}, scope);
    const firstParameter = Array.isArray(req.body.parameters) ? req.body.parameters[0] : null;
    const validation = validateCheckpoint({ ...req.body, ...(firstParameter || {}), parameter: firstParameter?.parameter || req.body.parameter, process: req.body.process, code: req.body.code, name: req.body.name }, existing);
    if (!validation.valid) return res.status(400).json({ message: "Checkpoint configuration is invalid.", errors: validation.errors });
    const parameterValidation = validateCheckpointParameters(req.body.parameters, req.body);
    if (!parameterValidation.valid) return res.status(400).json({ message: "Checkpoint parameters are invalid.", errors: parameterValidation.errors });
    const value = validation.value;
    try {
      const info = db.prepare(`INSERT INTO production_quality_checkpoints (tenant_id,mill_id,code,name,process,machine,operation_stage,frequency,sequence,parameter,data_type,uom,target_value,min_limit,max_limit,warning_min,warning_max,mandatory,sampling_frequency,sample_count,aggregation_method,pass_fail_rule,remarks_required_on_failure,corrective_action_required,effective_from,effective_to,version,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(scope.tenantId, scope.millId, value.code, value.name, value.process, value.machine || "", value.operationStage, value.frequency, value.sequence, value.parameter, value.dataType, value.uom, value.targetValue, value.minLimit, value.maxLimit, value.warningMin, value.warningMax, value.mandatory ? 1 : 0, value.samplingFrequency, value.sampleCount, value.aggregationMethod, value.passFailRule, value.remarksRequiredOnFailure ? 1 : 0, value.correctiveActionRequired ? 1 : 0, value.effectiveFrom || now().slice(0, 10), value.effectiveTo || null, 1, value.status, actor, now());
      replaceCheckpointParameters(info.lastInsertRowid, req.body.parameters, value);
      audit("checkpoint", info.lastInsertRowid, "CREATED", actor, value, scope);
      res.status(201).json(toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(info.lastInsertRowid)));
    } catch (error) { res.status(400).json({ message: error.code === "SQLITE_CONSTRAINT_UNIQUE" ? "Checkpoint code and version must be unique." : "Unable to save checkpoint." }); }
  });
  app.patch("/api/production-quality/checkpoints/:id", (req, res) => {
    const scope = requestContext(req);
    const current = toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=? AND tenant_id=? AND mill_id=?").get(req.params.id, scope.tenantId, scope.millId));
    if (!current) return res.status(404).json({ message: "Quality checkpoint not found." });
    const actor = scope.actorId;
    const firstParameter = Array.isArray(req.body.parameters) ? req.body.parameters[0] : null;
    const candidate = { ...current, ...req.body, ...(firstParameter || {}), parameter: firstParameter?.parameter || req.body.parameter || current.parameter, id: current.id, version: current.version + 1 };
    const validation = validateCheckpoint(candidate, listCheckpoints({}, scope));
    if (!validation.valid) return res.status(400).json({ message: "Checkpoint configuration is invalid.", errors: validation.errors });
    const parameterValidation = validateCheckpointParameters(req.body.parameters, candidate);
    if (!parameterValidation.valid) return res.status(400).json({ message: "Checkpoint parameters are invalid.", errors: parameterValidation.errors });
    const value = validation.value;
    db.transaction(() => {
      db.prepare("INSERT INTO production_quality_checkpoint_versions (checkpoint_id,version,snapshot_json,changed_by,changed_at) VALUES (?,?,?,?,?)").run(current.id, current.version, JSON.stringify(current), actor, now());
      db.prepare(`UPDATE production_quality_checkpoints SET code=?,name=?,process=?,machine=?,operation_stage=?,frequency=?,sequence=?,parameter=?,data_type=?,uom=?,target_value=?,min_limit=?,max_limit=?,warning_min=?,warning_max=?,mandatory=?,sampling_frequency=?,sample_count=?,aggregation_method=?,pass_fail_rule=?,remarks_required_on_failure=?,corrective_action_required=?,effective_from=?,effective_to=?,version=?,status=?,updated_by=?,updated_at=? WHERE id=?`).run(value.code, value.name, value.process, value.machine || "", value.operationStage, value.frequency, value.sequence, value.parameter, value.dataType, value.uom, value.targetValue, value.minLimit, value.maxLimit, value.warningMin, value.warningMax, value.mandatory ? 1 : 0, value.samplingFrequency, value.sampleCount, value.aggregationMethod, value.passFailRule, value.remarksRequiredOnFailure ? 1 : 0, value.correctiveActionRequired ? 1 : 0, value.effectiveFrom, value.effectiveTo || null, value.version, value.status, actor, now(), current.id);
      replaceCheckpointParameters(current.id, req.body.parameters, value);
      audit("checkpoint", current.id, "UPDATED", actor, value, scope);
    })();
    res.json(toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(current.id)));
  });
  app.get("/api/production-quality/observations", (req, res) => {
    const { tenantId, millId } = requestContext(req);
    const terms = ["o.tenant_id=?", "o.mill_id=?"]; const args = [tenantId, millId];
    if (req.query.process) { terms.push("o.process=?"); args.push(req.query.process); }
    if (req.query.status) { terms.push("o.result_status=?"); args.push(req.query.status); }
    if (req.query.productionDate) { terms.push("o.production_date=?"); args.push(req.query.productionDate); }
    const where = terms.length ? `WHERE ${terms.join(" AND ")}` : "";
    res.json(db.prepare(`SELECT o.*, c.code checkpoint_code, c.name checkpoint_name FROM production_quality_observations o JOIN production_quality_checkpoints c ON c.id=o.checkpoint_id ${where} ORDER BY o.recorded_at DESC`).all(...args).map(withObservationResults));
  });
  app.get("/api/production-quality/observations/:id", (req, res) => {
    const { tenantId, millId } = requestContext(req);
    const row = db.prepare("SELECT o.*, c.code checkpoint_code, c.name checkpoint_name FROM production_quality_observations o JOIN production_quality_checkpoints c ON c.id=o.checkpoint_id WHERE o.id=? AND o.tenant_id=? AND o.mill_id=?").get(req.params.id, tenantId, millId);
    if (!row) return res.status(404).json({ message: "Production quality record not found." });
    res.json({ ...withObservationResults(row), configSnapshot: JSON.parse(row.config_snapshot_json || "{}"), audit: db.prepare("SELECT * FROM production_quality_audit_events WHERE entity_type='observation' AND entity_id=? AND tenant_id=? AND mill_id=? ORDER BY created_at DESC").all(req.params.id, tenantId, millId) });
  });
  app.post("/api/production-quality/observations", (req, res) => {
    const scope = requestContext(req);
    const checkpoint = withParameters(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=? AND tenant_id=? AND mill_id=?").get(req.body.checkpointId, scope.tenantId, scope.millId));
    if (!checkpoint || !isCheckpointEffective(checkpoint, req.body.productionDate)) return res.status(400).json({ message: "No effective active checkpoint configuration was found." });
    const existing = db.prepare("SELECT checkpoint_id checkpointId, production_date productionDate, cycle_number cycleNumber FROM production_quality_observations WHERE checkpoint_id=? AND tenant_id=? AND mill_id=? AND production_date=?").all(checkpoint.id, scope.tenantId, scope.millId, String(req.body.productionDate).slice(0, 10));
    const configuredParameters = checkpoint.parameters?.length ? checkpoint.parameters : [checkpoint];
    const submittedParameters = Array.isArray(req.body.parameters) ? req.body.parameters : [{ parameter: checkpoint.parameter, observedValue: req.body.observedValue }];
    const parameterResults = configuredParameters.map((parameter) => {
      const submitted = submittedParameters.find((item) => String(item.parameterId || item.parameter || "") === String(parameter.id || parameter.parameter));
      const evaluation = submitted ? evaluateQualityValue(parameter, submitted.observedValue) : { status: checkpoint.mandatory ? "FAIL" : "WARNING", reason: "VALUE_REQUIRED" };
      return { parameterId: parameter.id, parameter: parameter.parameter, observedValue: submitted?.observedValue ?? "", uom: parameter.uom, ...evaluation };
    });
    const evaluation = aggregateCheckpointResult(parameterResults);
    const validation = validateObservation({ ...req.body, parameters: parameterResults, observedValue: "MULTI_PARAMETER", resultStatus: evaluation.status, evaluationReason: evaluation.reason }, checkpoint, existing);
    if (!validation.valid) return res.status(400).json({ message: "Production quality record is invalid.", errors: validation.errors });
    const actor = scope.actorId;
    try {
      const info = db.prepare(`INSERT INTO production_quality_observations (tenant_id,mill_id,observation_no,checkpoint_id,checkpoint_version,process,operation_stage,frequency,production_date,shift,run_id,stage_id,equipment,cycle_number,period_key,observed_value,uom,result_status,evaluation_reason,remarks,corrective_action,config_snapshot_json,recorded_by,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(scope.tenantId, scope.millId, reference("PQC"), checkpoint.id, checkpoint.version, checkpoint.process, checkpoint.operationStage, checkpoint.frequency, String(req.body.productionDate).slice(0, 10), req.body.shift || null, req.body.runId || null, req.body.stageId || null, req.body.equipment || null, req.body.cycleNumber || null, `${req.body.productionDate}:${req.body.cycleNumber || "DAY"}`, "MULTI_PARAMETER", "", evaluation.status, evaluation.reason, req.body.remarks || "", req.body.correctiveAction || "", JSON.stringify(checkpoint), actor, now());
      const resultInsert = db.prepare("INSERT INTO production_quality_observation_results (observation_id,checkpoint_parameter_id,parameter,observed_value,uom,result_status,evaluation_reason) VALUES (?,?,?,?,?,?,?)");
      parameterResults.forEach((result) => resultInsert.run(info.lastInsertRowid, result.parameterId || null, result.parameter, String(result.observedValue), result.uom || "", result.status, result.reason));
      audit("observation", info.lastInsertRowid, "RECORDED", actor, { checkpointId: checkpoint.id, resultStatus: evaluation.status }, scope);
      res.status(201).json(withObservationResults(db.prepare("SELECT * FROM production_quality_observations WHERE id=?").get(info.lastInsertRowid)));
    } catch (error) { res.status(400).json({ message: error.code === "SQLITE_CONSTRAINT_UNIQUE" ? "A record already exists for this checkpoint and production period." : "Unable to record production quality." }); }
  });
}
