import crypto from 'node:crypto';

const now = () => new Date().toISOString();
const normalizeRegistration = (value) => String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();

export function registerLogisticsModule(app, db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL UNIQUE,
      usage TEXT NOT NULL, default_capacity REAL, capacity_uom TEXT NOT NULL DEFAULT 'MT',
      requires_tare INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT, registration_no TEXT NOT NULL UNIQUE, vehicle_type_id INTEGER,
      vehicle_type TEXT NOT NULL, supplier_name TEXT, supplier_plant TEXT, supplier_category TEXT,
      transporter TEXT, declared_capacity REAL, capacity_uom TEXT NOT NULL DEFAULT 'MT',
      status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id)
    );
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, identity_type TEXT NOT NULL, identity_no TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL, phone TEXT, license_no TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_verified_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  try { db.exec("ALTER TABLE drivers ADD COLUMN transporter TEXT NOT NULL DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE vehicles ADD COLUMN image_data TEXT NOT NULL DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE drivers ADD COLUMN image_data TEXT NOT NULL DEFAULT ''"); } catch {}
  for (const column of [
    "driver_identity_type TEXT", "driver_identity_no TEXT", "driver_license_no TEXT",
    "driver_id INTEGER", "vehicle_id INTEGER", "gate_status TEXT NOT NULL DEFAULT 'PENDING'",
    "entry_authorized_at TEXT", "entry_authorized_by TEXT"
  ]) { try { db.exec(`ALTER TABLE ffb_receipts ADD COLUMN ${column}`); } catch {} }

  if (!db.prepare('SELECT COUNT(*) count FROM vehicle_types').get().count) {
    const insert = db.prepare('INSERT INTO vehicle_types (code,name,usage,default_capacity,capacity_uom,requires_tare,status,created_at) VALUES (?,?,?,?,?,?,?,?)');
    [['FFB-TIPPER','FFB Tipper','FFB Inbound',25,'MT',1],['LORRY','Lorry','General Cargo',15,'MT',1],['TRUCK','Truck','General Cargo',30,'MT',1],['CPO-TANKER','CPO Tanker','Bulk Liquid',35,'MT',1]].forEach((row) => insert.run(...row,'ACTIVE',now()));
  }
  const driverSeed = db.prepare('INSERT OR IGNORE INTO drivers (identity_type,identity_no,name,phone,license_no,transporter,status,last_verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
  [
    ['Driving License', 'MY-DL-001', 'Ahmad Faizal Rahman', '+60 12 688 2041', 'MY-DL-001', 'Kencana Haulage Sdn. Bhd.', 'ACTIVE'],
    ['Driving License', 'MY-DL-005', 'Mohd Rizal Ismail', '+60 12 445 7812', 'MY-DL-005', 'Kencana Haulage Sdn. Bhd.', 'ACTIVE'],
    ['Driving License', 'MY-DL-006', 'Lim Wei Jian', '+60 16 704 2291', 'MY-DL-006', 'Kencana Haulage Sdn. Bhd.', 'ACTIVE'],
    ['Driving License', 'MY-DL-002', 'Siti Nur Aisyah', '+60 13 770 1822', 'MY-DL-002', 'Southern Palm Logistics Sdn. Bhd.', 'ACTIVE'],
    ['Driving License', 'MY-DL-003', 'Kumaravel Muthu', '+60 16 521 9044', 'MY-DL-003', 'Perak Bulk Transport Sdn. Bhd.', 'ACTIVE'],
    ['Driving License', 'MY-DL-004', 'Nurul Izzati Hassan', '+60 17 443 8290', 'MY-DL-004', 'East Coast Fleet Services Sdn. Bhd.', 'ACTIVE']
  ].forEach((row) => driverSeed.run(...row, now(), now(), now()));
  const existingReceipts = db.prepare("SELECT vehicle_no,vehicle_type,supplier,supplier_plant,supplier_category,transporter FROM ffb_receipts WHERE vehicle_no IS NOT NULL GROUP BY vehicle_no").all();
  const learnVehicle = db.prepare("INSERT OR IGNORE INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,created_at,updated_at) VALUES (?,(SELECT id FROM vehicle_types WHERE name=?),?,?,?,?,?,NULL,'MT','ACTIVE',?,?)");
  existingReceipts.forEach((row) => learnVehicle.run(normalizeRegistration(row.vehicle_no), row.vehicle_type, row.vehicle_type || 'FFB Tipper', row.supplier || '', row.supplier_plant || '', row.supplier_category || '', row.transporter || '', now(), now()));
  const fleetSeed = db.prepare("INSERT OR IGNORE INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,created_at,updated_at) VALUES (?,(SELECT id FROM vehicle_types WHERE name=?),?,?,?,?,?,?,'MT','ACTIVE',?,?)");
  [['KCH-2601', 'CPO Tanker', 'Kencana Haulage Sdn. Bhd.', 35], ['SPL-2602', 'CPO Tanker', 'Southern Palm Logistics Sdn. Bhd.', 35], ['PBT-2603', 'CPO Tanker', 'Perak Bulk Transport Sdn. Bhd.', 35], ['ECF-2604', 'CPO Tanker', 'East Coast Fleet Services Sdn. Bhd.', 35]].forEach(([registration, type, transporter, capacity]) => fleetSeed.run(registration, type, type, '', '', '', transporter, capacity, now(), now()));

  app.get('/api/vehicle-types', (_req, res) => res.json(db.prepare('SELECT * FROM vehicle_types ORDER BY name').all()));
  app.post('/api/vehicle-types', (req, res) => {
    const body = req.body; const capacity = body.defaultCapacity === '' || body.defaultCapacity == null ? null : Number(body.defaultCapacity);
    if (!body.code || !body.name || !body.usage) return res.status(400).json({ message: 'Vehicle type code, name and usage are required.' });
    try { const info = db.prepare('INSERT INTO vehicle_types (code,name,usage,default_capacity,capacity_uom,requires_tare,status,created_at) VALUES (?,?,?,?,?,?,?,?)').run(body.code.trim().toUpperCase(), body.name.trim(), body.usage, capacity, body.capacityUom || 'MT', body.requiresTare === true || body.requiresTare === 'true' ? 1 : 0, 'ACTIVE', now()); res.status(201).json(db.prepare('SELECT * FROM vehicle_types WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Vehicle type code and name must be unique.' : 'Unable to save vehicle type.' }); }
  });

  app.get('/api/vehicles', (_req, res) => res.json(db.prepare('SELECT * FROM vehicles ORDER BY registration_no').all()));
  app.put('/api/vehicles/:id', (req, res) => {
    const body = req.body; const type = db.prepare("SELECT * FROM vehicle_types WHERE id=? AND status='ACTIVE'").get(body.vehicleTypeId);
    if (!body.registrationNo || !type) return res.status(400).json({ message: 'Registration number and active vehicle type are required.' });
    try { db.prepare('UPDATE vehicles SET registration_no=?,vehicle_type_id=?,vehicle_type=?,supplier_name=?,supplier_plant=?,supplier_category=?,transporter=?,declared_capacity=?,capacity_uom=?,image_data=?,updated_at=? WHERE id=?').run(normalizeRegistration(body.registrationNo), type.id, type.name, body.supplierName || '', body.supplierPlant || '', body.supplierCategory || '', body.transporter || '', body.declaredCapacity ? Number(body.declaredCapacity) : type.default_capacity, body.capacityUom || type.capacity_uom, body.imageData || '', now(), req.params.id); res.json(db.prepare('SELECT * FROM vehicles WHERE id=?').get(req.params.id)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Vehicle registration number must be unique.' : 'Unable to update vehicle.' }); }
  });
  app.get('/api/drivers', (_req, res) => res.json(db.prepare("SELECT id,identity_no,name,phone,license_no,transporter,status,image_data FROM drivers WHERE status='ACTIVE' ORDER BY name").all()));
  app.post('/api/drivers', (req, res) => {
    const body = req.body;
    if (!body.name || !body.licenseNo || !body.transporter) return res.status(400).json({ message: 'Driver name, license number and transporter are required.' });
    try {
      const stamp = now();
      const info = db.prepare('INSERT INTO drivers (identity_type,identity_no,name,phone,license_no,transporter,status,image_data,last_verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?, ?,?,?,?)').run(body.identityType || 'Driving License', body.licenseNo.trim().toUpperCase(), body.name.trim(), body.phone || '', body.licenseNo.trim(), body.transporter, body.status || 'ACTIVE', body.imageData || '', stamp, stamp, stamp);
      res.status(201).json(db.prepare('SELECT id,identity_no,name,phone,license_no,transporter,status FROM drivers WHERE id=?').get(info.lastInsertRowid));
    } catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'License number must be unique.' : 'Unable to save driver.' }); }
  });
  app.put('/api/drivers/:id', (req, res) => {
    const body = req.body;
    if (!body.name || !body.licenseNo || !body.transporter) return res.status(400).json({ message: 'Driver name, license number and transporter are required.' });
    try { db.prepare('UPDATE drivers SET identity_no=?,name=?,phone=?,license_no=?,transporter=?,status=?,image_data=?,updated_at=? WHERE id=?').run(body.licenseNo.trim().toUpperCase(), body.name.trim(), body.phone || '', body.licenseNo.trim(), body.transporter, body.status || 'ACTIVE', body.imageData || '', now(), req.params.id); res.json(db.prepare('SELECT id,identity_no,name,phone,license_no,transporter,status,image_data FROM drivers WHERE id=?').get(req.params.id)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'License number must be unique.' : 'Unable to update driver.' }); }
  });
  app.post('/api/vehicles', (req, res) => {
    const body = req.body; const type = db.prepare("SELECT * FROM vehicle_types WHERE id=? AND status='ACTIVE'").get(body.vehicleTypeId);
    if (!body.registrationNo || !type) return res.status(400).json({ message: 'Registration number and active vehicle type are required.' });
    try { const stamp = now(); const info = db.prepare('INSERT INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,image_data,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?, ?,?)').run(normalizeRegistration(body.registrationNo), type.id, type.name, body.supplierName || '', body.supplierPlant || '', body.supplierCategory || '', body.transporter || '', body.declaredCapacity ? Number(body.declaredCapacity) : type.default_capacity, body.capacityUom || type.capacity_uom, 'ACTIVE', body.imageData || '', stamp, stamp); res.status(201).json(db.prepare('SELECT * FROM vehicles WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Vehicle registration number must be unique.' : 'Unable to save vehicle.' }); }
  });

  app.get('/api/vehicle-lookup', (req, res) => {
    const registration = normalizeRegistration(req.query.registration);
    if (!registration) return res.status(400).json({ message: 'Vehicle registration number is required.' });
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE registration_no=? AND status='ACTIVE'").get(registration);
    if (!vehicle) return res.json({ found: false, registrationNo: registration });
    const latestReceipt = db.prepare('SELECT supplier,driver_name,driver_license_no FROM ffb_receipts WHERE vehicle_no=? ORDER BY id DESC LIMIT 1').get(registration);
    const driver = latestReceipt?.driver_name ? { name: latestReceipt.driver_name, identity_no: latestReceipt.driver_license_no || '' } : (vehicle.transporter ? db.prepare("SELECT name, identity_no FROM drivers WHERE transporter=? AND status='ACTIVE' ORDER BY id LIMIT 1").get(vehicle.transporter) : null);
    res.json({ found: true, vehicle: { ...vehicle, supplier_name: latestReceipt?.supplier || vehicle.supplier_name || '', driver_name: driver?.name || '', driver_license_no: driver?.identity_no || '' } });
  });

  app.get('/api/driver-lookup', (req, res) => {
    const identityNo = String(req.query.identityNo || '').trim().toUpperCase();
    if (!identityNo) return res.status(400).json({ message: 'Driver identity number is required.' });
    const driver = db.prepare("SELECT * FROM drivers WHERE UPPER(identity_no)=? AND status='ACTIVE'").get(identityNo);
    res.json(driver ? { found: true, driver } : { found: false, identityNo });
  });
}

