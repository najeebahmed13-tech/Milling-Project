import crypto from 'node:crypto';

const context = (req) => ({
  tenantId: req.get('X-Tenant-Id') || 'demo-tenant',
  millId: req.get('X-Mill-Id') || 'demo-mill',
  actorId: req.get('X-Actor-Id') || 'demo-user',
});

export function registerPurchasingModule(app, db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS direct_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL,
      purchase_number TEXT NOT NULL, supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      purchase_date TEXT NOT NULL, currency TEXT NOT NULL, subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL DEFAULT 0, total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'POSTED', invoice_id INTEGER,
      idempotency_key TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(tenant_id, idempotency_key), UNIQUE(tenant_id, mill_id, purchase_number)
    );
    CREATE TABLE IF NOT EXISTS direct_purchase_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_id INTEGER NOT NULL REFERENCES direct_purchases(id),
      item_id INTEGER NOT NULL REFERENCES items(id), description TEXT NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0), uom TEXT NOT NULL,
      unit_price REAL NOT NULL CHECK(unit_price >= 0), line_total REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL, supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      source_type TEXT NOT NULL, source_id INTEGER NOT NULL REFERENCES direct_purchases(id),
      invoice_date TEXT NOT NULL, currency TEXT NOT NULL, subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL DEFAULT 0, total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT', created_at TEXT NOT NULL,
      UNIQUE(tenant_id, mill_id, invoice_number), UNIQUE(tenant_id, source_type, source_id)
    );
    CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id),
      item_id INTEGER NOT NULL REFERENCES items(id), description TEXT NOT NULL,
      quantity REAL NOT NULL, uom TEXT NOT NULL, unit_price REAL NOT NULL, line_total REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS purchase_audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, mill_id TEXT NOT NULL,
      actor_id TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
  for (const column of [
    "terms_master_code TEXT NOT NULL DEFAULT ''",
    "terms_text TEXT NOT NULL DEFAULT ''",
    "attachments_json TEXT NOT NULL DEFAULT '[]'",
  ]) { try { db.exec(`ALTER TABLE direct_purchases ADD COLUMN ${column}`); } catch {} }

  const invoiceQuery = `SELECT i.*, s.name AS supplier_name, d.purchase_number
    FROM purchase_invoices i JOIN suppliers s ON s.id = i.supplier_id
    JOIN direct_purchases d ON d.id = i.source_id
    WHERE i.tenant_id = ? AND i.mill_id = ?`;

  const purchaseQuery = `SELECT d.*, s.name AS supplier_name, i.invoice_number
    FROM direct_purchases d JOIN suppliers s ON s.id = d.supplier_id
    LEFT JOIN purchase_invoices i ON i.id = d.invoice_id
    WHERE d.tenant_id = ? AND d.mill_id = ?`;

  app.get('/api/direct-purchases', (req, res) => {
    const { tenantId, millId } = context(req);
    res.json(db.prepare(`${purchaseQuery} ORDER BY d.id DESC`).all(tenantId, millId));
  });

  app.get('/api/direct-purchases/:id', (req, res) => {
    const { tenantId, millId } = context(req);
    const purchase = db.prepare(`${purchaseQuery} AND d.id = ?`).get(tenantId, millId, req.params.id);
    if (!purchase) return res.status(404).json({ code: 'DIRECT_PURCHASE_NOT_FOUND', message: 'Direct purchase not found.' });
    const lines = db.prepare(`SELECT l.*, it.item_code FROM direct_purchase_lines l JOIN items it ON it.id = l.item_id WHERE l.purchase_id = ? ORDER BY l.id`).all(purchase.id);
    res.json({ ...purchase, lines });
  });

  app.get('/api/purchase-invoices', (req, res) => {
    const { tenantId, millId } = context(req);
    const rows = db.prepare(`${invoiceQuery} ORDER BY i.id DESC`).all(tenantId, millId);
    res.json(rows);
  });

  app.get('/api/purchase-invoices/:id', (req, res) => {
    const { tenantId, millId } = context(req);
    const invoice = db.prepare(`${invoiceQuery} AND i.id = ?`).get(tenantId, millId, req.params.id);
    if (!invoice) return res.status(404).json({ code: 'PURCHASE_INVOICE_NOT_FOUND', message: 'Purchase invoice not found.' });
    const lines = db.prepare(`SELECT l.*, it.item_code FROM purchase_invoice_lines l JOIN items it ON it.id = l.item_id WHERE l.invoice_id = ? ORDER BY l.id`).all(invoice.id);
    res.json({ ...invoice, lines });
  });

  app.patch('/api/purchase-invoices/:id', (req, res) => {
    const { tenantId, millId, actorId } = context(req);
    const invoice = db.prepare(`${invoiceQuery} AND i.id = ?`).get(tenantId, millId, req.params.id);
    if (!invoice) return res.status(404).json({ code: 'PURCHASE_INVOICE_NOT_FOUND', message: 'Purchase invoice not found.' });
    if (invoice.status !== 'DRAFT') return res.status(409).json({ code: 'PURCHASE_INVOICE_NOT_EDITABLE', message: 'Only draft purchase invoices can be edited.' });
    const body = req.body || {};
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!body.invoiceDate || !body.currency || !lines.length) return res.status(400).json({ code: 'PURCHASE_INVOICE_VALIDATION_FAILED', message: 'Invoice date, currency and at least one line are required.' });
    const normalized = lines.map((line) => ({ itemId: Number(line.itemId), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) }));
    if (normalized.some((line) => !Number.isInteger(line.itemId) || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) return res.status(400).json({ code: 'PURCHASE_INVOICE_LINE_INVALID', message: 'Each invoice line requires an item, positive quantity and non-negative unit price.' });
    try {
      const updated = db.transaction(() => {
        const items = normalized.map((line) => db.prepare('SELECT id, name, unit FROM items WHERE id = ? AND status = ?').get(line.itemId, 'Active'));
        if (items.some((item) => !item)) throw Object.assign(new Error('One or more selected items are not active.'), { code: 'ITEM_NOT_FOUND' });
        const subtotal = Number(normalized.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2));
        const taxAmount = Number((subtotal * (Number(body.taxRate || 0) / 100)).toFixed(2));
        const totalAmount = Number((subtotal + taxAmount).toFixed(2));
        const stamp = new Date().toISOString();
        db.prepare('UPDATE purchase_invoices SET invoice_number=?,invoice_date=?,currency=?,subtotal=?,tax_amount=?,total_amount=? WHERE id=? AND tenant_id=? AND mill_id=?').run(body.invoiceNumber?.trim() || invoice.invoice_number, body.invoiceDate, body.currency, subtotal, taxAmount, totalAmount, invoice.id, tenantId, millId);
        db.prepare('DELETE FROM purchase_invoice_lines WHERE invoice_id=?').run(invoice.id);
        const insert = db.prepare('INSERT INTO purchase_invoice_lines (invoice_id,item_id,description,quantity,uom,unit_price,line_total) VALUES (?,?,?,?,?,?,?)');
        normalized.forEach((line, index) => { const item = items[index]; insert.run(invoice.id, line.itemId, item.name, line.quantity, item.unit, line.unitPrice, Number((line.quantity * line.unitPrice).toFixed(2))); });
        db.prepare('INSERT INTO purchase_audit_events (tenant_id,mill_id,actor_id,action,entity_type,entity_id,details_json,created_at) VALUES (?,?,?,?,?,?,?,?)').run(tenantId, millId, actorId, 'PURCHASE_INVOICE_DRAFT_UPDATED', 'PURCHASE_INVOICE', String(invoice.id), JSON.stringify({ invoiceNumber: body.invoiceNumber || invoice.invoice_number, totalAmount }), stamp);
        return db.prepare(`${invoiceQuery} AND i.id = ?`).get(tenantId, millId, invoice.id);
      })();
      res.json({ ...updated, lines: db.prepare('SELECT l.*, it.item_code FROM purchase_invoice_lines l JOIN items it ON it.id = l.item_id WHERE l.invoice_id = ? ORDER BY l.id').all(invoice.id) });
    } catch (error) { res.status(error.code === 'ITEM_NOT_FOUND' ? 400 : 409).json({ code: error.code || 'PURCHASE_INVOICE_UPDATE_FAILED', message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Invoice number must be unique.' : error.message || 'Unable to update purchase invoice.' }); }
  });

  app.post('/api/direct-purchases', (req, res) => {
    const { tenantId, millId, actorId } = context(req);
    const body = req.body || {};
    const key = req.get('Idempotency-Key');
    const supplierId = Number(body.supplierId);
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!key) return res.status(400).json({ code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required.' });
    if (!Number.isInteger(supplierId) || !body.purchaseDate || !body.currency || !lines.length) return res.status(400).json({ code: 'DIRECT_PURCHASE_VALIDATION_FAILED', message: 'Supplier, purchase date, currency and at least one line are required.' });
    const supplier = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(supplierId);
    if (!supplier) return res.status(400).json({ code: 'SUPPLIER_NOT_FOUND', message: 'Selected supplier was not found.' });
    const normalized = lines.map((line) => ({
      itemId: Number(line.itemId), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice),
    }));
    if (normalized.some((line) => !Number.isInteger(line.itemId) || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) return res.status(400).json({ code: 'DIRECT_PURCHASE_LINE_INVALID', message: 'Each line requires an item, positive quantity and non-negative unit price.' });
    try {
      const result = db.transaction(() => {
        const existing = db.prepare('SELECT * FROM direct_purchases WHERE tenant_id = ? AND idempotency_key = ?').get(tenantId, key);
        if (existing) return db.prepare(`${invoiceQuery} AND i.id = ?`).get(tenantId, millId, existing.invoice_id);
        const items = normalized.map((line) => db.prepare('SELECT id, name, unit FROM items WHERE id = ? AND status = ?').get(line.itemId, 'Active'));
        if (items.some((item) => !item)) throw Object.assign(new Error('One or more selected items are not active.'), { code: 'ITEM_NOT_FOUND' });
        const subtotal = Number(normalized.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2));
        const taxAmount = Number((subtotal * (Number(body.taxRate || 0) / 100)).toFixed(2));
        const totalAmount = Number((subtotal + taxAmount).toFixed(2));
        const stamp = new Date().toISOString();
        const seq = db.prepare('SELECT COUNT(*) AS count FROM direct_purchases WHERE tenant_id = ? AND mill_id = ?').get(tenantId, millId).count + 1;
        const purchaseNumber = `DP-${stamp.slice(0, 10).replaceAll('-', '')}-${String(seq).padStart(4, '0')}`;
        const invoiceNumber = body.invoiceNumber?.trim() || `PI-${stamp.slice(0, 10).replaceAll('-', '')}-${String(seq).padStart(4, '0')}`;
        const purchase = db.prepare(`INSERT INTO direct_purchases (tenant_id,mill_id,purchase_number,supplier_id,purchase_date,currency,subtotal,tax_amount,total_amount,status,terms_master_code,terms_text,attachments_json,idempotency_key,created_at) VALUES (?,?,?,?,?,?,?,?,?,'POSTED',?,?,?,?,?)`).run(tenantId, millId, purchaseNumber, supplierId, body.purchaseDate, body.currency, subtotal, taxAmount, totalAmount, body.termsMasterCode || '', body.termsText || '', JSON.stringify(Array.isArray(body.attachments) ? body.attachments : []), key, stamp);
        const invoice = db.prepare(`INSERT INTO purchase_invoices (tenant_id,mill_id,invoice_number,supplier_id,source_type,source_id,invoice_date,currency,subtotal,tax_amount,total_amount,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'DRAFT',?)`).run(tenantId, millId, invoiceNumber, supplierId, 'DIRECT_PURCHASE', purchase.lastInsertRowid, body.purchaseDate, body.currency, subtotal, taxAmount, totalAmount, stamp);
        const lineInsert = db.prepare('INSERT INTO direct_purchase_lines (purchase_id,item_id,description,quantity,uom,unit_price,line_total) VALUES (?,?,?,?,?,?,?)');
        const invoiceLineInsert = db.prepare('INSERT INTO purchase_invoice_lines (invoice_id,item_id,description,quantity,uom,unit_price,line_total) VALUES (?,?,?,?,?,?,?)');
        normalized.forEach((line, index) => { const item = items[index]; const total = Number((line.quantity * line.unitPrice).toFixed(2)); lineInsert.run(purchase.lastInsertRowid, line.itemId, item.name, line.quantity, item.unit, line.unitPrice, total); invoiceLineInsert.run(invoice.lastInsertRowid, line.itemId, item.name, line.quantity, item.unit, line.unitPrice, total); });
        db.prepare('UPDATE direct_purchases SET invoice_id = ? WHERE id = ?').run(invoice.lastInsertRowid, purchase.lastInsertRowid);
        db.prepare('INSERT INTO purchase_audit_events (tenant_id,mill_id,actor_id,action,entity_type,entity_id,details_json,created_at) VALUES (?,?,?,?,?,?,?,?)').run(tenantId, millId, actorId, 'DIRECT_PURCHASE_POSTED', 'DIRECT_PURCHASE', String(purchase.lastInsertRowid), JSON.stringify({ purchaseNumber, invoiceNumber, totalAmount }), stamp);
        return db.prepare(`${invoiceQuery} AND i.id = ?`).get(tenantId, millId, invoice.lastInsertRowid);
      })();
      res.status(201).json(result);
    } catch (error) {
      res.status(error.code === 'ITEM_NOT_FOUND' ? 400 : 409).json({ code: error.code || 'DIRECT_PURCHASE_CREATE_FAILED', message: error.message || 'Unable to create direct purchase.' });
    }
  });
}
