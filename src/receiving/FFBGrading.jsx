import React, { useEffect, useMemo, useState } from "react";
import "./receiving.css";
import { ChevronDown, ClipboardCheck, Eye, Scale } from "lucide-react";

const parameterFields = [
  ["unripe", "Unripe", false],
  ["overripe", "Overripe", false],
  ["ripe", "Ripe", true],
  ["underRipe", "Under-ripe", false],
  ["rotten", "Rotten", false],
  ["emptyBunch", "Empty Bunch", false],
  ["dirtyContaminated", "Dirty / Contaminated", false],
  ["old", "Old", false],
  ["dura", "Dura", false],
  ["longStalk", "Long Stalk", false],
  ["wetWeight", "Wet Weight / Wet Load", false],
];
const parseParameters = (value) => {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
};
const parseAttachments = (value) => { try { return JSON.parse(value || "[]"); } catch { return []; } };
const valueOrDash = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB").replaceAll("/", "-");
};
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : `${formatDate(value)} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;
};
const readAttachments = async (files) => Promise.all(files.map((file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result }); reader.onerror = reject; reader.readAsDataURL(file); })));

function DetailValue({ label, value, emphasis = false }) {
  return (
    <div className={`grading-detail-value${emphasis ? " emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{valueOrDash(value)}</strong>
    </div>
  );
}