export function createFfbReceiptHandler(db) {
  return (req, res) => {
    const body = req.body; const gross = Number(body.grossWeight); const registration = normalizeRegistration(body.vehicleNo);
    const declaredQty = body.supplierDeclaredQty === '' || body.supplierDeclaredQty == null ? null : Number(body.supplierDeclaredQty);
    if (!registration || !body.driverName || !body.supplier || !body.item || !Number.isFinite(gross) || gross <= 0) return res.status(400).json({ code: 'INVALID_RECEIVING', message: 'Driver name, lorry plate number, supplier, item and a positive gross weight are required.' });
    if (declaredQty !== null && (!Number.isFinite(declaredQty) || declaredQty < 0)) return res.status(400).json({ code: 'INVALID_DECLARED_QTY', message: 'Supplier declared quantity must be zero or greater.' });
    const vehicleType = body.vehicleType || 'FFB Tipper';
    const stamp = now(); const ticket = `WB-${stamp.slice(0,10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; const receiptCode = `RC-${stamp.slice(0,10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    try {
      const create = db.transaction(() => {
        const type = db.prepare('SELECT * FROM vehicle_types WHERE name=?').get(vehicleType);
        db.prepare(`INSERT INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,'ACTIVE',?,?) ON CONFLICT(registration_no) DO UPDATE SET vehicle_type_id=excluded.vehicle_type_id,vehicle_type=excluded.vehicle_type,supplier_name=excluded.supplier_name,supplier_plant=excluded.supplier_plant,supplier_category=excluded.supplier_category,transporter=excluded.transporter,updated_at=excluded.updated_at`)
          .run(registration, type?.id || null, vehicleType, body.supplier, '', '', '', null, body.weightUom || 'MT', stamp, stamp);
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE registration_no=?').get(registration);
        let driver = null;
        if (body.driverLicenseNo) {
          const identity = body.driverLicenseNo.trim().toUpperCase();
          db.prepare(`INSERT INTO drivers (identity_type,identity_no,name,phone,license_no,status,last_verified_at,created_at,updated_at)
            VALUES (?,?,?,?,?,'ACTIVE',?,?,?) ON CONFLICT(identity_no) DO UPDATE SET identity_type=excluded.identity_type,name=excluded.name,license_no=excluded.license_no,last_verified_at=excluded.last_verified_at,updated_at=excluded.updated_at`)
            .run('Driving License', identity, body.driverName.trim(), '', body.driverLicenseNo.trim(), stamp, stamp, stamp);
          driver = db.prepare('SELECT * FROM drivers WHERE identity_no=?').get(identity);
        }
        const info = db.prepare(`INSERT INTO ffb_receipts (ticket_no,receipt_code,vehicle_no,vehicle_type,driver_name,driver_phone,delivery_order,supplier,supplier_plant,supplier_category,transporter,product_type,gross_weight,supplier_declared_qty,weight_uom,operator_name,entry_at,remarks,attachments_json,driver_identity_type,driver_identity_no,driver_license_no,driver_id,vehicle_id,gate_status,entry_authorized_at,entry_authorized_by,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(ticket, receiptCode, registration, vehicleType, body.driverName.trim(), '', '', body.supplier, '', '', '', body.item, gross, declaredQty, body.weightUom || 'MT', 'Sean Shapiro', stamp, body.remarks || '', JSON.stringify(body.attachments || []), driver ? 'Driving License' : null, driver ? body.driverLicenseNo.trim().toUpperCase() : null, body.driverLicenseNo || '', driver?.id || null, vehicle.id, 'AUTHORIZED_INSIDE', stamp, 'Sean Shapiro', stamp);
        return info.lastInsertRowid;
      });
      const id = create(); const saved = db.prepare('SELECT * FROM ffb_receipts WHERE id=?').get(id); const supplier = db.prepare('SELECT id,details_json FROM suppliers WHERE name=?').get(saved.supplier); if (supplier) { let details = {}; try { details = JSON.parse(supplier.details_json || '{}'); } catch {} const vehicles = Array.isArray(details.vehicles) ? details.vehicles : []; const drivers = Array.isArray(details.drivers) ? details.drivers : []; if (!vehicles.some((item) => item.plateNo === saved.vehicle_no)) vehicles.push({ plateNo: saved.vehicle_no, vehicleType: saved.vehicle_type, lastSeenAt: saved.entry_at }); const driverKey = saved.driver_license_no || saved.driver_name; if (driverKey && !drivers.some((item) => (item.licenseNo || item.name) === driverKey)) drivers.push({ name: saved.driver_name, licenseNo: saved.driver_license_no || '', lastSeenAt: saved.entry_at }); db.prepare('UPDATE suppliers SET details_json=? WHERE id=?').run(JSON.stringify({ ...details, vehicles, drivers }), supplier.id); } res.status(201).json(saved);
    } catch (error) { res.status(400).json({ code: 'RECEIVING_CREATE_FAILED', message: error.message }); }
  };
}
