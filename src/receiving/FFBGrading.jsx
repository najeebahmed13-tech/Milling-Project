import React, { useEffect, useMemo, useState } from "react";
import "./receiving.css";
import "./ffb-grading-form.css";
import { ClipboardCheck, Eye, Scale, X } from "lucide-react";
import AttachmentList from "../shared/AttachmentList.jsx";
import { receiptCode } from "../shared/receiptCode.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { FfbGradingFormContent, FfbGradingFormDrawer, parameterFields } from "./FfbGradingFormContent.jsx";
import { SecondWeighingFormDrawer } from "./SecondWeighingFormDrawer.jsx";
import { BreadcrumbSeparator, DrawerCloseButton, VehiclePlateDisplay } from "../design-system/components.jsx";
import { StatusBadge, badgeToneForStatus } from "../design-system/badges.jsx";
import { ActionMenu, DetailSection } from "../design-system/index.js";
import { DisplayValue } from "../design-system/form-fields.jsx";
import { EMPTY_VALUE, TEXT_SEPARATOR, formatNumber, formatVehiclePlate, normalizeDisplayText } from "../shared/formatters.js";
const parseParameters = (value) => {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
};
const parseAttachments = (value) => { try { return JSON.parse(value || "[]"); } catch { return []; } };
const valueOrDash = (value) =>
  value === null || value === undefined || value === "" ? EMPTY_VALUE : value;
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : date.toLocaleDateString("en-GB").replaceAll("/", "-");
};
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : `${formatDate(value)} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;
};
const readAttachments = async (files) => Promise.all(files.map((file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result }); reader.onerror = reject; reader.readAsDataURL(file); })));

function DetailValue({ label, value, valueComponent, emphasis = false }) {
  return (
    <div className={`grading-detail-value${emphasis ? " emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{valueComponent || <DisplayValue value={value} fallback={EMPTY_VALUE} />}</strong>
    </div>
  );
}