function GradingDetails({ record, statusLabel, onClose }) {
  const parameters = parseParameters(record.grading_parameters_json);
  const attachments = parseAttachments(record.attachments_json);
  return (
    <div className="grading-detail-view">
      <section className="grading-detail-section">
        <div className="grading-detail-section-heading">
          <div>
            <h3>Grading summary</h3>
            <p>Quality grading recorded against this weighbridge ticket.</p>
          </div>
          <span
            className={`receipt-state ${(record.state || "").toLowerCase()}`}
          >
            {statusLabel(record.state)}
          </span>
        </div>
        <div className="grading-detail-grid">
          <DetailValue
            label="Grading code"
            value={record.grading_id}
            emphasis
          />
          <DetailValue label="Grading result" value={record.ripeness} />
          <DetailValue
            label="Added by"
            value={record.grader_name || record.operator_name}
          />
          <DetailValue
            label="Added date"
            value={formatDate(record.created_at || record.entry_at)}
          />
        </div>
      </section>
      <section className="grading-detail-section grading-weight-details">
        <div className="grading-detail-section-heading"><div><h3>Weight Details</h3><p>Certified scale readings and net yield balance.</p></div><span className="muted">Unit: Metric Tonnes (MT)</span></div>
        <div className="grading-detail-weight-cards"><div><span>Gross Weight</span><strong>{Number(record.gross_weight || 0).toFixed(3)}</strong><small>Inbound Recorded</small></div><div><span>Tare Weight</span><strong className={!record.tare_weight ? "pending" : ""}>{record.tare_weight ? Number(record.tare_weight).toFixed(3) : "Pending"}</strong><small>{record.tare_weight ? "Second weighing recorded" : "Pending exit"}</small></div><div className={!record.net_weight ? "pending-card" : ""}><span>Net Weight</span><strong>{record.net_weight ? Number(record.net_weight).toFixed(3) : "Pending"}</strong><small>{record.net_weight ? "Certified net weight" : "Awaiting empty scale"}</small></div></div>
      </section>
      <section className="grading-detail-section">
        <div className="grading-detail-section-heading"><div><h3>Weighbridge &amp; Supplier Details</h3></div></div>
        <div className="grading-detail-grid"><DetailValue label="Weighbridge Ticket No." value={record.ticket_no} /><DetailValue label="Lorry No. / License Plate" value={record.vehicle_no} /><DetailValue label="Supplier" value={record.supplier} /><DetailValue label="Driver Name" value={record.driver_name} /><DetailValue label="Declared Quantity" value={record.supplier_declared_qty ? `${Number(record.supplier_declared_qty).toFixed(3)} MT` : "—"} /></div>
      </section>
      <section className="grading-detail-section">
        <div className="grading-detail-section-heading">
          <div>
            <h3>Grading parameters</h3>
            <p>Recorded quality observations and quantities.</p>
          </div>
        </div>
        <div className="grading-detail-parameter-groups">
          <section className="grading-detail-parameter-group"><h4><span className="grading-group-dot received" />FFB Received (%)</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => !["unripe", "overripe", "wetWeight"].includes(key)).map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? "—" : `${Number(parameters[key]).toFixed(3)} %`} emphasis={key === "ripe"} />)}</div></section>
          <section className="grading-detail-parameter-group"><h4><span className="grading-group-dot returned" />FFB Returned (Bunches)</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => ["unripe", "overripe"].includes(key)).map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? "—" : `${Number(parameters[key]).toFixed(3)} Bunches`} />)}</div></section>
          <section className="grading-detail-parameter-group grading-single-parameter-group"><h4><span className="grading-group-dot wet" />Wet Weight / Wet Load</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => key === "wetWeight").map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? "—" : `${Number(parameters[key]).toFixed(3)}`} />)}</div></section>
        </div>
      </section>
      <section className="grading-detail-section"><h3>Remarks &amp; Attachments</h3><p>{record.remarks || "No grading remarks recorded."}</p>{attachments.length ? <div className="grading-attachment-list">{attachments.map((file, index) => <a key={`${file.name}-${index}`} href={file.data} target="_blank" rel="noreferrer" download={file.name}>{file.name}</a>)}</div> : <p className="muted">No grading attachments.</p>}</section>
      <div className="grading-detail-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function FfbGradingGrid({ rows, statusLabel, onSelect, openActions, setOpenActions }) {
  return <div className="ffb-grading-grid">{rows.map((row) => <article className="ffb-grading-card" key={row.id} onClick={() => onSelect(row)}>
    <div className="ffb-card-header"><div><span>Grading Code</span><button type="button" className="ffb-receipt-link" onClick={(event) => { event.stopPropagation(); onSelect(row); }}>{row.grading_id || "Pending"}</button></div><span className={`receipt-state ${(row.state || "").toLowerCase()}`}>{statusLabel(row.state)}</span></div>
    <div className="ffb-ticket-panel"><div><span>Weighbridge Ticket</span><strong>{row.ticket_no}</strong></div><Scale size={18} /></div>
    <div className="ffb-grading-summary"><div><span>Supplier</span><strong>{row.supplier || "—"}</strong></div><div><span>Grading Result</span><strong>{row.ripeness || "Pending grading"}</strong></div></div>
    <div className="ffb-vehicle-strip"><div><span>Vehicle Plate</span><strong>{row.vehicle_no || "—"}</strong></div><div><span>Driver</span><strong>{row.driver_name || "—"}</strong></div></div>
    <div className="ffb-card-divider" /><div className="ffb-grading-weight-grid"><div><span>Gross (MT)</span><strong>{Number(row.gross_weight || 0).toFixed(3)}</strong></div><div><span>Tare (MT)</span><strong>{row.tare_weight ? Number(row.tare_weight).toFixed(3) : "Pending"}</strong></div><div><span>Net (MT)</span><strong>{row.net_weight ? Number(row.net_weight).toFixed(3) : "Pending"}</strong></div></div>
    <div className="ffb-grading-meta"><span>Added by: {row.grader_name || row.operator_name || "—"}</span><span>{formatDate(row.created_at || row.entry_at)}</span></div>
    <div className="ffb-grading-card-footer"><div className="ffb-actions-menu"><button type="button" className="ffb-actions-trigger" onClick={(event) => { event.stopPropagation(); setOpenActions(openActions === row.id ? null : row.id); }}>Actions <ChevronDown size={15} /></button>{openActions === row.id && <div className="ffb-actions-dropdown" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => { setOpenActions(null); onSelect(row); }}><Eye size={15} /> View details</button>{row.state === "FIRST_WEIGHT_RECORDED" && <button type="button" onClick={() => { setOpenActions(null); onSelect(row); }}><ClipboardCheck size={15} /> Open grading</button>}</div>}</div></div>
  </article>)}</div>;
}

