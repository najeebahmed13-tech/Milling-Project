import React, { useState } from "react";
import { formatDateTime, EMPTY_VALUE } from "../shared/formatters.js";
import { DrawerCloseButton, VehiclePlateDisplay } from "../design-system/components.jsx";
import { calculateNetWeight } from "./receiving.js";

export function SecondWeighingFormDrawer({ record, error, onClose, onSubmit }) {
  const [tarePreview, setTarePreview] = useState("");
  const grossWeight = Number(record?.gross_weight || 0);
  const tareWeight = Number(tarePreview || 0);
  const tareValidation = tarePreview === ""
    ? { valid: false, message: "Enter the tare weight." }
    : calculateNetWeight(grossWeight, tareWeight);
  const netWeight = tareValidation.valid ? tareValidation.net : null;
  const tareError = tarePreview !== "" && !tareValidation.valid ? tareValidation.message : "";

  const handleSubmit = (event) => {
    if (!tareValidation.valid) {
      event.preventDefault();
      return;
    }
    onSubmit(event);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer receiving-drawer drawer-form-surface second-weighing-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="second-weighing-form-title"
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">STOCK / FFB RECEIVING · SECOND WEIGHING</div>
            <h2 id="second-weighing-form-title">Vehicle Exit / Second Weighing</h2>
          </div>
          <DrawerCloseButton onClick={onClose} label="Close second weighing form" />
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="vehicle-exit-form">
            <section className="second-weighing-overview">
              <div className="second-weighing-section-title"><h3>Ticket &amp; Logistics Details</h3></div>
              <div className="second-weighing-detail-grid">
                <div><span>Weighbridge Ticket No.</span><strong className="ticket-ref">{record.ticket_no}</strong></div>
                <div><span>Vehicle Plate No.</span><VehiclePlateDisplay value={record.vehicle_no} fallback={EMPTY_VALUE} /></div>
                <div className="wide"><span>Supplier / Estate</span><strong>{record.supplier || EMPTY_VALUE}</strong></div>
                <div><span>Driver Name</span><strong>{record.driver_name || EMPTY_VALUE}</strong></div>
                <div><span>Entry Timestamp</span><strong>{formatDateTime(record.entry_at)}</strong></div>
              </div>
            </section>
            <section className="second-weighing-section">
              <div className="second-weighing-section-heading"><h3>Weight Overview</h3></div>
              <div className="second-weighing-weight-cards">
                <div><span>Gross Weight (MT)</span><strong>{grossWeight.toFixed(3)}</strong><small>Inbound Recorded</small></div>
                <div className="tare"><span>Tare Weight (MT)</span><strong>{tarePreview ? tareWeight.toFixed(3) : "Pending"}</strong><small>{tarePreview ? "Captured" : "Awaiting tare weigh"}</small></div>
                <div className="net"><span>Net Weight (MT)</span><strong>{netWeight !== null ? netWeight.toFixed(3) : "Pending"}</strong><small>{tarePreview ? "Auto calculated" : "Awaiting tare weigh"}</small></div>
              </div>
            </section>
            <section className="second-weighing-entry">
              <div className="second-weighing-section-title"><h3>Second Weighing Entry</h3></div>
              <label className="contract-field">
                Tare Weight (MT)<em>*</em>
                <div className="second-weighing-input-wrap">
                  <input required name="tareWeight" type="number" min="0.001" max={grossWeight > 0 ? (grossWeight - 0.001).toFixed(3) : undefined} step="0.001" placeholder="0.000" value={tarePreview} aria-invalid={Boolean(tareError)} aria-describedby={tareError ? "tare-weight-error" : undefined} onChange={(event) => setTarePreview(event.target.value)} />
                  <span>MT</span>
                </div>
                {tareError && <span id="tare-weight-error" className="ds-field-message" role="alert">{tareError}</span>}
              </label>
              <p className="second-weighing-help">ⓘ Net weight will automatically calculate upon entering tare weight.</p>
              <div className="second-weighing-disposition-grid">
                <label className="contract-field">Accepted Quantity (MT)<small>(Optional; defaults to net)</small><input name="acceptedQty" type="number" min="0" step="0.001" placeholder={netWeight !== null ? netWeight.toFixed(3) : "Net weight"} /></label>
                <label className="contract-field">Rejected Quantity (MT)<small>(Optional; defaults to 0)</small><input name="rejectedQty" type="number" min="0" step="0.001" placeholder="0.000" /></label>
                <label className="contract-field wide">Rejection Reason <small>(Required when rejected quantity is entered)</small><input name="rejectionReason" maxLength="250" placeholder="Reason for rejected FFB" /></label>
              </div>
              <label className="contract-field">Remarks <small>(Optional)</small><textarea name="exitRemarks" rows="4" maxLength="500" placeholder="Add vehicle exit notes, exceptions or observations..." /></label>
              <label className="contract-field">Attachments <small>(Optional · multiple image or PDF files)</small><input type="file" multiple accept="image/*,.pdf" /></label>
              <div className="blocked-help">Net Weight = Gross Weight ({grossWeight.toFixed(3)} MT) → Tare Weight. The certified net weight will be locked and printed upon saving.</div>
            </section>
          </div>
          <div className="contract-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!tareValidation.valid}>Save &amp; Vehicle Exit</button>
          </div>
        </form>
      </aside>
    </div>
  );
}
