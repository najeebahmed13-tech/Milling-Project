import React from "react";
import { formatDateTime, TEXT_SEPARATOR } from "../shared/formatters.js";
import { NumberInput } from "../design-system/form-fields.jsx";
import { DrawerCloseButton, VehiclePlateDisplay } from "../design-system/components.jsx";
import { StatusBadge } from "../design-system/badges.jsx";
import { parameterFields } from "./grading-parameters.js";

export { parameterFields };

export function FfbGradingFormContent({ record, onCancel, showActions = true, submitLabel = "Complete Grading" }) {
  return (
    <>
      <section className="grading-form-overview">
        <div className="grading-form-overview-title">
          <h3>Delivery Details</h3>
        </div>
        <div className="grading-form-overview-grid">
          <div className="grading-detail-value emphasis"><span>Weighbridge Ticket</span><strong>{record.ticket_no}</strong></div>
          <div className="grading-detail-value"><span>Entry Date &amp; Time</span><strong>{formatDateTime(record.entry_at)}</strong></div>
          <div className="grading-detail-value"><span>Vehicle Plate No. &amp; Driver</span><strong><VehiclePlateDisplay value={record.vehicle_no} /> · {record.driver_name || "—"}</strong></div>
          <div className="grading-detail-value"><span>Supplier</span><strong>{record.supplier || "—"}</strong></div>
        </div>
        <div className="grading-form-weight-cards">
          <div><span>Gross Weight</span><strong>{Number(record.gross_weight || 0).toFixed(3)} <small>MT</small></strong></div>
          <div><span>Tare Weight</span><strong className="pending">{record.tare_weight ? `${Number(record.tare_weight).toFixed(3)} MT` : "Pending"}</strong></div>
          <div><span>Net Weight</span><strong className="pending">{record.net_weight ? `${Number(record.net_weight).toFixed(3)} MT` : "Pending"}</strong></div>
        </div>
      </section>
      <section className="grading-parameters">
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
                  <span className="grading-input-wrap"><NumberInput name={key} min="0" step="0.001" required={required} placeholder="0.000" /><small>%</small></span>
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
                  <span className="grading-input-wrap"><NumberInput name={key} min="0" step="0.001" required={required} placeholder="0.000" /><small>Value</small></span>
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
                  <span className="grading-input-wrap"><NumberInput name={key} min="0" step="0.001" required={required} placeholder="0.000" /><small>Bunches</small></span>
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
      {showActions && (
        <div className="drawer-action-strip grading-drawer-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary">{submitLabel}</button>
        </div>
      )}
    </>
  );
}

export function FfbGradingFormDrawer({ record, error, onClose, onSubmit }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer grading-drawer drawer-form-surface"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ffb-grading-form-title"
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">STOCK / FFB RECEIVING {TEXT_SEPARATOR} <b>GRADING</b></div>
            <h2 id="ffb-grading-form-title">FFB Grading Form</h2>
          </div>
          <StatusBadge tone="warning">First Weighing</StatusBadge>
          <DrawerCloseButton onClick={onClose} label="Close grading form" />
          {/* <button
            type="button"
            className="icon-button"
            aria-label="Close grading form"
            title="Close"
            onClick={onClose}
          >
            ×
          </button> */}
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <FfbGradingFormContent record={record} onCancel={onClose} submitLabel="Complete Grading" />
        </form>
      </aside>
    </div>
  );
}
