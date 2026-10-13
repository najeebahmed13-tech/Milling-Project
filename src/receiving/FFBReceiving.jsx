import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Eye,
  Printer,
  Scale,
  Ticket,
  X,
} from "lucide-react";
import "./receiving.css";
import "./ffb-receive-form-order.css";
import "./receiving-smart.css";
import "./ffb-ticket-secondary.css";
import { validateFfbReceiveForm } from "./receiving.js";
import { EMPTY_VALUE, formatDate, formatDateTime, formatTime } from "../shared/formatters.js";
import { FfbGradingFormContent, FfbGradingFormDrawer, parameterFields as gradingFields } from "./FfbGradingFormContent.jsx";
import { SecondWeighingFormDrawer } from "./SecondWeighingFormDrawer.jsx";
import { BreadcrumbSeparator, DrawerCloseButton, VehiclePlateDisplay } from "../design-system/components.jsx";
import AttachmentList from "../shared/AttachmentList.jsx";
import { receiptCode } from "../shared/receiptCode.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { StatusBadge, badgeToneForStatus } from "../design-system/badges.jsx";
import { ActionMenu } from "../design-system/index.js";
import { ReceivingSlip } from "./ReceivingSlip.jsx";

const emptyReceive = {
  vehicleNo: "",
  driverName: "",
  driverLicenseNo: "",
  supplier: "",
  item: "",
  supplierDeclaredQty: "",
  grossWeight: "",
  weightUom: "MT",
  remarks: "",
};

const parseFiles = (value) => {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
};
const gradingComplete = (row) => {
  if (row?.state === "GRADING_COMPLETED") return true;
  if (
    !row?.grading_id ||
    !row?.grading_parameters_json ||
    row?.state === "READY_TO_POST"
  )
    return false;
  try {
    return Number.isFinite(
      Number(JSON.parse(row.grading_parameters_json).ripe),
    );
  } catch {
    return false;
  }
};
const statusLabel = (state, record = null) => {
  if (state === "READY_TO_POST" && (record?.exit_at || record?.net_weight)) return "Completed";
  return (
    {
      FIRST_WEIGHT_RECORDED: "First Weighing",
      GRADING_COMPLETED: "Grading",
      READY_TO_POST: "Second Weighing",
      POSTED: "Completed",
      COMPLETED: "Completed",
    }[state] || "First Weighing"
  );
};

function ReceiptDetails({ record, onClose, onAction }) {
  const attachments = parseFiles(record.exit_attachments_json);
  return (
    <div className="receipt-detail-view">
      <section className="receipt-detail-section">
        <div className="receipt-detail-grid">
          <div>
            <span>Weighbridge ticket</span>
            <strong className="highlight">{record.ticket_no}</strong>
          </div>
          <div>
            <span>Entry Date &amp; Time</span>
            <strong>{formatDateTime(record.entry_at)}</strong>
          </div>
          <div>
            <span>Item</span>
            <strong>{record.product_type || EMPTY_VALUE}</strong>
          </div>
          <div>
            <span>Supplier</span>
            <strong>{record.supplier || EMPTY_VALUE}</strong>
          </div>
        </div>
      </section>
      <section className="receipt-detail-section">
        <div className="receipt-detail-heading compact"><h3>Weight Overview</h3></div>
        <div className="weight-preview drawer-weights">
          <div>
            <span>Gross weight</span>
            <strong>{Number(record.gross_weight).toFixed(3)} MT</strong>
          </div>
          <div>
            <span>Tare weight</span>
            <strong>
              {record.tare_weight
                ? `${Number(record.tare_weight).toFixed(3)} MT`
                : "Pending"}
            </strong>
          </div>
          <div className="net">
            <span>Net weight</span>
            <strong>
              {record.net_weight
                ? `${Number(record.net_weight).toFixed(3)} MT`
                : "Pending"}
            </strong>
          </div>
        </div>
        {record.exit_at && (
          <div className="completion-note">
            Second weighing completed · Vehicle exit recorded {formatDateTime(record.exit_at)}
          </div>
        )}
      </section>
      <section className="receipt-detail-section">
        <h3>Vehicle Details</h3>
        <div className="receipt-detail-grid">
          <div>
            <span>Vehicle Plate No.</span>
            <VehiclePlateDisplay value={record.vehicle_no} fallback={EMPTY_VALUE} />
          </div>
          <div>
            <span>Driver name</span>
            <strong>{record.driver_name || EMPTY_VALUE}</strong>
          </div>
          <div>
            <span>Declared quantity</span>
            <strong>
              {record.supplier_declared_qty
                ? `${Number(record.supplier_declared_qty).toFixed(3)} MT`
                : EMPTY_VALUE}
            </strong>
          </div>
        </div>
      </section>
      <section className="receipt-detail-section">
        <h3>Remarks and attachments</h3>
        <div className="receipt-detail-copy">
          <span>Remarks</span>
          <strong>
            {record.exit_remarks || record.remarks || "No remarks recorded"}
          </strong>
        </div>
        <AttachmentList files={attachments} />
      </section>
      <div className="drawer-action-strip receiving-drawer-actions">
        <strong>Next action</strong>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={
            record.state !== "FIRST_WEIGHT_RECORDED" || gradingComplete(record)
          }
          onClick={() => onAction("grading", record)}
        >
          Grade FFB
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!gradingComplete(record)}
          onClick={() => onAction("exit", record)}
        >
          Second Weighing
        </button>
      </div>
    </div>
  );
}

