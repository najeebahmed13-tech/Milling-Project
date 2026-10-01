import crypto from 'node:crypto';

const now = () => new Date().toISOString();
const reference = () => `DO-${now().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const detail = (db, id) => {
  const order = db.prepare('SELECT * FROM dispatch_orders WHERE id=?').get(id);
  if (!order) return null;
  return { ...order, qualityReceipt: db.prepare('SELECT * FROM dispatch_quality_receipts WHERE dispatch_order_id=? ORDER BY id DESC LIMIT 1').get(id) || null };
};

export function registerDispatchModule(app, db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dispatch_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL UNIQUE, material TEXT NOT NULL,
      customer TEXT NOT NULL, quantity REAL NOT NULL, uom TEXT NOT NULL DEFAULT 'MT',
      vehicle_no TEXT NOT NULL, driver_name TEXT, loading_bay TEXT, status TEXT NOT NULL DEFAULT 'ORDERED',
      empty_weight REAL, loaded_weight REAL, tare_weight REAL, net_weight REAL, loaded_quantity REAL,
      order_date TEXT NOT NULL, empty_weighed_at TEXT, bay_assigned_at TEXT, loading_started_at TEXT,
      loading_completed_at TEXT, loaded_weighed_at TEXT, vehicle_exit_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dispatch_quality_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, dispatch_order_id INTEGER NOT NULL, receipt_no TEXT NOT NULL UNIQUE,
      sample_time TEXT NOT NULL, parameter_results_json TEXT NOT NULL, status TEXT NOT NULL,
      remarks TEXT, tested_by TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY (dispatch_order_id) REFERENCES dispatch_orders(id)
    );
  `);
  const list = () => db.prepare('SELECT * FROM dispatch_orders ORDER BY id DESC').all().map((row) => ({ ...row, qualityReceipt: db.prepare('SELECT * FROM dispatch_quality_receipts WHERE dispatch_order_id=? ORDER BY id DESC LIMIT 1').get(row.id) || null }));
  const requireOrder = (req, res) => { const order = db.prepare('SELECT * FROM dispatch_orders WHERE id=?').get(req.params.id); if (!order) { res.status(404).json({ message: 'Dispatch order not found.' }); return null; } return order; };
  const transition = (req, res, expected, update, values = []) => { const order = requireOrder(req, res); if (!order) return; if (order.status !== expected) return res.status(409).json({ message: `Dispatch order must be ${expected.replaceAll('_', ' ').toLowerCase()} before this step.` }); db.prepare(update).run(...values, order.id); res.json(detail(db, order.id)); };

  app.get('/api/dispatch-orders', (_req, res) => res.json(list()));
  app.get('/api/dispatch-orders/:id', (req, res) => { const order = detail(db, req.params.id); if (!order) return res.status(404).json({ message: 'Dispatch order not found.' }); res.json(order); });
  app.post('/api/dispatch-orders', (req, res) => {
    const body = req.body; const quantity = Number(body.quantity);
    if (!body.material || !body.customer || !body.vehicleNo || !Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: 'Material, customer, vehicle and positive quantity are required.' });
    const stock = db.prepare('SELECT COALESCE(SUM(balance),0) balance FROM stock WHERE material=?').get(body.material).balance;
    if (quantity > Number(stock || 0)) return res.status(409).json({ message: `Only ${Number(stock || 0).toFixed(3)} MT of ${body.material} is available for dispatch.` });
    try { const stamp = now(); const info = db.prepare('INSERT INTO dispatch_orders (order_no,material,customer,quantity,uom,vehicle_no,driver_name,status,order_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(reference(), body.material, body.customer.trim(), quantity, 'MT', body.vehicleNo.trim().toUpperCase(), body.driverName || '', 'ORDERED', stamp, stamp); res.status(201).json(detail(db, info.lastInsertRowid)); }
    catch { res.status(400).json({ message: 'Unable to create dispatch order.' }); }
  });
  app.post('/api/dispatch-orders/:id/empty-weighing', (req, res) => { const weight = Number(req.body.emptyWeight); if (!Number.isFinite(weight) || weight <= 0) return res.status(400).json({ message: 'A positive empty vehicle weight is required.' }); transition(req, res, 'ORDERED', 'UPDATE dispatch_orders SET empty_weight=?,status=?,empty_weighed_at=? WHERE id=?', [weight, 'EMPTY_WEIGHED', now()]); });
  app.post('/api/dispatch-orders/:id/loading-bay', (req, res) => { if (!req.body.loadingBay) return res.status(400).json({ message: 'Loading bay is required.' }); transition(req, res, 'EMPTY_WEIGHED', 'UPDATE dispatch_orders SET loading_bay=?,status=?,bay_assigned_at=? WHERE id=?', [req.body.loadingBay.trim(), 'BAY_ASSIGNED', now()]); });
  app.post('/api/dispatch-orders/:id/loading/start', (req, res) => transition(req, res, 'BAY_ASSIGNED', 'UPDATE dispatch_orders SET status=?,loading_started_at=? WHERE id=?', ['LOADING', now()]));
  app.post('/api/dispatch-orders/:id/loading/complete', (req, res) => { const quantity = Number(req.body.loadedQuantity); if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: 'Loaded quantity must be positive.' }); transition(req, res, 'LOADING', 'UPDATE dispatch_orders SET loaded_quantity=?,status=?,loading_completed_at=? WHERE id=?', [quantity, 'QUALITY_PENDING', now()]); });
  app.post('/api/dispatch-orders/:id/quality', (req, res) => {
    const order = requireOrder(req, res); if (!order) return; if (order.status !== 'QUALITY_PENDING') return res.status(409).json({ message: 'Loading must be completed before quality sampling.' });
    if (!req.body.testedBy || !req.body.status) return res.status(400).json({ message: 'Tester and quality status are required.' });
    const receiptNo = `QR-${now().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare('INSERT INTO dispatch_quality_receipts (dispatch_order_id,receipt_no,sample_time,parameter_results_json,status,remarks,tested_by,created_at) VALUES (?,?,?,?,?,?,?,?)').run(order.id, receiptNo, now(), JSON.stringify(req.body.parameters || []), req.body.status, req.body.remarks || '', req.body.testedBy, now());
    db.prepare('UPDATE dispatch_orders SET status=? WHERE id=?').run(req.body.status === 'PASS' ? 'QUALITY_RELEASED' : 'QUALITY_HOLD', order.id);
    res.json(detail(db, order.id));
  });
  app.post('/api/dispatch-orders/:id/loaded-weighing', (req, res) => { const weight = Number(req.body.loadedWeight); if (!Number.isFinite(weight) || weight <= 0) return res.status(400).json({ message: 'A positive loaded vehicle weight is required.' }); transition(req, res, 'QUALITY_RELEASED', 'UPDATE dispatch_orders SET loaded_weight=?,status=?,loaded_weighed_at=? WHERE id=?', [weight, 'LOADED_WEIGHED', now()]); });
  app.post('/api/dispatch-orders/:id/vehicle-exit', (req, res) => {
    const order = requireOrder(req, res); if (!order) return; if (order.status !== 'LOADED_WEIGHED') return res.status(409).json({ message: 'Loaded weighing must be completed before vehicle exit.' });
    const tare = req.body.tareWeight === undefined || req.body.tareWeight === '' ? Number(order.empty_weight) : Number(req.body.tareWeight); const net = Number((Number(order.loaded_weight) - tare).toFixed(3));
    if (!Number.isFinite(tare) || tare <= 0 || net <= 0) return res.status(400).json({ message: 'Tare must be positive and loaded weight must exceed tare.' });
    const complete = db.transaction(() => { db.prepare('UPDATE dispatch_orders SET tare_weight=?,net_weight=?,status=?,vehicle_exit_at=? WHERE id=?').run(tare, net, 'COMPLETED', now(), order.id); db.prepare('UPDATE stock SET balance=MAX(0,balance-?),trend=? WHERE material=?').run(net, `-${net.toFixed(2)} MT`, order.material); }); complete(); res.json(detail(db, order.id));
  });
}
