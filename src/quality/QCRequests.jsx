import React, { useMemo, useState } from "react";
import "../masters/masters.css";

const STORAGE_KEY = "rockeye.quality.qcRequests";
const seed = [
  { id: "QC-20261008-001", reference: "PR-20261008-014", product: "Crude Palm Oil (CPO)", samplePoint: "CPO Tank 02", requestedBy: "Lim Wei Jian", requestedDate: "08-10-2026", status: "Pending" },
  { id: "QC-20261007-009", reference: "PR-20261007-022", product: "Palm Kernel", samplePoint: "Kernel Silo", requestedBy: "Nur Aisyah Binti Rahman", requestedDate: "07-10-2026", status: "In Progress" },
  { id: "QC-20261006-006", reference: "PR-20261006-018", product: "Crude Palm Oil (CPO)", samplePoint: "CPO Tank 01", requestedBy: "Farid Hakim bin Ismail", requestedDate: "06-10-2026", status: "Released" },
];
const readRequests = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) && stored.length ? stored : seed;
  } catch {
    return seed;
  }
};

function QCRequestDetails({ request, onBack }) {
  const detail = (label, value) => <div><span>{label}</span><strong>{value || "—"}</strong></div>;
  return <main className="masters-page"><div className="masters-breadcrumb"><button className="link-button" onClick={onBack}>QC Request</button><b>›</b><strong>Details</strong></div><div className="masters-heading"><div><span className="eyebrow">QUALITY / QC REQUEST</span><h1>{request.id}</h1><p>{request.requestTitle || "Quality Inspection"} · {request.product}</p></div><button className="btn btn-secondary" onClick={onBack}>Back to Listing</button></div><div className="qc-detail-layout"><section className="panel qc-detail-card"><h2>Request Details</h2><div className="qc-detail-grid">{detail("Request Type", request.requestTitle || "Quality Inspection")}{detail("Reference", request.reference)}{detail("Product", request.product)}{detail("Sample Point", request.samplePoint)}{detail("Requested By", request.requestedBy)}{detail("Requested Date", request.requestedDate)}</div></section><section className="panel qc-detail-card"><div className="qc-detail-heading"><div><h2>Vehicle Readiness</h2><p>Operational status received from Logistics after first weighment.</p></div><span className="customer-status">{request.vehicleStatus || request.status}</span></div><div className="qc-detail-grid">{detail("Readiness Status", request.vehicleStatus || "Awaiting first weighment")}{detail("First Weighment", request.firstWeighmentAt ? new Date(request.firstWeighmentAt).toLocaleString("en-GB") : "Pending")}{detail("Weighbridge Ticket", request.weighbridgeTicket)}{detail("Tare Weight", request.tareWeight ? `${Number(request.tareWeight).toFixed(3)} MT` : "Pending")}{detail("Transporter", request.transporter)}{detail("Vehicle / Driver", `${request.vehicle || "—"} / ${request.driver || "—"}`)}{detail("Loading Bay", request.loadingBay)}{detail("Storage Tank", request.sourceStorage)}</div></section></div></main>;
}

export function QCRequestsPage() {
  const [rows, setRows] = useState(readRequests);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))), [rows, search]);
  const save = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const next = [{ id: `QC-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-3)}`, reference: data.reference, product: data.product, samplePoint: data.samplePoint, requestedBy: "Sean Shapiro", requestedDate: new Date().toLocaleDateString("en-GB").replaceAll("/", "-"), status: "Pending" }, ...rows];
    setRows(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setShowForm(false);
  };
  if (selected) return <QCRequestDetails request={selected} onBack={() => setSelected(null)} />;
  return <main className="masters-page"><div className="masters-breadcrumb"><span>Quality</span><b>›</b><strong>QC Request</strong></div><div className="masters-heading"><div><h1>QC Request</h1><p>Request and track quality checks after production and storage movements.</p></div><button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ New QC Request</button></div><section className="panel masters-panel"><div className="masters-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, reference, product or sample point..." /><span>{filtered.length} requests</span></div><div className="table-wrap"><table><thead><tr><th>QC Request</th><th>Request Type</th><th>Reference</th><th>Product</th><th>Sample Point</th><th>Requested By</th><th>Date</th><th>Status</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} onClick={() => setSelected(row)}><td><strong>{row.id}</strong></td><td>{row.requestTitle || "Quality Inspection"}</td><td>{row.reference}</td><td>{row.product}</td><td>{row.samplePoint}</td><td>{row.requestedBy}</td><td>{row.requestedDate}</td><td><span className="customer-status">{row.status}</span></td></tr>)}{!filtered.length && <tr><td colSpan="8" className="master-empty">No QC requests found.</td></tr>}</tbody></table></div></section>{showForm && <div className="master-modal-backdrop"><form className="master-form" onSubmit={save}><div className="master-form-head"><div><span>QUALITY / QC REQUEST</span><h2>New QC Request</h2><p>Request a quality check against a production or storage reference.</p></div><button type="button" onClick={() => setShowForm(false)}>×</button></div><div className="master-form-grid"><label>Production / Dispatch Reference<em>*</em><input name="reference" required placeholder="e.g. PR-20261008-014" /></label><label>Product<em>*</em><select name="product" required><option value="">Select product...</option><option>Crude Palm Oil (CPO)</option><option>Palm Kernel</option></select></label><label>Sample Point<em>*</em><input name="samplePoint" required placeholder="Tank, silo or production point" /></label><label>Requested Date<em>*</em><input name="requestedDate" type="date" required /></label></div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary">Save QC Request</button></div></form></div>}</main>;
}
