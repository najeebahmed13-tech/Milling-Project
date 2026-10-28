import crypto from 'node:crypto';
import { requestContext } from './requestContext.js';

const now = () => new Date().toISOString();
const reference = (prefix) => `${prefix}-${now().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

function parseJson(value, fallback = []) {
  try { return JSON.parse(value || JSON.stringify(fallback)); } catch { return fallback; }
}

export function registerProductionModule(app, db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      capacity_per_shift REAL NOT NULL, capacity_uom TEXT NOT NULL DEFAULT 'MT', shift_hours REAL NOT NULL DEFAULT 8,
      status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, line_id INTEGER, mill_id TEXT NOT NULL DEFAULT 'demo-mill', code TEXT NOT NULL,
      name TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
      capacity_mt REAL, capacity_uom TEXT NOT NULL DEFAULT 'MT', description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL,
      FOREIGN KEY (line_id) REFERENCES production_lines(id), UNIQUE(mill_id, code)
    );
    CREATE TABLE IF NOT EXISTS production_machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      station TEXT NOT NULL, line_id INTEGER, rated_capacity REAL, capacity_uom TEXT NOT NULL DEFAULT 'MT/HOUR',
      installation_date TEXT, vendor TEXT, model_no TEXT, oem_serial_no TEXT,
      service_type TEXT, last_service_date TEXT, service_threshold TEXT, description TEXT,
      machine_image TEXT NOT NULL DEFAULT '', attachments_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL,
      FOREIGN KEY (line_id) REFERENCES production_lines(id)
    );
    CREATE TABLE IF NOT EXISTS production_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      mill TEXT NOT NULL DEFAULT 'Main Mill', section_type TEXT NOT NULL, description TEXT,
      sequence INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'ACTIVE',
      station_image TEXT NOT NULL DEFAULT '', attachment TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_routings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
      input_material TEXT NOT NULL DEFAULT 'FFB', outputs_json TEXT NOT NULL DEFAULT '["CPO","PK"]', output_item_ids_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_route_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT, routing_id INTEGER NOT NULL, sequence INTEGER NOT NULL,
      code TEXT NOT NULL, name TEXT NOT NULL, station TEXT NOT NULL, machine TEXT,
      input_material TEXT, output_material TEXT, planned_duration_minutes INTEGER NOT NULL DEFAULT 60,
      quality_required INTEGER NOT NULL DEFAULT 0, quality_frequency_minutes INTEGER,
      FOREIGN KEY (routing_id) REFERENCES production_routings(id), UNIQUE(routing_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS production_route_quality_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, route_step_id INTEGER NOT NULL, parameter TEXT NOT NULL,
      timing TEXT NOT NULL DEFAULT 'AFTER_PROCESS', uom TEXT, required INTEGER NOT NULL DEFAULT 1,
      frequency_minutes INTEGER, acceptance_rule TEXT, created_at TEXT NOT NULL,
      FOREIGN KEY (route_step_id) REFERENCES production_route_steps(id),
      UNIQUE(route_step_id, parameter, timing)
    );
    CREATE TABLE IF NOT EXISTS production_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, run_no TEXT NOT NULL UNIQUE, routing_id INTEGER NOT NULL, line_id INTEGER NOT NULL,
      shift_id INTEGER,
      planned_ffb_qty REAL NOT NULL, status TEXT NOT NULL DEFAULT 'PLANNED', current_step_sequence INTEGER NOT NULL DEFAULT 1,
      started_at TEXT, completed_at TEXT, cpo_output REAL NOT NULL DEFAULT 0, pk_output REAL NOT NULL DEFAULT 0,
      total_loss REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
      FOREIGN KEY (routing_id) REFERENCES production_routings(id), FOREIGN KEY (line_id) REFERENCES production_lines(id)
    );
    CREATE TABLE IF NOT EXISTS production_run_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, run_id INTEGER NOT NULL, route_step_id INTEGER NOT NULL, sequence INTEGER NOT NULL,
      stage_name TEXT NOT NULL, station TEXT NOT NULL, machine TEXT, status TEXT NOT NULL DEFAULT 'PENDING',
      input_qty REAL, output_qty REAL, loss_qty REAL, started_at TEXT, completed_at TEXT, remarks TEXT,
      quality_required INTEGER NOT NULL DEFAULT 0, quality_frequency_minutes INTEGER,
      FOREIGN KEY (run_id) REFERENCES production_runs(id), FOREIGN KEY (route_step_id) REFERENCES production_route_steps(id)
    );
    CREATE TABLE IF NOT EXISTS production_quality_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sample_no TEXT NOT NULL UNIQUE, run_id INTEGER NOT NULL, stage_id INTEGER NOT NULL,
      parameter TEXT NOT NULL, result_value TEXT NOT NULL, uom TEXT, status TEXT NOT NULL,
      checkpoint_timing TEXT NOT NULL DEFAULT 'AFTER_PROCESS', tested_at TEXT NOT NULL, tested_by TEXT NOT NULL, remarks TEXT,
      FOREIGN KEY (run_id) REFERENCES production_runs(id), FOREIGN KEY (stage_id) REFERENCES production_run_stages(id)
    );
    CREATE TABLE IF NOT EXISTS production_inventory (
      material TEXT NOT NULL, location TEXT NOT NULL, balance REAL NOT NULL DEFAULT 0,
      uom TEXT NOT NULL DEFAULT 'MT', updated_at TEXT NOT NULL, PRIMARY KEY(material, location)
    );
  `);
  try { db.exec('ALTER TABLE production_runs ADD COLUMN shift_id INTEGER REFERENCES production_shifts(id)'); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  try { db.exec("ALTER TABLE production_shifts ADD COLUMN mill_id TEXT NOT NULL DEFAULT 'demo-mill'"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  try { db.exec("ALTER TABLE production_shifts ADD COLUMN capacity_uom TEXT NOT NULL DEFAULT 'MT'"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  try { db.exec("ALTER TABLE production_shifts ADD COLUMN description TEXT NOT NULL DEFAULT ''"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  try { db.exec("ALTER TABLE production_routings ADD COLUMN output_item_ids_json TEXT NOT NULL DEFAULT '[]'"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  const shiftSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='production_shifts'").get()?.sql || "";
  if (shiftSchema.includes('line_id INTEGER NOT NULL')) {
    db.pragma('foreign_keys = OFF');
    db.exec(`CREATE TABLE production_shifts_migrated (
      id INTEGER PRIMARY KEY AUTOINCREMENT, line_id INTEGER, mill_id TEXT NOT NULL DEFAULT 'demo-mill', code TEXT NOT NULL,
      name TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, capacity_mt REAL, capacity_uom TEXT NOT NULL DEFAULT 'MT',
      description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL,
      FOREIGN KEY (line_id) REFERENCES production_lines(id), UNIQUE(mill_id, code)
    );
    INSERT INTO production_shifts_migrated (id,line_id,mill_id,code,name,start_time,end_time,capacity_mt,capacity_uom,description,status,created_at)
      SELECT id,line_id,COALESCE(mill_id,'demo-mill'),code,name,start_time,end_time,capacity_mt,COALESCE(capacity_uom,'MT'),COALESCE(description,''),status,created_at FROM production_shifts;
    DROP TABLE production_shifts;
    ALTER TABLE production_shifts_migrated RENAME TO production_shifts;`);
    db.pragma('foreign_keys = ON');
  }
  try { db.exec("ALTER TABLE production_quality_results ADD COLUMN checkpoint_timing TEXT NOT NULL DEFAULT 'AFTER_PROCESS'"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  try { db.exec("ALTER TABLE production_stations ADD COLUMN station_image TEXT NOT NULL DEFAULT ''"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  try { db.exec("ALTER TABLE production_stations ADD COLUMN attachment TEXT NOT NULL DEFAULT ''"); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  for (const column of [
    "installation_date TEXT", "vendor TEXT", "model_no TEXT", "oem_serial_no TEXT",
    "service_type TEXT", "last_service_date TEXT", "service_threshold TEXT", "description TEXT",
    "machine_image TEXT NOT NULL DEFAULT ''", "attachments_json TEXT NOT NULL DEFAULT '[]'",
  ]) {
    try { db.exec(`ALTER TABLE production_machines ADD COLUMN ${column}`); } catch (error) { if (!String(error.message).includes('duplicate column')) throw error; }
  }

  const created = now();
  if (!db.prepare('SELECT COUNT(*) count FROM production_lines').get().count) {
    db.prepare('INSERT INTO production_lines (code,name,capacity_per_shift,capacity_uom,shift_hours,status,created_at) VALUES (?,?,?,?,?,?,?)')
      .run('LINE-01', 'Main Mill Production Line', 240, 'MT', 8, 'ACTIVE', created);
  }
  const line = db.prepare("SELECT id FROM production_lines WHERE code='LINE-01'").get();
  if (line && !db.prepare('SELECT COUNT(*) count FROM production_shifts WHERE line_id=?').get(line.id).count) {
    const insertShift = db.prepare('INSERT INTO production_shifts (line_id,mill_id,code,name,start_time,end_time,capacity_mt,capacity_uom,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    [['SHIFT-A','Morning Shift','06:00','14:00',240],['SHIFT-B','Evening Shift','14:00','22:00',240],['SHIFT-C','Night Shift','22:00','06:00',240]].forEach(([code,name,start,end,capacity]) => insertShift.run(line.id, 'demo-mill', code, name, start, end, capacity, 'MT', 'ACTIVE', created));
  }
  if (!db.prepare('SELECT COUNT(*) count FROM production_machines').get().count) {
    const insertMachine = db.prepare('INSERT INTO production_machines (code,name,station,line_id,rated_capacity,capacity_uom,status,created_at) VALUES (?,?,?,?,?,?,?,?)');
    [
      ['STER-01','Sterilizer 01','Sterilization',40], ['THR-01','Thresher 01','Threshing',40],
      ['PRESS-01','Digester & Screw Press 01','Pressing',35], ['CLAR-01','Clarification Line 01','Clarification',30],
      ['VAC-01','Vacuum Dryer 01','Purification',28], ['KERNEL-01','Kernel Recovery Line 01','Kernel Recovery',12]
    ].forEach(([code, name, station, capacity]) => insertMachine.run(code, name, station, line?.id || null, capacity, 'MT/HOUR', 'ACTIVE', created));
  }
  if (!db.prepare('SELECT COUNT(*) count FROM production_stations').get().count) {
    const insertStation = db.prepare('INSERT INTO production_stations (code,name,mill,section_type,description,sequence,status,created_at) VALUES (?,?,?,?,?,?,?,?)');
    [
      ['ST-STER','Sterilization','Processing','Sterilization and condensate handling section',1],
      ['ST-THRESH','Threshing','Processing','Fruitlet and empty bunch separation section',2],
      ['ST-DIGEST','Digester','Processing','Fruit digestion before pressing',3],
      ['ST-PRESS','Pressing','Processing','Digesting and screw pressing section',4],
      ['ST-CLAR','Clarification','Oil Recovery','Crude oil screening and clarification section',5],
      ['ST-PURE','Purification','Oil Recovery','Oil purification section',6],
      ['ST-VAC-DRY','Vaccum Dryer','Oil Recovery','Vacuum drying section',7],
      ['ST-CPO-TANK','CPO Tank','Storage','Crude palm oil storage tank',8]
    ].forEach(([code,name,sectionType,description,sequence]) => insertStation.run(code,name,'Main Mill',sectionType,description,sequence,'ACTIVE',created));
  }
  const stationMasterNames = ['Sterilization', 'Threshing', 'Digester', 'Pressing', 'Clarification', 'Purification', 'Vaccum Dryer', 'CPO Tank'];
  const seededStationCodes = ['ST-FFB-RAMP', 'ST-STER', 'ST-THRESH', 'ST-PRESS', 'ST-CLAR', 'ST-PURE', 'ST-KERNEL', 'ST-UTIL'];
  const currentStations = db.prepare('SELECT id,code,name,sequence FROM production_stations ORDER BY sequence,id').all();
  if (currentStations.length === stationMasterNames.length && currentStations.every((station) => seededStationCodes.includes(station.code))) {
    db.transaction(() => {
      const temporary = db.prepare("UPDATE production_stations SET code=? WHERE id=?");
      currentStations.forEach((station) => temporary.run(`MIGRATING-${station.id}`, station.id));
      const update = db.prepare('UPDATE production_stations SET code=?,name=?,section_type=?,description=?,sequence=? WHERE id=?');
      const updates = [
        ['ST-STER', 'Sterilization', 'Processing', 'Sterilization and condensate handling section'],
        ['ST-THRESH', 'Threshing', 'Processing', 'Fruitlet and empty bunch separation section'],
        ['ST-DIGEST', 'Digester', 'Processing', 'Fruit digestion before pressing'],
        ['ST-PRESS', 'Pressing', 'Processing', 'Digesting and screw pressing section'],
        ['ST-CLAR', 'Clarification', 'Oil Recovery', 'Crude oil screening and clarification section'],
        ['ST-PURE', 'Purification', 'Oil Recovery', 'Oil purification section'],
        ['ST-VAC-DRY', 'Vaccum Dryer', 'Oil Recovery', 'Vacuum drying section'],
        ['ST-CPO-TANK', 'CPO Tank', 'Storage', 'Crude palm oil storage tank'],
      ];
      updates.forEach(([code, name, sectionType, description], index) => update.run(code, name, sectionType, description, index + 1, currentStations[index].id));
      const stationReferences = new Map([
        ['FFB Ramp', 'Sterilization'], ['Sterilizing', 'Threshing'], ['Threshing', 'Digester'],
        ['Pressing', 'Pressing'], ['Clarification', 'Clarification'], ['Purification', 'Purification'],
        ['Kernel Recovery', 'Vaccum Dryer'], ['Boiler & Utilities', 'CPO Tank'],
      ]);
      const updateMachine = db.prepare('UPDATE production_machines SET station=? WHERE station=?');
      const updateStep = db.prepare('UPDATE production_route_steps SET station=? WHERE station=?');
      stationReferences.forEach((next, previous) => { updateMachine.run(next, previous); updateStep.run(next, previous); });
      // Repair the original demo seed assignments without changing user-created machine records.
      db.prepare("UPDATE production_machines SET station='Sterilization' WHERE code='STER-01' AND name='Sterilizer 01' AND station IN ('Digester','Threshing','Sterilizing')").run();
    })();
  }
  // Keep the built-in sterilizer seed aligned with the station master after upgrades.
  db.prepare("UPDATE production_machines SET station='Sterilization' WHERE code='STER-01' AND name='Sterilizer 01' AND station IN ('Digester','Threshing','Sterilizing')").run();
  db.prepare("UPDATE production_machines SET station='Threshing' WHERE code='THR-01' AND name='Thresher 01' AND station IN ('Digester','Threshing','Sterilizing')").run();
  if (!db.prepare('SELECT COUNT(*) count FROM production_routings').get().count) {
    const routingInfo = db.prepare('INSERT INTO production_routings (code,name,version,input_material,outputs_json,status,created_at) VALUES (?,?,?,?,?,?,?)')
      .run('RT-FFB-CPO-PK-01', 'FFB to CPO & Palm Kernel', 1, 'FFB', JSON.stringify(['CPO','PK','EFB','Fibre','Shell']), 'ACTIVE', created);
    const routingId = Number(routingInfo.lastInsertRowid);
    const insertStep = db.prepare('INSERT INTO production_route_steps (routing_id,sequence,code,name,station,machine,input_material,output_material,planned_duration_minutes,quality_required,quality_frequency_minutes) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    [
      [1,'RECEIVE','FFB Ramp Feed','FFB Ramp','FFB Ramp','FFB','FFB',30,1,120],
      [2,'STERILIZE','Sterilization','Sterilizing','Sterilizer 01','FFB','Sterilized FFB',90,1,120],
      [3,'THRESH','Threshing','Threshing','Thresher 01','Sterilized FFB','Fruitlets + EFB',45,0,null],
      [4,'DIGEST_PRESS','Digesting & Pressing','Pressing','Digester & Screw Press 01','Fruitlets','Crude Oil + Press Cake',60,1,120],
      [5,'CLARIFY','Oil Clarification','Clarification','Clarification Line 01','Crude Oil','Pure Oil + Sludge',90,1,120],
      [6,'DRY_STORE','Vacuum Drying & CPO Storage','Purification','Vacuum Dryer 01','Pure Oil','CPO',60,1,120],
      [7,'KERNEL_RECOVERY','Nut & Kernel Recovery','Kernel Recovery','Kernel Recovery Line 01','Press Cake','PK + Fibre + Shell',120,1,120]
    ].forEach((step) => insertStep.run(routingId, ...step));
  }
  const firstRouting = db.prepare("SELECT id FROM production_routings WHERE code='RT-FFB-CPO-PK-01'").get();
  if (firstRouting && !db.prepare('SELECT COUNT(*) count FROM production_route_quality_checks WHERE route_step_id IN (SELECT id FROM production_route_steps WHERE routing_id=?)').get(firstRouting.id).count) {
    const checks = db.prepare('INSERT INTO production_route_quality_checks (route_step_id,parameter,timing,uom,required,frequency_minutes,acceptance_rule,created_at) VALUES (?,?,?,?,?,?,?,?)');
    const steps = db.prepare('SELECT id,sequence FROM production_route_steps WHERE routing_id=?').all(firstRouting.id);
    steps.forEach((step) => {
      if ([1, 2, 4, 5, 6].includes(step.sequence)) checks.run(step.id, step.sequence === 1 ? 'FFB Quality' : 'Moisture', step.sequence === 1 ? 'BEFORE_PROCESS' : 'AFTER_PROCESS', step.sequence === 1 ? '' : '%', 1, 120, '', created);
    });
  }
  const seedInventory = db.prepare('INSERT OR IGNORE INTO production_inventory (material,location,balance,uom,updated_at) VALUES (?,?,?,?,?)');
  seedInventory.run('CPO', 'CPO Tank 01', 486.2, 'MT', created);
  seedInventory.run('PK', 'Kernel Silo', 128.7, 'MT', created);

  const routingWithSteps = (routing) => ({ ...routing, outputs: parseJson(routing.outputs_json), outputItemIds: parseJson(routing.output_item_ids_json), steps: db.prepare('SELECT * FROM production_route_steps WHERE routing_id=? ORDER BY sequence').all(routing.id).map((step) => ({ ...step, qualityChecks: db.prepare('SELECT * FROM production_route_quality_checks WHERE route_step_id=? ORDER BY id').all(step.id) })) });
  const runWithDetails = (run) => ({
    ...run,
    routing: db.prepare('SELECT code,name,version FROM production_routings WHERE id=?').get(run.routing_id),
    line: db.prepare('SELECT code,name,capacity_per_shift,capacity_uom FROM production_lines WHERE id=?').get(run.line_id),
    shift: run.shift_id ? db.prepare('SELECT id,code,name,start_time,end_time FROM production_shifts WHERE id=?').get(run.shift_id) : null,
    stages: db.prepare('SELECT * FROM production_run_stages WHERE run_id=? ORDER BY sequence').all(run.id).map((stage) => ({ ...stage, qualityChecks: db.prepare('SELECT * FROM production_route_quality_checks WHERE route_step_id=? ORDER BY id').all(stage.route_step_id), qualityResults: db.prepare('SELECT * FROM production_quality_results WHERE stage_id=? ORDER BY tested_at DESC').all(stage.id) }))
  });
  const availability = () => {
    const received = Number(db.prepare("SELECT COALESCE(SUM(COALESCE(accepted_qty,net_weight)),0) qty FROM ffb_receipts WHERE state='READY_TO_POST'").get().qty || 0);
    const allocated = Number(db.prepare("SELECT COALESCE(SUM(planned_ffb_qty),0) qty FROM production_runs WHERE status <> 'CANCELLED'").get().qty || 0);
    return Math.max(0, Number((received - allocated).toFixed(3)));
  };

  app.get('/api/production/overview', (_req, res) => {
    const lines = db.prepare('SELECT * FROM production_lines ORDER BY id').all().map((item) => {
      const reserved = Number(db.prepare("SELECT COALESCE(SUM(planned_ffb_qty),0) qty FROM production_runs WHERE line_id=? AND status IN ('PLANNED','IN_PROGRESS')").get(item.id).qty || 0);
      return { ...item, reserved_capacity: reserved, available_capacity: Math.max(0, Number((item.capacity_per_shift - reserved).toFixed(3))) };
    });
    res.json({
      availableFfb: availability(), lines,
      shifts: db.prepare('SELECT * FROM production_shifts WHERE status=\'ACTIVE\' ORDER BY mill_id,start_time').all(),
      stations: db.prepare('SELECT * FROM production_stations ORDER BY sequence,name').all(),
      machines: db.prepare('SELECT * FROM production_machines ORDER BY station,name').all(),
      items: db.prepare("SELECT id,item_code,name,unit,item_type,status FROM items WHERE status='Active' ORDER BY name").all(),
      routings: db.prepare('SELECT * FROM production_routings ORDER BY id DESC').all().map(routingWithSteps),
      runs: db.prepare('SELECT * FROM production_runs ORDER BY id DESC').all().map(runWithDetails),
      inventory: db.prepare('SELECT * FROM production_inventory ORDER BY material,location').all()
    });
  });

  app.post('/api/production/lines', (req, res) => {
    const body = req.body; const capacity = Number(body.capacityPerShift); const shiftHours = Number(body.shiftHours || 8);
    if (!body.code || !body.name || !Number.isFinite(capacity) || capacity <= 0) return res.status(400).json({ message: 'Line code, name and positive capacity per shift are required.' });
    try { const info = db.prepare('INSERT INTO production_lines (code,name,capacity_per_shift,capacity_uom,shift_hours,status,created_at) VALUES (?,?,?,?,?,?,?)').run(body.code.trim().toUpperCase(), body.name.trim(), capacity, body.capacityUom || 'MT', shiftHours, 'ACTIVE', now()); res.status(201).json(db.prepare('SELECT * FROM production_lines WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Production line code must be unique.' : 'Unable to save production line.' }); }
  });

  app.get('/api/production/shifts', (_req, res) => {
    res.json(db.prepare('SELECT shifts.*, mills.code AS mill_code, mills.name AS mill_name, lines.code AS line_code, lines.name AS line_name FROM production_shifts shifts LEFT JOIN production_mills mills ON mills.id=shifts.mill_id LEFT JOIN production_lines lines ON lines.id=shifts.line_id ORDER BY mills.name, shifts.start_time, shifts.code').all());
  });

  app.post('/api/production/shifts', (req, res) => {
    const body = req.body; const capacity = body.capacityMt === '' || body.capacityMt === undefined ? null : Number(body.capacityMt);
    const mill = db.prepare("SELECT id FROM production_mills WHERE status='ACTIVE' AND (id=? OR code=? COLLATE NOCASE OR name=? COLLATE NOCASE)").get(body.millId || body.millName, body.millName || body.millId, body.millName || body.millId);
    if (!mill || !body.code || !body.name || !body.startTime || !body.endTime) return res.status(400).json({ message: 'A registered active Mill / Facility, shift code, name, start time and end time are required.' });
    if (capacity !== null && (!Number.isFinite(capacity) || capacity <= 0)) return res.status(400).json({ message: 'Shift capacity must be positive when supplied.' });
    const status = String(body.status || 'ACTIVE').trim().toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(status)) return res.status(400).json({ message: 'Shift status must be Active or Inactive.' });
    try { const info = db.prepare('INSERT INTO production_shifts (line_id,mill_id,code,name,start_time,end_time,capacity_mt,capacity_uom,description,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(null, mill.id, body.code.trim().toUpperCase(), body.name.trim(), body.startTime, body.endTime, capacity, body.capacityUom || 'MT', body.description || '', status, now()); res.status(201).json(db.prepare('SELECT * FROM production_shifts WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Shift code must be unique for this production line.' : 'Unable to save shift.' }); }
  });

  app.patch('/api/production/shifts/:id', (req, res) => {
    const body = req.body; const shift = db.prepare('SELECT * FROM production_shifts WHERE id=?').get(Number(req.params.id));
    if (!shift) return res.status(404).json({ message: 'Shift was not found.' });
    const capacity = body.capacityMt === '' || body.capacityMt === undefined ? null : Number(body.capacityMt);
    const mill = db.prepare("SELECT id FROM production_mills WHERE status='ACTIVE' AND (id=? OR code=? COLLATE NOCASE OR name=? COLLATE NOCASE)").get(body.millId || body.millName, body.millName || body.millId, body.millName || body.millId);
    if (!mill || !body.code || !body.name || !body.startTime || !body.endTime) return res.status(400).json({ message: 'A registered active Mill / Facility, shift code, name, start time and end time are required.' });
    if (capacity !== null && (!Number.isFinite(capacity) || capacity <= 0)) return res.status(400).json({ message: 'Shift capacity must be positive when supplied.' });
    const status = String(body.status || 'ACTIVE').trim().toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(status)) return res.status(400).json({ message: 'Shift status must be Active or Inactive.' });
    try { db.prepare('UPDATE production_shifts SET line_id=NULL,mill_id=?,code=?,name=?,start_time=?,end_time=?,capacity_mt=?,capacity_uom=?,description=?,status=? WHERE id=?').run(mill.id, body.code.trim().toUpperCase(), body.name.trim(), body.startTime, body.endTime, capacity, body.capacityUom || 'MT', body.description || '', status, shift.id); res.json(db.prepare('SELECT * FROM production_shifts WHERE id=?').get(shift.id)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Shift code must be unique for this production line.' : 'Unable to update shift.' }); }
  });

  app.post('/api/production/machines', (req, res) => {
    const body = req.body;
    if (!body.code || !body.name || !body.station || !body.serviceType || !body.lastServiceDate || !body.serviceThreshold || !body.status) return res.status(400).json({ message: 'Machine code, name, station, service type, last service date, service threshold and status are required.' });
    const status = String(body.status).trim().toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ message: 'Machine status must be Active or Inactive.' });
    const capacity = body.ratedCapacity === '' || body.ratedCapacity === undefined ? null : Number(body.ratedCapacity);
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) return res.status(400).json({ message: 'Capacity must be zero or greater when supplied.' });
    try { const info = db.prepare('INSERT INTO production_machines (code,name,station,line_id,rated_capacity,capacity_uom,installation_date,vendor,model_no,oem_serial_no,service_type,last_service_date,service_threshold,description,machine_image,attachments_json,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(body.code.trim().toUpperCase(), body.name.trim(), body.station.trim(), body.lineId || null, capacity, body.capacityUom || 'Mt/hr', body.installationDate || null, body.vendor || '', body.modelNo || '', body.oemSerialNo || '', body.serviceType, body.lastServiceDate, body.serviceThreshold.trim(), body.description || '', body.machineImage || '', JSON.stringify(Array.isArray(body.attachments) ? body.attachments : []), status, now()); res.status(201).json(db.prepare('SELECT * FROM production_machines WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Machine code must be unique.' : 'Unable to save machine.' }); }
  });

  app.patch('/api/production/machines/:id', (req, res) => {
    const body = req.body;
    const existing = db.prepare('SELECT * FROM production_machines WHERE id=?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Machine not found.' });
    if (!body.code || !body.name || !body.station || !body.serviceType || !body.lastServiceDate || !body.serviceThreshold || !body.status) return res.status(400).json({ message: 'Machine code, name, station, service type, last service date, service threshold and status are required.' });
    const status = String(body.status).trim().toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ message: 'Machine status must be Active or Inactive.' });
    const capacity = body.ratedCapacity === '' || body.ratedCapacity === undefined ? null : Number(body.ratedCapacity);
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) return res.status(400).json({ message: 'Capacity must be zero or greater when supplied.' });
    try {
      db.prepare('UPDATE production_machines SET code=?,name=?,station=?,line_id=?,rated_capacity=?,capacity_uom=?,installation_date=?,vendor=?,model_no=?,oem_serial_no=?,service_type=?,last_service_date=?,service_threshold=?,description=?,machine_image=?,attachments_json=?,status=? WHERE id=?')
        .run(body.code.trim().toUpperCase(), body.name.trim(), body.station.trim(), body.lineId || null, capacity, body.capacityUom || 'Mt/hr', body.installationDate || null, body.vendor || '', body.modelNo || '', body.oemSerialNo || '', body.serviceType, body.lastServiceDate, body.serviceThreshold.trim(), body.description || '', body.machineImage || existing.machine_image || '', JSON.stringify(Array.isArray(body.attachments) ? body.attachments : JSON.parse(existing.attachments_json || '[]')), status, req.params.id);
      res.json(db.prepare('SELECT * FROM production_machines WHERE id=?').get(req.params.id));
    } catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Machine code must be unique.' : 'Unable to update machine.' }); }
  });

  app.post('/api/production/stations', (req, res) => {
    const body = req.body;
    if (!body.code || !body.name || !body.status) return res.status(400).json({ message: 'Station code, name and status are required.' });
    const status = String(body.status).trim().toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ message: 'Station status must be Active or Inactive.' });
    try { const info = db.prepare('INSERT INTO production_stations (code,name,mill,section_type,description,sequence,status,station_image,attachment,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(body.code.trim().toUpperCase(), body.name.trim(), 'Main Mill', 'GENERAL', body.description || '', 1, status, body.stationImage || '', '', now()); res.status(201).json(db.prepare('SELECT * FROM production_stations WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Station code must be unique.' : 'Unable to save station.' }); }
  });

  app.patch('/api/production/stations/:id', (req, res) => {
    const body = req.body;
    const existing = db.prepare('SELECT * FROM production_stations WHERE id=?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Station not found.' });
    if (!body.code || !body.name || !body.status) return res.status(400).json({ message: 'Station code, name and status are required.' });
    const status = String(body.status).trim().toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ message: 'Station status must be Active or Inactive.' });
    try {
      db.prepare('UPDATE production_stations SET code=?,name=?,description=?,status=?,station_image=? WHERE id=?')
        .run(body.code.trim().toUpperCase(), body.name.trim(), body.description || '', status, body.stationImage || existing.station_image || '', req.params.id);
      res.json(db.prepare('SELECT * FROM production_stations WHERE id=?').get(req.params.id));
    } catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Station code must be unique.' : 'Unable to update station.' }); }
  });

  app.post('/api/production/routings', (req, res) => {
    const body = req.body;
    const outputItemIds = Array.isArray(body.outputItemIds) ? [...new Set(body.outputItemIds.map(Number).filter(Number.isInteger))] : [];
    const outputItems = outputItemIds.length ? db.prepare(`SELECT id,name FROM items WHERE status='Active' AND id IN (${outputItemIds.map(() => '?').join(',')})`).all(...outputItemIds) : [];
    if (!body.code || !body.name || !Array.isArray(body.steps) || !body.steps.length) return res.status(400).json({ message: 'Routing code, name and at least one stage are required.' });
    if (!outputItemIds.length || outputItems.length !== outputItemIds.length) return res.status(400).json({ message: 'Select one or more active output Items from Item Master.' });
    const save = db.transaction(() => {
      const info = db.prepare('INSERT INTO production_routings (code,name,version,input_material,outputs_json,output_item_ids_json,status,created_at) VALUES (?,?,?,?,?,?,?,?)').run(body.code.trim().toUpperCase(), body.name.trim(), Number(body.version || 1), body.inputMaterial || 'FFB', JSON.stringify(outputItems.map((item) => item.name)), JSON.stringify(outputItemIds), 'ACTIVE', now());
      const routingId = Number(info.lastInsertRowid);
      const insert = db.prepare('INSERT INTO production_route_steps (routing_id,sequence,code,name,station,machine,input_material,output_material,planned_duration_minutes,quality_required,quality_frequency_minutes) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
      body.steps.forEach((step, index) => {
        const stepInfo = insert.run(routingId, index + 1, step.code || `STEP-${index + 1}`, step.name, step.station, step.machine || '', step.inputMaterial || '', step.outputMaterial || '', Number(step.durationMinutes || 60), Array.isArray(step.qualityChecks) && step.qualityChecks.length ? 1 : 0, step.qualityFrequencyMinutes ? Number(step.qualityFrequencyMinutes) : null);
        const checks = Array.isArray(step.qualityChecks) ? step.qualityChecks : (step.qualityParameter ? [{ parameter: step.qualityParameter, timing: step.qualityTiming, uom: step.qualityUom, frequencyMinutes: step.qualityFrequencyMinutes }] : []);
        const checkInsert = db.prepare('INSERT INTO production_route_quality_checks (route_step_id,parameter,timing,uom,required,frequency_minutes,acceptance_rule,created_at) VALUES (?,?,?,?,?,?,?,?)');
        checks.filter((check) => check.parameter).forEach((check) => checkInsert.run(Number(stepInfo.lastInsertRowid), check.parameter.trim(), check.timing || 'AFTER_PROCESS', check.uom || '', check.required === false ? 0 : 1, check.frequencyMinutes ? Number(check.frequencyMinutes) : null, check.acceptanceRule || '', now()));
      });
      return routingId;
    });
    try { const id = save(); res.status(201).json(routingWithSteps(db.prepare('SELECT * FROM production_routings WHERE id=?').get(id))); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Routing code must be unique.' : 'Unable to save routing.' }); }
  });

  app.post('/api/production/runs', (req, res) => {
    const body = req.body; const quantity = Number(body.plannedFfbQty);
    const routing = db.prepare("SELECT * FROM production_routings WHERE id=? AND status='ACTIVE'").get(body.routingId);
    const lineRecord = db.prepare("SELECT * FROM production_lines WHERE id=? AND status='ACTIVE'").get(body.lineId);
    const shift = lineRecord ? db.prepare("SELECT * FROM production_shifts WHERE id=? AND mill_id=? AND status='ACTIVE'").get(body.shiftId, lineRecord.mill_id || 'demo-mill') : null;
    if (!routing || !lineRecord || !shift || !Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: 'Active routing, production line, shift and positive FFB quantity are required.' });
    const reserved = Number(db.prepare("SELECT COALESCE(SUM(planned_ffb_qty),0) qty FROM production_runs WHERE line_id=? AND status IN ('PLANNED','IN_PROGRESS')").get(lineRecord.id).qty || 0);
    if (quantity > availability()) return res.status(409).json({ message: `Only ${availability().toFixed(3)} MT of received FFB is available.` });
    if (quantity > lineRecord.capacity_per_shift - reserved) return res.status(409).json({ message: `Only ${Math.max(0, lineRecord.capacity_per_shift - reserved).toFixed(3)} MT of line capacity is available.` });
    const createRun = db.transaction(() => {
      const runNo = reference('PR');
      const info = db.prepare('INSERT INTO production_runs (run_no,routing_id,line_id,shift_id,planned_ffb_qty,status,current_step_sequence,created_at) VALUES (?,?,?,?,?,?,?,?)').run(runNo, routing.id, lineRecord.id, shift.id, quantity, 'PLANNED', 1, now());
      const runId = Number(info.lastInsertRowid);
      const steps = db.prepare('SELECT * FROM production_route_steps WHERE routing_id=? ORDER BY sequence').all(routing.id);
      const insert = db.prepare('INSERT INTO production_run_stages (run_id,route_step_id,sequence,stage_name,station,machine,status,quality_required,quality_frequency_minutes) VALUES (?,?,?,?,?,?,?,?,?)');
      steps.forEach((step) => insert.run(runId, step.id, step.sequence, step.name, step.station, step.machine || '', 'PENDING', step.quality_required, step.quality_frequency_minutes));
      return runId;
    });
    const runId = createRun(); res.status(201).json(runWithDetails(db.prepare('SELECT * FROM production_runs WHERE id=?').get(runId)));
  });

  app.post('/api/production/runs/:runId/stages/:stageId/start', (req, res) => {
    const run = db.prepare('SELECT * FROM production_runs WHERE id=?').get(req.params.runId);
    const stage = db.prepare('SELECT * FROM production_run_stages WHERE id=? AND run_id=?').get(req.params.stageId, req.params.runId);
    if (!run || !stage) return res.status(404).json({ message: 'Production run stage not found.' });
    if (stage.status !== 'PENDING') return res.status(409).json({ message: 'Only a pending stage can be started.' });
    const previous = db.prepare("SELECT COUNT(*) count FROM production_run_stages WHERE run_id=? AND sequence<? AND status<>'COMPLETED'").get(run.id, stage.sequence).count;
    if (previous) return res.status(409).json({ message: 'Complete the preceding routing stage first.' });
    const startedAt = now();
    const transaction = db.transaction(() => { db.prepare("UPDATE production_run_stages SET status='IN_PROGRESS',started_at=? WHERE id=?").run(startedAt, stage.id); db.prepare("UPDATE production_runs SET status='IN_PROGRESS',started_at=COALESCE(started_at,?),current_step_sequence=? WHERE id=?").run(startedAt, stage.sequence, run.id); });
    transaction(); res.json(runWithDetails(db.prepare('SELECT * FROM production_runs WHERE id=?').get(run.id)));
  });

  app.post('/api/production/runs/:runId/stages/:stageId/complete', (req, res) => {
    const stage = db.prepare('SELECT * FROM production_run_stages WHERE id=? AND run_id=?').get(req.params.stageId, req.params.runId);
    const input = Number(req.body.inputQty), output = Number(req.body.outputQty), loss = Number(req.body.lossQty || 0);
    if (!stage) return res.status(404).json({ message: 'Production run stage not found.' });
    if (stage.status !== 'IN_PROGRESS') return res.status(409).json({ message: 'Start the stage before recording completion.' });
    if (![input, output, loss].every(Number.isFinite) || input < 0 || output < 0 || loss < 0) return res.status(400).json({ message: 'Input, output and loss quantities must be valid non-negative values.' });
    db.prepare("UPDATE production_run_stages SET status='COMPLETED',input_qty=?,output_qty=?,loss_qty=?,remarks=?,completed_at=? WHERE id=?").run(input, output, loss, req.body.remarks || '', now(), stage.id);
    const next = db.prepare("SELECT sequence FROM production_run_stages WHERE run_id=? AND status<>'COMPLETED' ORDER BY sequence LIMIT 1").get(req.params.runId);
    db.prepare('UPDATE production_runs SET current_step_sequence=?,total_loss=(SELECT COALESCE(SUM(loss_qty),0) FROM production_run_stages WHERE run_id=?) WHERE id=?').run(next?.sequence || stage.sequence, req.params.runId, req.params.runId);
    res.json(runWithDetails(db.prepare('SELECT * FROM production_runs WHERE id=?').get(req.params.runId)));
  });

  app.post('/api/production/runs/:runId/stages/:stageId/quality', (req, res) => {
    const stage = db.prepare('SELECT * FROM production_run_stages WHERE id=? AND run_id=?').get(req.params.stageId, req.params.runId);
    if (!stage) return res.status(404).json({ message: 'Production stage not found.' });
    if (!req.body.parameter || req.body.resultValue === undefined || !req.body.status) return res.status(400).json({ message: 'Quality parameter, result and status are required.' });
    const sampleNo = reference('QS');
    const info = db.prepare('INSERT INTO production_quality_results (sample_no,run_id,stage_id,parameter,result_value,uom,status,checkpoint_timing,tested_at,tested_by,remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(sampleNo, req.params.runId, stage.id, req.body.parameter, String(req.body.resultValue), req.body.uom || '', req.body.status, req.body.timing || 'AFTER_PROCESS', now(), req.body.testedBy || 'Sean Shapiro', req.body.remarks || '');
    res.status(201).json(db.prepare('SELECT * FROM production_quality_results WHERE id=?').get(info.lastInsertRowid));
  });

  app.post('/api/production/runs/:runId/complete', (req, res) => {
    const run = db.prepare('SELECT * FROM production_runs WHERE id=?').get(req.params.runId);
    if (!run) return res.status(404).json({ message: 'Production run not found.' });
    const incomplete = db.prepare("SELECT COUNT(*) count FROM production_run_stages WHERE run_id=? AND status<>'COMPLETED'").get(run.id).count;
    const cpo = Number(req.body.cpoOutput), pk = Number(req.body.pkOutput || 0);
    if (incomplete) return res.status(409).json({ message: 'Complete every routing stage before completing the production run.' });
    if (!Number.isFinite(cpo) || cpo <= 0 || !Number.isFinite(pk) || pk < 0) return res.status(400).json({ message: 'A positive CPO output and valid Palm Kernel output are required.' });
    const { tenantId, millId } = requestContext(req);
    const cpoItem = db.prepare("SELECT inventory_controlled FROM items WHERE tenant_id=? AND mill_id=? AND status='Active' AND (item_code='CPO' OR item_type='CPO' OR name LIKE '%Crude Palm Oil%') LIMIT 1").get(tenantId, millId);
    const pkItem = db.prepare("SELECT inventory_controlled FROM items WHERE tenant_id=? AND mill_id=? AND status='Active' AND (item_code='PK' OR item_type='Palm Kernel' OR name LIKE '%Palm Kernel%') LIMIT 1").get(tenantId, millId);
    if (!cpoItem || !cpoItem.inventory_controlled || !pkItem || (pk > 0 && !pkItem.inventory_controlled)) return res.status(409).json({ code: 'INVENTORY_CONTROLLED_REQUIRED', message: 'CPO and Palm Kernel outputs must be Inventory Controlled before production inventory can be posted.' });
    const complete = db.transaction(() => {
      db.prepare("UPDATE production_runs SET status='COMPLETED',cpo_output=?,pk_output=?,completed_at=? WHERE id=?").run(cpo, pk, now(), run.id);
      db.prepare("UPDATE production_inventory SET balance=balance+?,updated_at=? WHERE material='CPO' AND location='CPO Tank 01'").run(cpo, now());
      db.prepare("UPDATE production_inventory SET balance=balance+?,updated_at=? WHERE material='PK' AND location='Kernel Silo'").run(pk, now());
      db.prepare("UPDATE stock SET balance=balance+?,trend=? WHERE material='CPO'").run(cpo, `+${cpo.toFixed(2)} MT`);
      db.prepare("UPDATE stock SET balance=balance+?,trend=? WHERE material='Palm Kernel'").run(pk, `+${pk.toFixed(2)} MT`);
    });
    complete(); res.json(runWithDetails(db.prepare('SELECT * FROM production_runs WHERE id=?').get(run.id)));
  });
}
