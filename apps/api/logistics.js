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
  for (const column of [
    "receipt_code TEXT",
    "driver_identity_type TEXT", "driver_identity_no TEXT", "driver_license_no TEXT",
    "driver_id INTEGER", "vehicle_id INTEGER", "gate_status TEXT NOT NULL DEFAULT 'PENDING'",
    "entry_authorized_at TEXT", "entry_authorized_by TEXT"
  ]) { try { db.exec(`ALTER TABLE ffb_receipts ADD COLUMN ${column}`); } catch {} }
  // Backfill records created before receipt references were persisted.
  db.exec("UPDATE ffb_receipts SET receipt_code = 'RC-' || replace(substr(entry_at,1,10),'-','') || '-' || printf('%06d', id) WHERE receipt_code IS NULL OR receipt_code='' ");

  if (!db.prepare('SELECT COUNT(*) count FROM vehicle_types').get().count) {
    const insert = db.prepare('INSERT INTO vehicle_types (code,name,usage,default_capacity,capacity_uom,requires_tare,status,created_at) VALUES (?,?,?,?,?,?,?,?)');
    [['FFB-TIPPER','FFB Tipper','FFB Inbound',25,'MT',1],['LORRY','Lorry','General Cargo',15,'MT',1],['TRUCK','Truck','General Cargo',30,'MT',1],['CPO-TANKER','CPO Tanker','Bulk Liquid',35,'MT',1]].forEach((row) => insert.run(...row,'ACTIVE',now()));
  }
  const existingReceipts = db.prepare("SELECT vehicle_no,vehicle_type,supplier,supplier_plant,supplier_category,transporter FROM ffb_receipts WHERE vehicle_no IS NOT NULL GROUP BY vehicle_no").all();
  const learnVehicle = db.prepare("INSERT OR IGNORE INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,created_at,updated_at) VALUES (?,(SELECT id FROM vehicle_types WHERE name=?),?,?,?,?,?,NULL,'MT','ACTIVE',?,?)");
  existingReceipts.forEach((row) => learnVehicle.run(normalizeRegistration(row.vehicle_no), row.vehicle_type, row.vehicle_type || 'FFB Tipper', row.supplier || '', row.supplier_plant || '', row.supplier_category || '', row.transporter || '', now(), now()));

  app.get('/api/vehicle-types', (_req, res) => res.json(db.prepare('SELECT * FROM vehicle_types ORDER BY name').all()));
  app.post('/api/vehicle-types', (req, res) => {
    const body = req.body; const capacity = body.defaultCapacity === '' || body.defaultCapacity == null ? null : Number(body.defaultCapacity);
    if (!body.code || !body.name || !body.usage) return res.status(400).json({ message: 'Vehicle type code, name and usage are required.' });
    try { const info = db.prepare('INSERT INTO vehicle_types (code,name,usage,default_capacity,capacity_uom,requires_tare,status,created_at) VALUES (?,?,?,?,?,?,?,?)').run(body.code.trim().toUpperCase(), body.name.trim(), body.usage, capacity, body.capacityUom || 'MT', body.requiresTare === true || body.requiresTare === 'true' ? 1 : 0, 'ACTIVE', now()); res.status(201).json(db.prepare('SELECT * FROM vehicle_types WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Vehicle type code and name must be unique.' : 'Unable to save vehicle type.' }); }
  });

  app.get('/api/vehicles', (_req, res) => res.json(db.prepare('SELECT * FROM vehicles ORDER BY registration_no').all()));
  app.post('/api/vehicles', (req, res) => {
    const body = req.body; const type = db.prepare("SELECT * FROM vehicle_types WHERE id=? AND status='ACTIVE'").get(body.vehicleTypeId);
    if (!body.registrationNo || !type) return res.status(400).json({ message: 'Registration number and active vehicle type are required.' });
    try { const stamp = now(); const info = db.prepare('INSERT INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(normalizeRegistration(body.registrationNo), type.id, type.name, body.supplierName || '', body.supplierPlant || '', body.supplierCategory || '', body.transporter || '', body.declaredCapacity ? Number(body.declaredCapacity) : type.default_capacity, body.capacityUom || type.capacity_uom, 'ACTIVE', stamp, stamp); res.status(201).json(db.prepare('SELECT * FROM vehicles WHERE id=?').get(info.lastInsertRowid)); }
    catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Vehicle registration number must be unique.' : 'Unable to save vehicle.' }); }
  });

  app.get('/api/vehicle-lookup', (req, res) => {
    const registration = normalizeRegistration(req.query.registration);
    if (!registration) return res.status(400).json({ message: 'Vehicle registration number is required.' });
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE registration_no=? AND status='ACTIVE'").get(registration);
    if (!vehicle) return res.json({ found: false, registrationNo: registration });
    res.json({ found: true, vehicle });
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
    if (!registration || !body.supplier || !body.vehicleType || !Number.isFinite(gross) || gross <= 0) return res.status(400).json({ code: 'INVALID_RECEIVING', message: 'Vehicle, vehicle type, supplier and a positive gross weight are required.' });
    if (!body.driverName) return res.status(400).json({ code: 'DRIVER_REQUIRED', message: 'Driver name is required before mill entry can be authorized.' });
    const driverIdentityType = String(body.driverIdentityType || '').trim() || null;
    const driverIdentityNo = String(body.driverIdentityNo || '').trim().toUpperCase() || null;
    const stamp = now(); const dateCode = stamp.slice(0,10).replaceAll('-', ''); const ticket = `WB-${dateCode}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    try {
      const create = db.transaction(() => {
        const type = db.prepare('SELECT * FROM vehicle_types WHERE name=?').get(body.vehicleType);
        db.prepare(`INSERT INTO vehicles (registration_no,vehicle_type_id,vehicle_type,supplier_name,supplier_plant,supplier_category,transporter,declared_capacity,capacity_uom,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,'ACTIVE',?,?) ON CONFLICT(registration_no) DO UPDATE SET vehicle_type_id=excluded.vehicle_type_id,vehicle_type=excluded.vehicle_type,supplier_name=excluded.supplier_name,supplier_plant=excluded.supplier_plant,supplier_category=excluded.supplier_category,transporter=excluded.transporter,updated_at=excluded.updated_at`)
          .run(registration, type?.id || null, body.vehicleType, body.supplier, body.supplierPlant || '', body.supplierCategory || '', body.transporter || '', body.declaredCapacity ? Number(body.declaredCapacity) : type?.default_capacity || null, body.weightUom || 'MT', stamp, stamp);
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE registration_no=?').get(registration);
        let driver = null;
        if (driverIdentityNo) {
          db.prepare(`INSERT INTO drivers (identity_type,identity_no,name,phone,license_no,status,last_verified_at,created_at,updated_at)
            VALUES (?,?,?,?,?,'ACTIVE',?,?,?) ON CONFLICT(identity_no) DO UPDATE SET identity_type=excluded.identity_type,name=excluded.name,phone=excluded.phone,license_no=excluded.license_no,last_verified_at=excluded.last_verified_at,updated_at=excluded.updated_at`)
            .run(driverIdentityType || 'Driving License', driverIdentityNo, body.driverName.trim(), body.driverPhone || '', body.driverLicenseNo || '', stamp, stamp, stamp);
          driver = db.prepare('SELECT * FROM drivers WHERE identity_no=?').get(driverIdentityNo);
        }
        const info = db.prepare(`INSERT INTO ffb_receipts (ticket_no,vehicle_no,vehicle_type,driver_name,driver_phone,delivery_order,supplier,supplier_plant,supplier_category,transporter,product_type,gross_weight,weight_uom,operator_name,entry_at,remarks,attachments_json,driver_identity_type,driver_identity_no,driver_license_no,driver_id,vehicle_id,gate_status,entry_authorized_at,entry_authorized_by,created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(ticket, registration, body.vehicleType, body.driverName.trim(), body.driverPhone || '', body.deliveryOrder || '', body.supplier, body.supplierPlant || '', body.supplierCategory || '', body.transporter || '', body.productType || 'FFB', gross, body.weightUom || 'MT', 'Sean Shapiro', stamp, body.remarks || '', JSON.stringify(body.attachments || []), driverIdentityType, driverIdentityNo, body.driverLicenseNo || '', driver?.id || null, vehicle.id, 'AUTHORIZED_INSIDE', stamp, 'Sean Shapiro', stamp);
        db.prepare('UPDATE ffb_receipts SET receipt_code=? WHERE id=?').run(`RC-${dateCode}-${String(info.lastInsertRowid).padStart(6, '0')}`, info.lastInsertRowid);
        return info.lastInsertRowid;
      });
      const id = create(); res.status(201).json(db.prepare('SELECT * FROM ffb_receipts WHERE id=?').get(id));
    } catch (error) { res.status(400).json({ code: 'RECEIVING_CREATE_FAILED', message: error.message }); }
  };
}
