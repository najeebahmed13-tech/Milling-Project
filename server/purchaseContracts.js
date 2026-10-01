export function registerPurchaseContractsModule(app, db) {
  db.exec(`CREATE TABLE IF NOT EXISTS purchase_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_code TEXT NOT NULL UNIQUE,
    supplier TEXT NOT NULL,
    title TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    vendor_representative TEXT,
    item TEXT NOT NULL,
    item_quantity REAL NOT NULL,
    item_quality TEXT,
    quality_tolerance TEXT,
    delivery_terms TEXT,
    payment_terms_oer TEXT,
    payment_frequency TEXT,
    certifications TEXT,
    terms TEXT,
    contract_value REAL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL
  )`);
  try { db.exec("ALTER TABLE purchase_contracts ADD COLUMN items_json TEXT NOT NULL DEFAULT '[]'"); } catch {}
  const contractCount = db.prepare('SELECT COUNT(*) AS count FROM purchase_contracts').get().count;
  if (!contractCount) {
    db.prepare(`INSERT INTO purchase_contracts (contract_code,supplier,title,valid_from,valid_until,vendor_representative,item,item_quantity,item_quality,quality_tolerance,delivery_terms,payment_terms_oer,payment_frequency,certifications,terms,contract_value,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      'PC-FFB-2026-001', 'Sawit Makmur Plantation Koperasi', 'Fresh Fruit Bunch Supply Agreement', '2026-10-01', '2027-03-31', 'Haji Ahmad Dahlan', 'Fresh Fruit Bunch (FFB)', 12000,
      'Mature fruit bunches; loose fruit acceptable; no foreign matter', 'FFA maximum 5%; dirt and stones maximum 2%; moisture as received', 'Delivered to Mill (DAP)', 'OER-linked settlement at 20%', 'Monthly', 'RSPO MB',
      'Supplier shall deliver FFB according to the agreed schedule. Final acceptance is based on mill weighing, grading and quality procedures. Payment is calculated using the approved OER basis.', 4200000, 'ACTIVE', new Date().toISOString(),
    );
  }
  app.get('/api/purchase-contracts', (_req, res) => res.json(db.prepare('SELECT * FROM purchase_contracts ORDER BY id DESC').all()));
  app.post('/api/purchase-contracts', (req, res) => {
    const body = req.body;
    if (!body.contractCode || !body.supplier || !body.title || !body.validFrom || !body.validUntil || !body.item || !Number.isFinite(Number(body.itemQuantity)) || Number(body.itemQuantity) <= 0) return res.status(400).json({ message: 'Contract code, supplier, title, period, item and positive item quantity are required.' });
    try {
      const items = Array.isArray(body.items) && body.items.length ? body.items : [{ item: body.item, quantity: body.itemQuantity }];
      const info = db.prepare(`INSERT INTO purchase_contracts (contract_code,supplier,title,valid_from,valid_until,vendor_representative,item,item_quantity,items_json,item_quality,quality_tolerance,delivery_terms,payment_terms_oer,payment_frequency,certifications,terms,contract_value,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(body.contractCode.trim(), body.supplier, body.title.trim(), body.validFrom, body.validUntil, body.vendorRepresentative || '', items[0].item, Number(items[0].quantity), JSON.stringify(items), body.itemQuality || '', body.qualityTolerance || '', body.deliveryTerms || '', body.paymentTermsOer || '', body.paymentFrequency || '', body.certifications || '', body.terms || '', body.contractValue === '' ? null : Number(body.contractValue), body.status || 'ACTIVE', new Date().toISOString());
      res.status(201).json(db.prepare('SELECT * FROM purchase_contracts WHERE id=?').get(info.lastInsertRowid));
    } catch (error) { res.status(400).json({ message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Contract code must be unique.' : 'Unable to save purchase contract.' }); }
  });
}
