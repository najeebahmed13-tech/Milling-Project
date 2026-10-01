export function registerPaymentsModule(app, db) {
  db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL,
    payment_number TEXT NOT NULL, payment_type TEXT NOT NULL, party TEXT NOT NULL,
    payment_date TEXT NOT NULL, currency TEXT NOT NULL, amount REAL NOT NULL CHECK(amount > 0),
    payment_method TEXT NOT NULL, reference TEXT, notes_text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','POSTED','VOIDED')), created_at TEXT NOT NULL,
    UNIQUE(tenant_id, mill_id, payment_number)
  );`);
  const context = (req) => ({ tenantId: req.get('X-Tenant-Id') || 'demo-tenant', millId: req.get('X-Mill-Id') || 'demo-mill' });
  const query = `SELECT * FROM payments WHERE tenant_id=? AND mill_id=?`;
  app.get('/api/payments', (req, res) => { const { tenantId, millId } = context(req); res.json(db.prepare(`${query} ORDER BY id DESC`).all(tenantId, millId)); });
  app.get('/api/payments/:id', (req, res) => { const { tenantId, millId } = context(req); const payment = db.prepare(`${query} AND id=?`).get(tenantId, millId, req.params.id); if (!payment) return res.status(404).json({ message: 'Payment not found.' }); res.json(payment); });
  app.post('/api/payments', (req, res) => { const { tenantId, millId } = context(req); const body = req.body || {}; if (!body.paymentType || !body.party || !body.paymentDate || !body.currency || !Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0 || !body.paymentMethod) return res.status(400).json({ message: 'Payment type, party, date, currency, positive amount and method are required.' }); try { const count = db.prepare('SELECT COUNT(*) AS count FROM payments WHERE tenant_id=? AND mill_id=?').get(tenantId, millId).count + 1; const number = body.paymentNumber?.trim() || `PAY-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${String(count).padStart(4, '0')}`; const info = db.prepare('INSERT INTO payments (tenant_id,mill_id,payment_number,payment_type,party,payment_date,currency,amount,payment_method,reference,notes_text,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,\'DRAFT\',?)').run(tenantId, millId, number, body.paymentType, body.party, body.paymentDate, body.currency, Number(body.amount), body.paymentMethod, body.reference || '', body.notesText || '', new Date().toISOString()); res.status(201).json(db.prepare(`${query} AND id=?`).get(tenantId, millId, info.lastInsertRowid)); } catch (error) { res.status(409).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Payment number must be unique.' : 'Unable to save payment.' }); } });
}
