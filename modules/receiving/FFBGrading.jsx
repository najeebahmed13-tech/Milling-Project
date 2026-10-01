import React, { useEffect, useMemo, useState } from "react";
import "./receiving.css";

export function FFBGradingPage({ rows, onSaved, focusId }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const pending = useMemo(() => rows.filter((row) => row.state === "FIRST_WEIGHT_RECORDED"), [rows]);
  const filtered = useMemo(() => rows.filter((row) => `${row.ticket_no} ${row.vehicle_no} ${row.supplier} ${row.delivery_order}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  useEffect(() => { if (focusId) { const row = rows.find((item) => String(item.id) === String(focusId)); if (row) setSelected(row); } }, [focusId, rows]);
  const statusLabel = (state) => ({ FIRST_WEIGHT_RECORDED: "Grading Pending", GRADING_COMPLETED: "Graded / Exit Pending", READY_TO_POST: "Graded / Ready to Finalize" }[state] || state);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/ffb-receiving/${selected.id}/grading`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ripeness: form.get("ripeness"), ramp: form.get("ramp"), graderName: form.get("graderName"), gradingResult: form.get("gradingResult") }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.message || "Unable to save grading."); return; }
    setSelected(null);
    onSaved();
  };
  return <main className="receiving-page">
    <div className="receiving-breadcrumb"><span>Stock</span><b>›</b><strong>FFB Grading</strong></div>
    <div className="receiving-heading"><div><h1>FFB Grading</h1><p>Grade weighed FFB deliveries before vehicle exit and final receiving.</p></div><div className="grading-counter"><strong>{pending.length}</strong><span>Awaiting grading</span></div></div>
    <div className="receiving-banner"><strong>Workflow:</strong> Complete first weighing in FFB Receiving, then select the ticket here to record ripeness, ramp, grader, and grading result.</div>
    <article className="panel receiving-panel"><div className="receiving-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, vehicle, supplier or delivery order..." /><span>{filtered.length} total grading records · {pending.length} awaiting action</span></div><div className="table-wrap"><table className="receiving-table"><thead><tr><th>Weighbridge Ticket</th><th>Entry Date / Time</th><th>Vehicle</th><th>Supplier</th><th>Delivery Order</th><th>Gross (MT)</th><th>Grading</th><th>Ramp</th><th>Action</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td className="ticket-cell">{row.ticket_no}</td><td>{new Date(row.entry_at).toLocaleString()}</td><td>{row.vehicle_no}</td><td>{row.supplier}</td><td>{row.delivery_order || "—"}</td><td>{Number(row.gross_weight).toFixed(3)}</td><td><span className={`receipt-state ${row.state.toLowerCase()}`}>{statusLabel(row.state)}</span>{row.ripeness && <small className="grading-result">{row.ripeness} · {row.grading_result}</small>}</td><td>{row.ramp || "—"}</td><td>{row.state === "FIRST_WEIGHT_RECORDED" ? <button className="item-edit" onClick={() => { setError(""); setSelected(row); }}>Open Grading Form</button> : <span className="grading-complete">Recorded</span>}</td></tr>)}{!filtered.length && <tr><td colSpan="9" className="items-empty">No FFB grading records found.</td></tr>}</tbody></table></div></article>
    {selected && <div className="items-modal-backdrop"><form className="receiving-form" onSubmit={submit}><div className="items-form-heading"><div><span className="eyebrow">STOCK / FFB GRADING</span><h2>Grade FFB Delivery</h2><p>{selected.ticket_no} · {selected.vehicle_no} · {selected.supplier}</p></div><button type="button" className="icon-button" onClick={() => setSelected(null)}>×</button></div>{error && <div className="form-error">{error}</div>}<div className="contract-grid two"><div className="weight-preview"><div><span>Ticket</span><strong>{selected.ticket_no}</strong></div><div><span>Gross Weight</span><strong>{Number(selected.gross_weight).toFixed(3)} MT</strong></div></div><label className="contract-field">Ripeness / Grading Input<em>*</em><input required name="ripeness" placeholder="e.g. Ripe 82%, Unripe 8%" /></label><label className="contract-field">Ramp Number<em>*</em><select required name="ramp"><option value="">Select configured ramp...</option><option>FFB Ramp</option><option>Loading Ramp</option></select></label><label className="contract-field">Grader Name<em>*</em><select required name="graderName"><option>Sean Shapiro</option></select></label><label className="contract-field">Grading Result<em>*</em><select required name="gradingResult"><option>Pending Vehicle Exit</option><option>Accepted</option><option>Partially Accepted</option><option>Rejected</option></select></label></div><div className="blocked-help">After grading, continue to FFB Receiving to record the vehicle tare / second weighing. Contract allocation and inventory posting remain controlled until the approved business basis is configured.</div><div className="contract-actions"><button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button><button className="btn btn-primary">Complete Grading</button></div></form></div>}
  </main>;
}