function FfbReceiptGrid({
  rows,
  onSelect,
  onViewSlip,
  onStage,
  openActions,
  setOpenActions,
}) {
  return (
    <div className="ffb-receiving-grid">
      {rows.map((row) => (
        <article
          className="ffb-receipt-card"
          key={row.id}
          onClick={() => onSelect(row)}
        >
          <div className="ffb-card-header">
            <div>
              <span>Receipt Code</span>
              <button
                type="button"
                className="ffb-receipt-link"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(row);
                }}
              >
                {receiptCode(row)}
              </button>
            </div>
            <StatusBadge tone={badgeToneForStatus(statusLabel(row.state, row))}>{statusLabel(row.state, row)}</StatusBadge>
          </div>
          <div className="ffb-ticket-panel">
            <div>
              <span>Weighbridge Ticket</span>
              <strong>{row.ticket_no}</strong>
            </div>
            <Ticket size={18} />
          </div>
          <div className="ffb-card-summary">
            <div>
              <span>Supplier</span>
              <strong>{row.supplier || EMPTY_VALUE}</strong>
            </div>
            <div>
              <span>Item</span>
              <strong>{row.product_type || EMPTY_VALUE}</strong>
            </div>
          </div>
          <div className="ffb-vehicle-strip">
            <div>
              <span>Vehicle Plate No.</span>
              <VehiclePlateDisplay value={row.vehicle_no} fallback={EMPTY_VALUE} />
            </div>
            <div>
              <span>Driver</span>
              <strong>{row.driver_name || EMPTY_VALUE}</strong>
            </div>
          </div>
          <div className="ffb-card-divider" />
          <div className="ffb-weight-heading">
            Weight Measurements (Metric Tons)
          </div>
          <div className="ffb-weight-grid">
            <div>
              <span>Gross (MT)</span>
              <strong>{Number(row.gross_weight || 0).toFixed(3)}</strong>
            </div>
            <div>
              <span>Tare (MT)</span>
              <strong>
                {row.tare_weight
                  ? Number(row.tare_weight).toFixed(3)
                  : "Pending"}
              </strong>
            </div>
            <div className="net">
              <span>Net (MT)</span>
              <strong>
                {row.net_weight ? Number(row.net_weight).toFixed(3) : "Pending"}
              </strong>
            </div>
          </div>
          <div className="ffb-card-footer">
            <span>· {formatDateTime(row.entry_at)}</span>
            <button
              type="button"
              className="ffb-view-slip"
              onClick={(event) => {
                event.stopPropagation();
                onViewSlip(row);
              }}
            >
              <Printer size={15} /> View Slip
            </button>
            <ActionMenu
              className="ffb-actions-menu"
              open={openActions === row.id}
              onToggle={() => setOpenActions(openActions === row.id ? null : row.id)}
              items={[
                { key: "view", label: "View details", icon: <Eye size={15} aria-hidden="true" />, onClick: () => { setOpenActions(null); onSelect(row); } },
                ...(row.state === "FIRST_WEIGHT_RECORDED" && !gradingComplete(row) ? [{ key: "grading", label: "Grading", icon: <ClipboardCheck size={15} aria-hidden="true" />, onClick: () => { setOpenActions(null); onStage("grading", row); } }] : []),
                ...(statusLabel(row.state, row) !== "Completed" ? [{ key: "second-weighing", label: "Second weighing", icon: <Scale size={15} aria-hidden="true" />, disabled: !gradingComplete(row), onClick: () => { if (!gradingComplete(row)) return; setOpenActions(null); onStage("exit", row); } }] : []),
                ...(row.state === "FIRST_WEIGHT_RECORDED" && !gradingComplete(row) ? [{ key: "cancel", label: "Cancel", icon: <X size={15} aria-hidden="true" />, danger: true, onClick: () => setOpenActions(null) }] : []),
              ]}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

export function FFBReceivingPage({ rows, suppliers, items = [], onSaved }) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState(null);
  const [selected, setSelected] = useState(null);
  const [slip, setSlip] = useState(null);
  const [openActions, setOpenActions] = useState(null);
  const [form, setForm] = useState(emptyReceive);
  const [tarePreview, setTarePreview] = useState("");
  const [error, setError] = useState("");
  const [capturedAt, setCapturedAt] = useState(() => new Date());
  const activeItems = items.filter((item) => item.status === "Active");
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.ticket_no} ${row.vehicle_no} ${row.supplier} ${row.product_type} ${row.delivery_order}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [rows, search],
  );
  const { visibleItems, pagination } = usePaginatedItems(filtered, search);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const openForm = (type, row) => {
    setError("");
    setSelected(null);
    setTarePreview("");
    setStage({ type, ...row });
  };
  const openNew = () => {
    setError("");
    setForm({ ...emptyReceive });
    setCapturedAt(new Date());
    setTarePreview("");
    setStage({ type: "receive" });
  };
  const readAttachments = async (files) =>
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result,
              });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    );
  const submitReceive = async (event) => {
    event.preventDefault();
    setError("");
    const systemCapturedAt = new Date();
    setCapturedAt(systemCapturedAt);
    const validation = validateFfbReceiveForm(form);
    if (!validation.valid) return setError(validation.message);
    const attachments = await readAttachments(
      Array.from(
        event.currentTarget.querySelector('input[type="file"]')?.files || [],
      ),
    );
    const response = await fetch("/api/ffb-receiving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        // Vehicle type is system-derived for FFB receiving. Keep it explicit
        // in the API contract for production backends that validate it before
        // applying their server-side default.
        vehicleType: form.vehicleType || "FFB Tipper",
        // Legacy production APIs require an identity pair even though the
        // license field is informational. Use a system reference only for
        // that compatibility contract; never present it as a real license.
        driverIdentityType: "System Reference",
        driverIdentityNo: form.driverLicenseNo.trim() || `UNVERIFIED-${form.vehicleNo.trim().replace(/[^A-Za-z0-9]/g, "")}-${Date.now()}`,
        capturedAt: systemCapturedAt.toISOString(),
        attachments,
      }),
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.message);
    setStage(null);
    setForm({ ...emptyReceive });
    onSaved();
  };
  const submitGrading = async (event) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const attachments = await readAttachments(Array.from(event.currentTarget.querySelector('input[type="file"]')?.files || []));
    const gradingParameters = Object.fromEntries(
      gradingFields.map(([key]) => [key, data.get(key)]),
    );
    const response = await fetch(`/api/ffb-receiving/${stage.id}/grading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gradingParameters,
        gradingResult: "Pending Vehicle Exit",
        remarks: data.get("gradingRemarks") || "",
        attachments,
      }),
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.message);
    setStage(null);
    onSaved();
  };
  const submitExit = async (event) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const attachments = await readAttachments(
      Array.from(
        event.currentTarget.querySelector('input[type="file"]')?.files || [],
      ),
    );
    const response = await fetch(
      `/api/ffb-receiving/${stage.id}/vehicle-exit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tareWeight: data.get("tareWeight"),
          remarks: data.get("exitRemarks") || "",
          attachments,
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) return setError(payload.message);
    setStage(null);
    onSaved();
  };

  return (
    <main className="receiving-page ffb-receiving-page">
      <div className="receiving-breadcrumb">
        <span>Stock</span>
        <BreadcrumbSeparator />
        <b>›</b>
        <strong>FFB Receiving</strong>
      </div>
      <div className="receiving-heading">
        <div>
          <h1>FFB Receiving</h1>
          <p>
            Record inbound Fresh Fruit Bunches using the configured supplier and
            item masters.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + New FFB Receive
        </button>
      </div>
      <article className="panel receiving-panel">
        <div className="receiving-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, vehicle, supplier or item..."
          />
        </div>
        <div className="table-wrap">
          <table className="receiving-table">
            <thead>
              <tr>
                <th>Receipt Code</th>
                <th>Weighbridge Ticket</th>
                <th>Entry Date / Time</th>
                <th>Vehicle Plate No.</th>
                <th>Driver</th>
                <th>Supplier</th>
                <th>Item</th>
                <th>Gross (MT)</th>
                <th>Tare (MT)</th>
                <th>Net (MT)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row)}>
                  <td className="receipt-code-cell">
                    {receiptCode(row)}
                  </td>
                  <td className="ticket-cell">{row.ticket_no}</td>
                  <td>{formatDateTime(row.entry_at)}</td>
                  <td><VehiclePlateDisplay value={row.vehicle_no} fallback={EMPTY_VALUE} /></td>
                  <td>{row.driver_name || EMPTY_VALUE}</td>
                  <td>{row.supplier}</td>
                  <td>{row.product_type}</td>
                  <td>{Number(row.gross_weight).toFixed(3)}</td>
                  <td>
                    {row.tare_weight
                      ? Number(row.tare_weight).toFixed(3)
                      : "Pending"}
                  </td>
                  <td>
                    {row.net_weight
                      ? Number(row.net_weight).toFixed(3)
                      : "Pending"}
                  </td>
                  <td>
                    <StatusBadge tone={badgeToneForStatus(statusLabel(row.state, row))}>{statusLabel(row.state, row)}</StatusBadge>
                  </td>
                  <td>
                    {row.state === "FIRST_WEIGHT_RECORDED" &&
                      !gradingComplete(row) && (
                        <button
                          className="item-edit"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(row);
                          }}
                        >
                          Grade
                        </button>
                      )}
                    {gradingComplete(row) && (
                      <button
                        className="item-edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          openForm("exit", row);
                        }}
                      >
                        Second Weighing
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="12" className="items-empty">
                    No FFB receiving tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
      <FfbReceiptGrid
        rows={visibleItems}
        onSelect={(row) => {
          setOpenActions(null);
          setSelected(row);
        }}
        onStage={openForm}
        onViewSlip={setSlip}
        openActions={openActions}
        setOpenActions={setOpenActions}
      />
      {pagination}
      {slip && <ReceivingSlip record={slip} statusLabel={statusLabel} onClose={() => setSlip(null)} />}
      {stage?.type === "grading" && (
        <FfbGradingFormDrawer
          record={stage}
          error={error}
          onClose={() => setStage(null)}
          onSubmit={submitGrading}
        />
      )}
      {stage?.type === "exit" && (
        <SecondWeighingFormDrawer
          record={stage}
          error={error}
          onClose={() => setStage(null)}
          onSubmit={submitExit}
        />
      )}
      {stage?.type === "receive" && (
        <div
          className="ffb-receive-drawer-backdrop"
          onClick={() => setStage(null)}
        >
          <form
            className="receiving-form ffb-receive-drawer"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ffb-receive-drawer-title"
            onSubmit={
              stage.type === "receive"
                ? submitReceive
                : stage.type === "grading"
                  ? submitGrading
                  : submitExit
            }
          >
            <div className="items-form-heading">
              <div>
                <span className="eyebrow">{stage.type === "grading" ? "STOCK / FFB RECEIVING · GRADING" : stage.type === "exit" ? "STOCK / FFB RECEIVING · SECOND WEIGHING" : "STOCK / FFB RECEIVING"}</span>
                <h2 id={stage.type === "receive" ? "ffb-receive-drawer-title" : undefined}>
                  {stage.type === "receive"
                    ? "FFB Receive"
                    : stage.type === "grading"
                      ? "FFB Grading Form"
                      : "Vehicle Exit / Second Weighing"}
                </h2>
                {stage.type === "receive" && (
                  <p>System date and time are captured when this record is saved.</p>
                )}
              </div>
              {stage.type === "grading" && <StatusBadge tone="warning">First Weighing</StatusBadge>}
              {stage.type === "exit" && <span className="second-weighing-header-status">Second Weighing</span>}
              <DrawerCloseButton onClick={() => setStage(null)} label="Close weighing form" />
            </div>
            {error && <div className="form-error">{error}</div>}
            {stage.type === "receive" ? (
              <div className="contract-grid two">
                <label className="contract-field">
                  Date<em>*</em>
                  <input name="systemDate" value={formatDate(capturedAt)} readOnly />
                </label>
                <label className="contract-field">
                  Time<em>*</em>
                  <input name="systemTime" value={formatTime(capturedAt)} readOnly />
                </label>
                <label className="contract-field">
                  Driver Name<em>*</em>
                  <input
                    required
                    value={form.driverName}
                    onChange={(event) =>
                      update("driverName", event.target.value)
                    }
                  />
                </label>
                <label className="contract-field">
                  Driver ID (License)<small> (Informational · Optional)</small>
                  <input
                    value={form.driverLicenseNo}
                    onChange={(event) => {
                      update("driverLicenseNo", event.target.value);
                    }}
                  />
                </label>
                <label className="contract-field">
                  Vehicle Plate No.<em>*</em>
                  <input
                    required
                    value={form.vehicleNo}
                    onChange={(event) =>
                      update("vehicleNo", event.target.value)
                    }
                  />
                </label>
                <label className="contract-field">
                  Supplier<em>*</em>
                  <select
                    required
                    value={form.supplier}
                    onChange={(event) => update("supplier", event.target.value)}
                  >
                    <option value="">Select supplier...</option>
                    {suppliers
                      .filter((supplier) => supplier.status === "Active")
                      .map((supplier) => (
                        <option key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="contract-field">
                  Item<em>*</em>
                  <select
                    required
                    value={form.item}
                    onChange={(event) => update("item", event.target.value)}
                  >
                    <option value="">Select configured item...</option>
                    {activeItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="contract-field">
                  Supplier Declared Qty<small> (Optional)</small>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.supplierDeclaredQty}
                    onChange={(event) =>
                      update("supplierDeclaredQty", event.target.value)
                    }
                  />
                </label>
                <label className="contract-field receiving-weight-field">
                  Gross Weight (MT)<em>*</em>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.grossWeight}
                    onChange={(event) =>
                      update("grossWeight", event.target.value)
                    }
                  />
                </label>
                <label className="contract-field form-wide-field">
                  Remarks <small>(Optional)</small>
                  <textarea
                    rows="3"
                    value={form.remarks}
                    onChange={(event) => update("remarks", event.target.value)}
                  />
                </label>
                <label className="contract-field form-wide-field">
                  Attachment{" "}
                  <small>(Optional · multiple image or PDF files)</small>
                  <input type="file" multiple accept="image/*,.pdf" />
                </label>
              </div>
            ) : stage.type === "grading" ? (
              <FfbGradingFormContent record={stage} showActions={false} submitLabel="Complete Grading" />
            ) : (
              <div className="vehicle-exit-form">
                <section className="second-weighing-overview">
                  <div className="second-weighing-section-title"><h3>Ticket &amp; Logistics Details</h3></div>
                  <div className="second-weighing-detail-grid">
                    <div><span>Weighbridge Ticket No.</span><strong className="ticket-ref">{stage.ticket_no}</strong></div>
                    <div><span>Vehicle Plate No.</span><VehiclePlateDisplay value={stage.vehicle_no} fallback={EMPTY_VALUE} /></div>
                    <div className="wide"><span>Supplier / Estate</span><strong>{stage.supplier || EMPTY_VALUE}</strong></div>
                    <div><span>Driver Name</span><strong>{stage.driver_name || EMPTY_VALUE}</strong></div>
                    <div><span>Entry Timestamp</span><strong>{formatDateTime(stage.entry_at)}</strong></div>
                  </div>
                </section>
                <section className="second-weighing-section">
                  <div className="second-weighing-section-heading"><h3>Weight Overview</h3></div>
                  <div className="second-weighing-weight-cards">
                    <div><span>Gross Weight (MT)</span><strong>{Number(stage.gross_weight || 0).toFixed(3)}</strong><small>Inbound Recorded</small></div>
                    <div className="tare"><span>Tare Weight (MT)</span><strong>{tarePreview ? Number(tarePreview).toFixed(3) : "Pending"}</strong><small>{tarePreview ? "Captured" : "Awaiting tare weigh"}</small></div>
                    <div className="net"><span>Net Weight (MT)</span><strong>{tarePreview && Number(tarePreview) > 0 ? (Number(stage.gross_weight || 0) - Number(tarePreview)).toFixed(3) : "Pending"}</strong><small>{tarePreview ? "Auto calculated" : "Awaiting tare weigh"}</small></div>
                  </div>
                </section>
                <section className="second-weighing-entry">
                  <div className="second-weighing-section-title"><h3>Second Weighing Entry</h3></div>
                  <label className="contract-field">
                    Tare Weight (MT)<em>*</em>
                    <div className="second-weighing-input-wrap"><input required name="tareWeight" type="number" min="0.001" step="0.001" placeholder="0.000" value={tarePreview} onChange={(event) => setTarePreview(event.target.value)} /><span>MT</span></div>
                  </label>
                  <p className="second-weighing-help">ⓘ Net weight will automatically calculate upon entering tare weight.</p>
                  <label className="contract-field">Remarks <small>(Optional)</small><textarea name="exitRemarks" rows="4" maxLength="500" placeholder="Add vehicle exit notes, exceptions or observations..." /></label>
                  <label className="contract-field">Attachments <small>(Optional · multiple image or PDF files)</small><input type="file" multiple accept="image/*,.pdf" /></label>
                  <div className="blocked-help">Net Weight = Gross Weight ({Number(stage.gross_weight || 0).toFixed(3)} MT) → Tare Weight. The certified net weight will be locked and printed upon saving.</div>
                </section>
              </div>
            )}
            <div className="contract-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStage(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary">
                {stage.type === "receive"
                  ? "Save FFB Receive"
                  : stage.type === "grading"
                    ? "Complete Grading"
                    : "Save & Vehicle Exit"}
              </button>
            </div>
          </form>
        </div>
      )}
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside
            className="drawer receiving-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <div className="eyebrow">STOCK / FFB RECEIVING · DETAILS</div>
                <div className="receipt-drawer-title">
                  <h2>{receiptCode(selected) || selected.ticket_no}</h2>
                  <StatusBadge tone={badgeToneForStatus(statusLabel(selected.state, selected))}>{statusLabel(selected.state, selected)}</StatusBadge>
                </div>
              </div>
              <DrawerCloseButton onClick={() => setSelected(null)} label="Close receiving details" />
            </div>
            <ReceiptDetails
              record={selected}
              onClose={() => setSelected(null)}
              onAction={openForm}
            />
          </aside>
        </div>
      )}
    </main>
  );
}