function LegacyGradingDetails({ record, statusLabel, onClose }) {
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
          <StatusBadge tone={badgeToneForStatus(statusLabel(record.state))}>{statusLabel(record.state)}</StatusBadge>
        </div>
        <div className="grading-detail-grid">
          <DetailValue
            label="Receipt code"
            value={receiptCode(record)}
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
      <section className="grading-detail-section">
        <div className="grading-detail-section-heading">
          <div>
            <h3>Grading parameters</h3>
            <p>Recorded quality observations and quantities.</p>
          </div>
        </div>
        <div className="grading-detail-parameter-groups">
          <section className="grading-detail-parameter-group"><h4><span className="grading-group-dot received" />FFB Received (%)</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => !["unripe", "overripe", "wetWeight"].includes(key)).map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? EMPTY_VALUE : Number(parameters[key]).toFixed(3) + " %"} emphasis={key === "ripe"} />)}</div></section>
          <section className="grading-detail-parameter-group"><h4><span className="grading-group-dot returned" />FFB Returned (Bunches)</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => ["unripe", "overripe"].includes(key)).map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? EMPTY_VALUE : Number(parameters[key]).toFixed(3) + " Bunches"} />)}</div></section>
          <section className="grading-detail-parameter-group grading-single-parameter-group"><h4><span className="grading-group-dot wet" />Wet Weight / Wet Load</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => key === "wetWeight").map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? EMPTY_VALUE : Number(parameters[key]).toFixed(3)} />)}</div></section>
        </div>
      </section>
      <section className="grading-detail-section grading-weight-details">
        <div className="grading-detail-section-heading"><div><h3>Weight Details</h3><p>Certified scale readings and net yield balance.</p></div></div>
        <div className="grading-detail-weight-cards"><div><span>Gross Weight</span><strong>{Number(record.gross_weight || 0).toFixed(3)}</strong><small>Inbound Recorded</small></div><div><span>Tare Weight</span><strong className={!record.tare_weight ? "pending" : ""}>{record.tare_weight ? Number(record.tare_weight).toFixed(3) : "Pending"}</strong><small>{record.tare_weight ? "Second weighing recorded" : "Pending exit"}</small></div><div className={!record.net_weight ? "pending-card" : ""}><span>Net Weight</span><strong>{record.net_weight ? Number(record.net_weight).toFixed(3) : "Pending"}</strong><small>{record.net_weight ? "Certified net weight" : "Awaiting empty scale"}</small></div></div>
      </section>
      <section className="grading-detail-section">
        <div className="grading-detail-section-heading"><div><h3>Weighbridge &amp; Supplier Details</h3></div></div>
        <div className="grading-detail-grid"><DetailValue label="Weighbridge Ticket No." value={record.ticket_no} /><DetailValue label="Vehicle Plate No." valueComponent={<VehiclePlateDisplay value={record.vehicle_no} fallback={EMPTY_VALUE} />} /><DetailValue label="Supplier" value={record.supplier} /><DetailValue label="Driver Name" value={record.driver_name} /><DetailValue label="Declared Quantity" value={record.supplier_declared_qty ? `${Number(record.supplier_declared_qty).toFixed(3)} MT` : EMPTY_VALUE} /></div>
      </section>
      <section className="grading-detail-section">
        <div className="grading-detail-section-heading">
          <div>
            <h3>Grading parameters</h3>
            <p>Recorded quality observations and quantities.</p>
          </div>
        </div>
        <div className="grading-detail-parameter-groups">
          <section className="grading-detail-parameter-group"><h4><span className="grading-group-dot received" />FFB Received (%)</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => !["unripe", "overripe", "wetWeight"].includes(key)).map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? EMPTY_VALUE : `${Number(parameters[key]).toFixed(3)} %`} emphasis={key === "ripe"} />)}</div></section>
          <section className="grading-detail-parameter-group"><h4><span className="grading-group-dot returned" />FFB Returned (Bunches)</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => ["unripe", "overripe"].includes(key)).map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? EMPTY_VALUE : `${Number(parameters[key]).toFixed(3)} Bunches`} />)}</div></section>
          <section className="grading-detail-parameter-group grading-single-parameter-group"><h4><span className="grading-group-dot wet" />Wet Weight / Wet Load</h4><div className="grading-detail-parameter-grid">{parameterFields.filter(([key]) => key === "wetWeight").map(([key, label]) => <DetailValue key={key} label={label} value={parameters[key] === null || parameters[key] === undefined ? EMPTY_VALUE : `${Number(parameters[key]).toFixed(3)}`} />)}</div></section>
        </div>
      </section>
      <section className="grading-detail-section"><h3>Remarks &amp; Attachments</h3><p>{record.remarks || "No grading remarks recorded."}</p><AttachmentList files={attachments} /></section>
      <div className="grading-detail-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function GradingParameterGroups({ parameters }) {
  const renderValue = (key, suffix = "") => (
    parameters[key] === null || parameters[key] === undefined
      ? EMPTY_VALUE
      : `${formatNumber(parameters[key], { minimumFractionDigits: 3, maximumFractionDigits: 3 })}${suffix}`
  );

  return (
    <div className="grading-detail-parameter-groups">
      <section className="grading-detail-parameter-group">
        <h4><span className="grading-group-dot received" />FFB Received (%)</h4>
        <div className="grading-detail-parameter-grid">
          {parameterFields.filter(([key]) => !["unripe", "overripe", "wetWeight"].includes(key)).map(([key, label]) => (
            <DetailValue key={key} label={label} value={renderValue(key, " %")} emphasis={key === "ripe"} />
          ))}
        </div>
      </section>
      <section className="grading-detail-parameter-group">
        <h4><span className="grading-group-dot returned" />FFB Returned (Bunches)</h4>
        <div className="grading-detail-parameter-grid">
          {parameterFields.filter(([key]) => ["unripe", "overripe"].includes(key)).map(([key, label]) => (
            <DetailValue key={key} label={label} value={renderValue(key, " Bunches")} />
          ))}
        </div>
      </section>
      <section className="grading-detail-parameter-group grading-single-parameter-group">
        <h4><span className="grading-group-dot wet" />Wet Weight / Wet Load</h4>
        <div className="grading-detail-parameter-grid">
          <DetailValue label="Wet Weight / Wet Load" value={renderValue("wetWeight")} />
        </div>
      </section>
    </div>
  );
}

