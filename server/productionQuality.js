import crypto from "node:crypto";
import { validateCheckpoint, validateObservation, evaluateQualityValue, isCheckpointEffective } from "../packages/quality/productionQualityDomain.js";
import { stationQualityCheckpointSeeds } from "../packages/quality/stationQualityStandards.js";

const now = () => new Date().toISOString();
const reference = (prefix) => `${prefix}-${now().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const processes = [
  ["Sterilization", "Cycle Wise"], ["Threshing", "Day Wise"], ["Digester", "Day Wise"], ["Pressing", "Day Wise"],
  ["Clarification", "Day Wise"], ["Purification", "Day Wise"], ["Vacuum", "Day Wise"], ["Storage Tank", "Day Wise"],
];

const toCheckpoint = (row) => row ? ({ ...row, mandatory: Boolean(row.mandatory), remarksRequiredOnFailure: Boolean(row.remarks_required_on_failure), correctiveActionRequired: Boolean(row.corrective_action_required), operationStage: row.operation_stage, dataType: row.data_type, targetValue: row.target_value, minLimit: row.min_limit, maxLimit: row.max_limit, warningMin: row.warning_min, warningMax: row.warning_max, samplingFrequency: row.sampling_frequency, sampleCount: row.sample_count, aggregationMethod: row.aggregation_method, passFailRule: row.pass_fail_rule, effectiveFrom: row.effective_from, effectiveTo: row.effective_to }) : null;
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
    CREATE TABLE IF NOT EXISTS production_quality_audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
      action TEXT NOT NULL, actor TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);

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

  const audit = (entityType, entityId, action, actor, details) => db.prepare("INSERT INTO production_quality_audit_events (entity_type,entity_id,action,actor,details_json,created_at) VALUES (?,?,?,?,?,?)").run(entityType, entityId, action, actor, JSON.stringify(details || {}), now());
  const listCheckpoints = (query = {}) => {
    const terms = [];
    const args = [];
    if (query.search) { terms.push("(code LIKE ? OR name LIKE ? OR parameter LIKE ?)"); args.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`); }
    if (query.process) { terms.push("process=?"); args.push(query.process); }
    if (query.frequency) { terms.push("frequency=?"); args.push(query.frequency); }
    if (query.status) { terms.push("status=?"); args.push(query.status); }
    const where = terms.length ? `WHERE ${terms.join(" AND ")}` : "";
    return db.prepare(`SELECT * FROM production_quality_checkpoints ${where} ORDER BY process, sequence, code`).all(...args).map(toCheckpoint);
  };

  app.get("/api/production-quality/processes", (_req, res) => res.json(processes.map(([name, frequency]) => ({ name, frequency }))));
  app.get("/api/production-quality/checkpoints", (req, res) => res.json(listCheckpoints(req.query)));
  app.get("/api/production-quality/checkpoints/:id", (req, res) => {
    const checkpoint = toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(req.params.id));
    if (!checkpoint) return res.status(404).json({ message: "Quality checkpoint not found." });
    const history = db.prepare("SELECT * FROM production_quality_checkpoint_versions WHERE checkpoint_id=? ORDER BY version DESC").all(req.params.id);
    res.json({ ...checkpoint, history });
  });
  app.post("/api/production-quality/checkpoints", (req, res) => {
    const actor = req.body.createdBy || "Sean Shapiro";
    const existing = listCheckpoints();
    const validation = validateCheckpoint(req.body, existing);
    if (!validation.valid) return res.status(400).json({ message: "Checkpoint configuration is invalid.", errors: validation.errors });
    const value = validation.value;
    try {
      const info = db.prepare(`INSERT INTO production_quality_checkpoints (code,name,process,operation_stage,frequency,sequence,parameter,data_type,uom,target_value,min_limit,max_limit,warning_min,warning_max,mandatory,sampling_frequency,sample_count,aggregation_method,pass_fail_rule,remarks_required_on_failure,corrective_action_required,effective_from,effective_to,version,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(value.code, value.name, value.process, value.operationStage, value.frequency, value.sequence, value.parameter, value.dataType, value.uom, value.targetValue, value.minLimit, value.maxLimit, value.warningMin, value.warningMax, value.mandatory ? 1 : 0, value.samplingFrequency, value.sampleCount, value.aggregationMethod, value.passFailRule, value.remarksRequiredOnFailure ? 1 : 0, value.correctiveActionRequired ? 1 : 0, value.effectiveFrom || now().slice(0, 10), value.effectiveTo || null, 1, value.status, actor, now());
      audit("checkpoint", info.lastInsertRowid, "CREATED", actor, value);
      res.status(201).json(toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(info.lastInsertRowid)));
    } catch (error) { res.status(400).json({ message: error.code === "SQLITE_CONSTRAINT_UNIQUE" ? "Checkpoint code and version must be unique." : "Unable to save checkpoint." }); }
  });
  app.patch("/api/production-quality/checkpoints/:id", (req, res) => {
    const current = toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(req.params.id));
    if (!current) return res.status(404).json({ message: "Quality checkpoint not found." });
    const actor = req.body.updatedBy || "Sean Shapiro";
    const candidate = { ...current, ...req.body, id: current.id, version: current.version + 1 };
    const validation = validateCheckpoint(candidate, listCheckpoints());
    if (!validation.valid) return res.status(400).json({ message: "Checkpoint configuration is invalid.", errors: validation.errors });
    const value = validation.value;
    db.transaction(() => {
      db.prepare("INSERT INTO production_quality_checkpoint_versions (checkpoint_id,version,snapshot_json,changed_by,changed_at) VALUES (?,?,?,?,?)").run(current.id, current.version, JSON.stringify(current), actor, now());
      db.prepare(`UPDATE production_quality_checkpoints SET code=?,name=?,process=?,operation_stage=?,frequency=?,sequence=?,parameter=?,data_type=?,uom=?,target_value=?,min_limit=?,max_limit=?,warning_min=?,warning_max=?,mandatory=?,sampling_frequency=?,sample_count=?,aggregation_method=?,pass_fail_rule=?,remarks_required_on_failure=?,corrective_action_required=?,effective_from=?,effective_to=?,version=?,status=?,updated_by=?,updated_at=? WHERE id=?`).run(value.code, value.name, value.process, value.operationStage, value.frequency, value.sequence, value.parameter, value.dataType, value.uom, value.targetValue, value.minLimit, value.maxLimit, value.warningMin, value.warningMax, value.mandatory ? 1 : 0, value.samplingFrequency, value.sampleCount, value.aggregationMethod, value.passFailRule, value.remarksRequiredOnFailure ? 1 : 0, value.correctiveActionRequired ? 1 : 0, value.effectiveFrom, value.effectiveTo || null, value.version, value.status, actor, now(), current.id);
      audit("checkpoint", current.id, "UPDATED", actor, value);
    })();
    res.json(toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(current.id)));
  });
  app.get("/api/production-quality/observations", (req, res) => {
    const terms = []; const args = [];
    if (req.query.process) { terms.push("o.process=?"); args.push(req.query.process); }
    if (req.query.status) { terms.push("o.result_status=?"); args.push(req.query.status); }
    if (req.query.productionDate) { terms.push("o.production_date=?"); args.push(req.query.productionDate); }
    const where = terms.length ? `WHERE ${terms.join(" AND ")}` : "";
    res.json(db.prepare(`SELECT o.*, c.code checkpoint_code, c.name checkpoint_name FROM production_quality_observations o JOIN production_quality_checkpoints c ON c.id=o.checkpoint_id ${where} ORDER BY o.recorded_at DESC`).all(...args).map(toObservation));
  });
  app.get("/api/production-quality/observations/:id", (req, res) => {
    const row = db.prepare("SELECT o.*, c.code checkpoint_code, c.name checkpoint_name FROM production_quality_observations o JOIN production_quality_checkpoints c ON c.id=o.checkpoint_id WHERE o.id=?").get(req.params.id);
    if (!row) return res.status(404).json({ message: "Production quality record not found." });
    res.json({ ...toObservation(row), configSnapshot: JSON.parse(row.config_snapshot_json || "{}"), audit: db.prepare("SELECT * FROM production_quality_audit_events WHERE entity_type='observation' AND entity_id=? ORDER BY created_at DESC").all(req.params.id) });
  });
  app.post("/api/production-quality/observations", (req, res) => {
    const checkpoint = toCheckpoint(db.prepare("SELECT * FROM production_quality_checkpoints WHERE id=?").get(req.body.checkpointId));
    if (!checkpoint || !isCheckpointEffective(checkpoint, req.body.productionDate)) return res.status(400).json({ message: "No effective active checkpoint configuration was found." });
    const existing = db.prepare("SELECT checkpoint_id checkpointId, production_date productionDate, cycle_number cycleNumber FROM production_quality_observations WHERE checkpoint_id=? AND production_date=?").all(checkpoint.id, String(req.body.productionDate).slice(0, 10));
    const evaluation = evaluateQualityValue(checkpoint, req.body.observedValue);
    const validation = validateObservation({ ...req.body, resultStatus: evaluation.status }, checkpoint, existing);
    if (!validation.valid) return res.status(400).json({ message: "Production quality record is invalid.", errors: validation.errors });
    const actor = req.body.recordedBy || "Sean Shapiro";
    try {
      const info = db.prepare(`INSERT INTO production_quality_observations (observation_no,checkpoint_id,checkpoint_version,process,operation_stage,frequency,production_date,shift,run_id,stage_id,equipment,cycle_number,period_key,observed_value,uom,result_status,evaluation_reason,remarks,corrective_action,config_snapshot_json,recorded_by,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(reference("PQC"), checkpoint.id, checkpoint.version, checkpoint.process, checkpoint.operationStage, checkpoint.frequency, String(req.body.productionDate).slice(0, 10), req.body.shift || null, req.body.runId || null, req.body.stageId || null, req.body.equipment || null, req.body.cycleNumber || null, `${req.body.productionDate}:${req.body.cycleNumber || "DAY"}`, String(req.body.observedValue), req.body.uom || checkpoint.uom, evaluation.status, evaluation.reason, req.body.remarks || "", req.body.correctiveAction || "", JSON.stringify(checkpoint), actor, now());
      audit("observation", info.lastInsertRowid, "RECORDED", actor, { checkpointId: checkpoint.id, resultStatus: evaluation.status });
      res.status(201).json(toObservation(db.prepare("SELECT * FROM production_quality_observations WHERE id=?").get(info.lastInsertRowid)));
    } catch (error) { res.status(400).json({ message: error.code === "SQLITE_CONSTRAINT_UNIQUE" ? "A record already exists for this checkpoint and production period." : "Unable to record production quality." }); }
  });
}
