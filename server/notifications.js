import crypto from 'node:crypto';

const escapeXml = (value) => String(value ?? '').replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]));
const qrSvg = (reference) => `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="white"/><rect x="12" y="12" width="48" height="48" fill="none" stroke="black" stroke-width="8"/><rect x="120" y="12" width="48" height="48" fill="none" stroke="black" stroke-width="8"/><rect x="12" y="120" width="48" height="48" fill="none" stroke="black" stroke-width="8"/><path d="M76 16h12v12H76zM96 16h12v20H96zM72 48h20v12H72zM76 76h12v12H76zM96 72h28v12H96zM132 72h16v12h-16zM72 96h16v12H72zM100 92h12v28h-12zM120 96h12v12h-12zM140 92h20v12h-20zM72 124h12v32H72zM92 124h24v12H92zM124 124h12v32h-12zM144 120h20v12h-20zM92 148h20v12H92zM144 148h20v12h-20z" fill="black"/><text x="90" y="176" text-anchor="middle" font-family="Arial" font-size="7">${escapeXml(reference)}</text></svg>`;

export function registerNotificationModule(app, db) {
  db.exec(`CREATE TABLE IF NOT EXISTS email_notifications (id TEXT PRIMARY KEY, recipient TEXT NOT NULL, subject TEXT NOT NULL, reference TEXT NOT NULL, payload_json TEXT NOT NULL, qr_code TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)`);
  app.post('/api/notifications/transporter-delivery', (req, res) => {
    const body = req.body || {};
    const required = ['recipient', 'deliveryReference', 'loadingInstructionNo', 'reportingDateTime', 'millLocationGate', 'product', 'vehicleType'];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) return res.status(400).json({ error: `Missing notification fields: ${missing.join(', ')}` });
    const id = crypto.randomUUID();
    const qrCode = `data:image/svg+xml,${encodeURIComponent(qrSvg(body.deliveryReference))}`;
    const subject = `Loading Plan ${body.loadingInstructionNo} - ${body.deliveryReference}`;
    const payload = { deliveryReference: body.deliveryReference, loadingInstructionNo: body.loadingInstructionNo, reportingDateTime: body.reportingDateTime, millLocationGate: body.millLocationGate, product: body.product, vehicleType: body.vehicleType, quantity: body.quantity || null };
    db.prepare('INSERT INTO email_notifications (id, recipient, subject, reference, payload_json, qr_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, body.recipient, subject, body.deliveryReference, JSON.stringify(payload), qrCode, 'QUEUED', new Date().toISOString());
    res.status(201).json({ id, recipient: body.recipient, subject, status: 'QUEUED', qrCode, payload });
  });
  app.get('/api/notifications', (_req, res) => {
    const rows = db.prepare('SELECT * FROM email_notifications ORDER BY created_at DESC').all().map((row) => ({ ...row, payload: JSON.parse(row.payload_json) }));
    res.json(rows);
  });
}