function GradingDetails({ record, statusLabel, onClose }) {
  const parameters = parseParameters(record.grading_parameters_json);
  const attachments = parseAttachments(record.attachments_json);
  return (
    <div className="grading-detail-view">
      <DetailSection
        title="Grading Summary"
        description="Quality grading, disposition, and recorded grading parameters."
        status={<StatusBadge tone={badgeToneForStatus(statusLabel(record.state))}>{statusLabel(record.state)}</StatusBadge>}
        className="grading-detail-section grading-summary-section"
      >
        <div className="grading-detail-grid">
          <DetailValue label="Receipt code" value={receiptCode(record)} emphasis />
          <DetailValue label="Grading result" value={record.ripeness} />
        </div>
        <div className="grading-summary-parameters">
          <GradingParameterGroups parameters={parameters} />
        </div>
        <div className="grading-summary-audit">
          <DetailValue label="Added by" value={record.grader_name || record.operator_name} />
          <DetailValue label="Added date" value={formatDate(record.created_at || record.entry_at)} />
        </div>
      </DetailSection>
      <DetailSection
        title="Delivery Details"
        description="Source delivery and weighbridge identification."
        className="grading-detail-section"
      >
        <div className="grading-detail-grid">
          <DetailValue label="Weighbridge Ticket No." value={record.ticket_no} />
          <DetailValue label="Vehicle Plate No." valueComponent={<VehiclePlateDisplay value={record.vehicle_no} fallback={EMPTY_VALUE} />} />
          <DetailValue label="Supplier" value={record.supplier} />
          <DetailValue label="Driver Name" value={record.driver_name} />
          <DetailValue label="Declared Quantity" value={record.supplier_declared_qty ? `${formatNumber(record.supplier_declared_qty, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} MT` : EMPTY_VALUE} />
        </div>
      </DetailSection>
      <DetailSection
        title="Weight Details"
        description="Certified scale readings and net yield balance."
        className="grading-detail-section grading-weight-details"
      >
        <div className="grading-detail-weight-cards">
          <div><span>Gross Weight</span><strong>{formatNumber(record.gross_weight, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</strong><small>Inbound Recorded</small></div>
          <div><span>Tare Weight</span><strong className={!record.tare_weight ? "pending" : ""}>{record.tare_weight ? formatNumber(record.tare_weight, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "Pending"}</strong><small>{record.tare_weight ? "Second weighing recorded" : "Pending exit"}</small></div>
          <div className={!record.net_weight ? "pending-card" : ""}><span>Net Weight</span><strong>{record.net_weight ? formatNumber(record.net_weight, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "Pending"}</strong><small>{record.net_weight ? "Certified net weight" : "Awaiting empty scale"}</small></div>
        </div>
      </DetailSection>
      <DetailSection
        title="Remarks & Attachments"
        description="Supporting notes and uploaded records."
        className="grading-detail-section"
      >
        <p className="grading-detail-remarks">{normalizeDisplayText(record.remarks, "No grading remarks recorded.")}</p>
        <AttachmentList files={attachments} />
      </DetailSection>
      <div className="grading-detail-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const canSecondWeigh = (row) => row?.state === "GRADING_COMPLETED" && !row?.exit_at && !row?.net_weight;

function FfbGradingGrid({ rows, statusLabel, onSelect, onSecondWeighing, openActions, setOpenActions }) {
  return <div className="ffb-grading-grid">{rows.map((row) => <article className="ffb-grading-card" key={row.id} onClick={() => onSelect(row)}>
    <div className="ffb-card-header"><div><span>Grading Code</span><button type="button" className="ffb-receipt-link" onClick={(event) => { event.stopPropagation(); onSelect(row); }}>{row.grading_id || "Pending"}</button></div><StatusBadge tone={badgeToneForStatus(statusLabel(row.state))}>{statusLabel(row.state)}</StatusBadge></div>
    <div className="ffb-ticket-panel"><div><span>Weighbridge Ticket</span><strong>{row.ticket_no}</strong></div><Scale size={18} /></div>
    <div className="ffb-grading-summary"><div><span>Supplier</span><strong>{row.supplier || EMPTY_VALUE}</strong></div><div><span>Grading Result</span><strong>{row.ripeness || "Pending grading"}</strong></div></div>
    <div className="ffb-vehicle-strip"><div><span>Vehicle Plate No.</span><VehiclePlateDisplay value={row.vehicle_no} fallback={EMPTY_VALUE} /></div><div><span>Driver</span><strong>{row.driver_name || EMPTY_VALUE}</strong></div></div>
    <div className="ffb-card-divider" /><div className="ffb-grading-weight-grid"><div><span>Gross (MT)</span><strong>{Number(row.gross_weight || 0).toFixed(3)}</strong></div><div><span>Tare (MT)</span><strong>{row.tare_weight ? Number(row.tare_weight).toFixed(3) : "Pending"}</strong></div><div><span>Net (MT)</span><strong>{row.net_weight ? Number(row.net_weight).toFixed(3) : "Pending"}</strong></div></div>
    <div className="ffb-grading-meta"><span>Added by: {row.grader_name || row.operator_name || EMPTY_VALUE}</span><span>{formatDate(row.created_at || row.entry_at)}</span></div>
    <div className="ffb-grading-card-footer"><ActionMenu className="ffb-actions-menu" open={openActions === row.id} onToggle={() => setOpenActions(openActions === row.id ? null : row.id)} items={[{ key: "view", label: "View details", icon: <Eye size={15} aria-hidden="true" />, onClick: () => { setOpenActions(null); onSelect(row); } }, ...(row.state === "FIRST_WEIGHT_RECORDED" ? [{ key: "grading", label: "Grading", icon: <ClipboardCheck size={15} aria-hidden="true" />, onClick: () => { setOpenActions(null); onSelect(row); } }] : []), { key: "second-weighing", label: "Second weighing", icon: <Scale size={15} aria-hidden="true" />, disabled: !canSecondWeigh(row), onClick: () => { if (!canSecondWeigh(row)) return; setOpenActions(null); onSecondWeighing(row); } }, { key: "cancel", label: "Cancel", icon: <X size={15} aria-hidden="true" />, danger: true, onClick: () => setOpenActions(null) }]} /></div>
  </article>)}</div>;
}

export function FFBGradingPage({ rows, onSaved, focusId }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [secondWeighing, setSecondWeighing] = useState(null);
  const [openActions, setOpenActions] = useState(null);
  const [error, setError] = useState("");
  const pending = useMemo(
    () => rows.filter((row) => row.state === "FIRST_WEIGHT_RECORDED"),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.ticket_no} ${formatVehiclePlate(row.vehicle_no)} ${row.supplier} ${row.delivery_order}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [rows, search],
  );
  const { visibleItems, pagination } = usePaginatedItems(filtered, search);
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

  const submitSecondWeighing = async (event) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const attachments = await readAttachments(Array.from(event.currentTarget.querySelector('input[type="file"]')?.files || []));
    const response = await fetch(`/api/ffb-receiving/${secondWeighing.id}/vehicle-exit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tareWeight: form.get("tareWeight"),
        remarks: form.get("exitRemarks") || "",
        attachments,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message || "Unable to save second weighing.");
      return;
    }
    setSecondWeighing(null);
    onSaved();
  };

  return (
    <main className="receiving-page ffb-grading-page">
      <div className="receiving-breadcrumb">
        <span>Stock</span>
        <BreadcrumbSeparator />
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
            placeholder="Search grading code, ticket, vehicle plate or supplier..."
          />
          <span>{pending.length} awaiting action</span>
        </div>
        <div className="table-wrap">
          <table className="receiving-table">
            <thead>
              <tr>
                <th>Grading Code</th>
                <th>Weighbridge Ticket</th>
                <th>Vehicle Plate No.</th>
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
              {visibleItems.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    setError("");
                    setSelected(row);
                  }}
                >
                  <td className="ticket-cell">{row.grading_id || "Pending"}</td>
                  <td>{row.ticket_no}</td>
                  <td><VehiclePlateDisplay value={row.vehicle_no} fallback={EMPTY_VALUE} /></td>
                  <td>{row.supplier}</td>
                  <td>{row.supplier_category || EMPTY_VALUE}</td>
                  <td>
                    {row.net_weight
                      ? `${Number(row.net_weight).toFixed(3)} MT`
                      : "Pending"}
                  </td>
                  <td>
                    <StatusBadge tone={badgeToneForStatus(statusLabel(row.state))}>{statusLabel(row.state)}</StatusBadge>
                    {row.ripeness && (
                      <small className="grading-result">{row.ripeness}</small>
                    )}
                  </td>
                  <td>{row.grader_name || row.operator_name || EMPTY_VALUE}</td>
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
                    ) : canSecondWeigh(row) ? (
                      <button
                        className="item-edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          setError("");
                          setSecondWeighing(row);
                        }}
                      >
                        Second Weighing
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
      <FfbGradingGrid rows={visibleItems} statusLabel={statusLabel} onSelect={(row) => { setOpenActions(null); setError(""); setSelected(row); }} onSecondWeighing={(row) => { setError(""); setSelected(null); setSecondWeighing(row); }} openActions={openActions} setOpenActions={setOpenActions} />
      {pagination}
      {secondWeighing && <SecondWeighingFormDrawer record={secondWeighing} error={error} onClose={() => setSecondWeighing(null)} onSubmit={submitSecondWeighing} />}
      {selected && isEditable && (
        <FfbGradingFormDrawer
          record={selected}
          error={error}
          onClose={() => setSelected(null)}
          onSubmit={submit}
        />
      )}
      {selected && !isEditable && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside
            className="drawer grading-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <div className="eyebrow">STOCK / FFB RECEIVING {TEXT_SEPARATOR} <b>GRADING</b></div>
                <h2>{isEditable ? "FFB Grading Form" : selected.grading_id || selected.ticket_no}</h2>
              </div>
              <DrawerCloseButton onClick={() => setSelected(null)} label="Close grading details" />
            </div>
            {error && <div className="form-error">{error}</div>}
            {isEditable ? (
              <form onSubmit={submit}>
                <FfbGradingFormContent record={selected} onCancel={() => setSelected(null)} submitLabel="Complete Grading" />
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