export function FFBGradingPage({ rows, onSaved, focusId }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [openActions, setOpenActions] = useState(null);
  const [error, setError] = useState("");
  const pending = useMemo(
    () => rows.filter((row) => row.state === "FIRST_WEIGHT_RECORDED"),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.ticket_no} ${row.vehicle_no} ${row.supplier} ${row.delivery_order}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [rows, search],
  );
  const isEditable = selected?.state === "FIRST_WEIGHT_RECORDED";
  const statusLabel = (state) =>
    ({
      FIRST_WEIGHT_RECORDED: "First Weighing",
      GRADING_COMPLETED: "Grading",
      READY_TO_POST: "Completed",
      POSTED: "Completed",
      COMPLETED: "Completed",
    })[state] || state;
  useEffect(() => {
    if (focusId) {
      const row = rows.find((item) => String(item.id) === String(focusId));
      if (row) setSelected(row);
    }
  }, [focusId, rows]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const attachments = await readAttachments(Array.from(event.currentTarget.querySelector('input[type="file"]')?.files || []));
    const gradingParameters = Object.fromEntries(
      parameterFields.map(([key]) => [key, form.get(key)]),
    );
    const response = await fetch(`/api/ffb-receiving/${selected.id}/grading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gradingParameters,
        // Compatibility fields for the older production API contract. The
        // current UI remains parameter-driven; these values are derived from
        // the submitted form and are not additional user inputs.
        ripeness: `${form.get("ripe") || ""}% ripe`,
        ramp: "FFB Ramp",
        graderName: "Sean Shapiro",
        gradingResult: "Pending Vehicle Exit",
        remarks: form.get("gradingRemarks") || "",
        attachments,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message || "Unable to save grading.");
      return;
    }
    setSelected(null);
    onSaved();
  };

  return (
    <main className="receiving-page ffb-grading-page">
      <div className="receiving-breadcrumb">
        <span>Stock</span>
        <b>›</b>
        <strong>FFB Grading</strong>
      </div>
      <div className="receiving-heading">
        <div>
          <h1>FFB Grading</h1>
          <p>
            Record configurable FFB grading parameters against the weighbridge
            ticket.
          </p>
        </div>
        <div className="grading-counter">
          <strong>{pending.length}</strong>
          <span>Awaiting grading</span>
        </div>
      </div>
      <article className="panel receiving-panel">
        <div className="receiving-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search grading code, ticket, lorry or supplier..."
          />
          <span>
            {filtered.length} records · {pending.length} awaiting action
          </span>
        </div>
        <div className="table-wrap">
          <table className="receiving-table">
            <thead>
              <tr>
                <th>Grading Code</th>
                <th>Weighbridge Ticket</th>
                <th>Lorry No.</th>
                <th>Supplier</th>
                <th>Supplier Category</th>
                <th>Net Weight</th>
                <th>Grading</th>
                <th>Added By</th>
                <th>Added Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    setError("");
                    setSelected(row);
                  }}
                >
                  <td className="ticket-cell">{row.grading_id || "Pending"}</td>
                  <td>{row.ticket_no}</td>
                  <td>{row.vehicle_no}</td>
                  <td>{row.supplier}</td>
                  <td>{row.supplier_category || "—"}</td>
                  <td>
                    {row.net_weight
                      ? `${Number(row.net_weight).toFixed(3)} MT`
                      : "Pending"}
                  </td>
                  <td>
                    <span
                      className={`receipt-state ${(row.state || "").toLowerCase()}`}
                    >
                      {statusLabel(row.state)}
                    </span>
                    {row.ripeness && (
                      <small className="grading-result">{row.ripeness}</small>
                    )}
                  </td>
                  <td>{row.grader_name || row.operator_name || "—"}</td>
                  <td>{formatDate(row.created_at || row.entry_at)}</td>
                  <td>
                    {row.state === "FIRST_WEIGHT_RECORDED" ? (
                      <button
                        className="item-edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          setError("");
                          setSelected(row);
                        }}
                      >
                        Open grading
                      </button>
                    ) : (
                      <button
                        className="table-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(row);
                        }}
                      >
                        View details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="10" className="items-empty">
                    No FFB grading records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
      <FfbGradingGrid rows={filtered} statusLabel={statusLabel} onSelect={(row) => { setOpenActions(null); setError(""); setSelected(row); }} openActions={openActions} setOpenActions={setOpenActions} />
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside
            className="drawer grading-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <div className="eyebrow">STOCK / FFB RECEIVING · <b>GRADING</b></div>
                <h2>{isEditable ? "FFB Grading Form" : selected.grading_id || selected.ticket_no}</h2>
                <p className="drawer-subtitle">
                  {isEditable ? `Ref: ${selected.receipt_code || "—"} · ${selected.ticket_no}` : formatDateTime(selected.entry_at)}
                </p>
              </div>
              {isEditable && <span className="grading-form-header-status">First Weighing</span>}
              <button
                type="button"
                className="icon-button"
                aria-label="Close grading details"
                title="Close"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            {error && <div className="form-error">{error}</div>}
            {isEditable ? (
              <form onSubmit={submit}>
                <section className="grading-form-overview">
                  <div className="grading-form-overview-title">
                    <h3>▧ &nbsp;Vehicle &amp; Delivery Details</h3>
                  </div>
                  <div className="grading-form-overview-grid">
                    <DetailValue label="Weighbridge Ticket" value={selected.ticket_no} emphasis />
                    <DetailValue label="Entry Date & Time" value={formatDateTime(selected.entry_at)} />
                    <DetailValue label="Vehicle Plate No. & Driver" value={`${selected.vehicle_no || "—"}  ·  ${selected.driver_name || "—"}`} />
                    <DetailValue label="Supplier" value={selected.supplier} />
                  </div>
                  <div className="grading-form-weight-cards">
                    <div><span>Gross Weight</span><strong>{Number(selected.gross_weight || 0).toFixed(3)} <small>MT</small></strong></div>
                    <div><span>Tare Weight</span><strong className="pending">{selected.tare_weight ? `${Number(selected.tare_weight).toFixed(3)} MT` : "Pending"}</strong></div>
                    <div><span>Net Weight</span><strong className="pending">{selected.net_weight ? `${Number(selected.net_weight).toFixed(3)} MT` : "Pending"}</strong></div>
                  </div>
                </section>
                <section className="drawer-section grading-parameters">
                  <div className="drawer-section-heading">
                    <h3>Grading parameters</h3>
                    <span>Decimal quantity</span>
                  </div>
                  <div className="grading-parameter-groups">
                    <section className="grading-parameter-group">
                      <h4><span className="grading-group-dot received" />FFB Received (%)</h4>
                      <div className="grading-parameter-cards">
                        {parameterFields.filter(([key]) => !["unripe", "overripe", "wetWeight"].includes(key)).map(([key, label, required]) => (
                          <label className="grading-parameter-card" key={key}>
                            <span>{label}{required && <em>*</em>}</span>
                            <span className="grading-input-wrap"><input name={key} type="number" min="0" step="0.001" required={required} placeholder="0.000" /><small>%</small></span>
                          </label>
                        ))}
                      </div>
                    </section>
                    <section className="grading-parameter-group grading-single-parameter-group">
                      <h4><span className="grading-group-dot wet" />Wet Weight / Wet Load</h4>
                      <div className="grading-parameter-cards">
                        {parameterFields.filter(([key]) => key === "wetWeight").map(([key, label, required]) => (
                          <label className="grading-parameter-card" key={key}>
                            <span>{label}{required && <em>*</em>}</span>
                            <span className="grading-input-wrap"><input name={key} type="number" min="0" step="0.001" required={required} placeholder="0.000" /><small>Value</small></span>
                          </label>
                        ))}
                      </div>
                    </section>
                    <section className="grading-parameter-group">
                      <h4><span className="grading-group-dot returned" />FFB Returned (Bunches)</h4>
                      <div className="grading-parameter-cards">
                        {parameterFields.filter(([key]) => ["unripe", "overripe"].includes(key)).map(([key, label, required]) => (
                          <label className="grading-parameter-card" key={key}>
                            <span>{label}{required && <em>*</em>}</span>
                            <span className="grading-input-wrap"><input name={key} type="number" min="0" step="0.001" required={required} placeholder="0.000" /><small>Bunches</small></span>
                          </label>
                        ))}
                      </div>
                    </section>
                  </div>
                </section>
                <section className="grading-form-notes">
                  <label>Remarks <small>(Optional)</small><textarea name="gradingRemarks" rows="3" placeholder="Add grading observations or exceptions..." /></label>
                  <label>Attachment <small>(Optional · multiple image or PDF files)</small><input type="file" multiple accept="image/*,.pdf" /></label>
                </section>
                <div className="drawer-action-strip grading-drawer-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelected(null)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary">Save grading</button>
                </div>
              </form>
            ) : (
              <GradingDetails
                record={selected}
                statusLabel={statusLabel}
                onClose={() => setSelected(null)}
              />
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
