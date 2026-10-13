import React from "react";
import { Printer } from "lucide-react";
import "./receiving-slip.css";
import { DisplayValue } from "../design-system/form-fields.jsx";
import { EMPTY_VALUE, formatDateTime, formatNumber, formatVehiclePlate, normalizeDisplayText, TEXT_SEPARATOR } from "../shared/formatters.js";
import { receiptCode } from "../shared/receiptCode.js";
import {
  DEFAULT_RECEIVING_SLIP_TEMPLATE,
  getReceivingSlipField,
  resolveReceivingSlipTemplate,
} from "./receiving-slip-template.js";

function parseParameters(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function fieldIsVisible(section, key) {
  return getReceivingSlipField(section, key)?.visible !== false;
}

function fieldLabel(section, key, fallback) {
  return getReceivingSlipField(section, key)?.label || fallback;
}

function formatWeight(value, template) {
  const formatted = formatNumber(value, {
    minimumFractionDigits: template.formatting.numberFractionDigits,
    maximumFractionDigits: template.formatting.numberFractionDigits,
  });
  return formatted === EMPTY_VALUE ? EMPTY_VALUE : `${formatted} ${template.formatting.weightUnit}`;
}

function formatSlipDateTime(value, template) {
  return formatDateTime(value, undefined, template.formatting.dateTimeLocale);
}

function formatParameterValue(key, value, template) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const formatted = formatNumber(value, {
    minimumFractionDigits: template.formatting.numberFractionDigits,
    maximumFractionDigits: template.formatting.numberFractionDigits,
  });
  if (formatted === EMPTY_VALUE) return EMPTY_VALUE;
  if (["unripe", "overripe"].includes(key)) return `${formatted} Bunches`;
  if (key === "wetWeight") return formatted;
  return `${formatted} %`;
}

function SlipField({ label, value, emphasis = false }) {
  return (
    <div className={`receiving-slip-field${emphasis ? " emphasis" : ""}`}>
      <span>{label}</span>
      <strong><DisplayValue value={value} fallback={EMPTY_VALUE} /></strong>
    </div>
  );
}

function SlipSection({ title, children, className = "" }) {
  return (
    <section className={`receiving-slip-section ${className}`.trim()}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function SlipHeader({ template }) {
  return (
    <header className="receiving-slip-header">
      <strong>{template.header.organizationName}</strong>
      <span>{template.header.subtitle}</span>
      <em>{template.header.certificationText}</em>
    </header>
  );
}

function TicketSection({ section, record, statusLabel, template }) {
  const values = {
    ticketNo: record.ticket_no,
    receiptCode: receiptCode(record),
    receivingDateTime: formatSlipDateTime(record.entry_at, template),
    receivingStatus: statusLabel(record.state, record),
  };
  return (
    <SlipSection title={section.title}>
      <div className="receiving-slip-field-grid">
        {section.fields.filter((field) => values[field.key] !== undefined && field.visible !== false).map((field) => (
          <SlipField key={field.key} label={field.label} value={values[field.key]} emphasis={field.key === "receiptCode"} />
        ))}
      </div>
    </SlipSection>
  );
}

function SupplierVehicleSection({ section, record }) {
  const values = {
    supplier: record.supplier,
    vehicleNo: formatVehiclePlate(record.vehicle_no),
    driverName: record.driver_name,
    productType: record.product_type,
  };
  return (
    <SlipSection title={section.title}>
      <div className="receiving-slip-field-grid">
        {section.fields.filter((field) => values[field.key] !== undefined && field.visible !== false).map((field) => (
          <SlipField key={field.key} label={field.label} value={values[field.key]} emphasis={field.key === "vehicleNo"} />
        ))}
      </div>
    </SlipSection>
  );
}

function WeightSection({ section, record, template }) {
  const rows = [
    { key: "grossWeight", timestamp: record.entry_at, value: formatWeight(record.gross_weight, template), status: "Recorded" },
    { key: "tareWeight", timestamp: record.exit_at, value: record.tare_weight ? formatWeight(record.tare_weight, template) : EMPTY_VALUE, status: record.tare_weight ? "Recorded" : "Pending second weighing" },
    { key: "netWeight", timestamp: record.exit_at, value: record.net_weight ? formatWeight(record.net_weight, template) : EMPTY_VALUE, status: record.net_weight ? "Certified" : "Not certified" },
  ];
  const statusField = getReceivingSlipField(section, "weightStatus");
  const currentStatus = record.net_weight ? "Net weight certified" : "Awaiting second weighing";
  return (
    <SlipSection title={section.title}>
      <div className="receiving-slip-weight-table">
        <div className="receiving-slip-weight-head"><span>Measurement</span><span>Timestamp</span><span>Scale</span><span>Reading</span><span>Status</span></div>
        {rows.filter((row) => fieldIsVisible(section, row.key)).map((row) => (
          <div className="receiving-slip-weight-row" key={row.key}>
            <strong>{fieldLabel(section, row.key, row.key)}</strong>
            <span>{row.timestamp ? formatSlipDateTime(row.timestamp, template) : EMPTY_VALUE}</span>
            <span>Mill Weighbridge</span>
            <b className={row.status.includes("Pending") || row.status.includes("Not") ? "pending" : ""}>{row.value}</b>
            <small>{row.status}</small>
          </div>
        ))}
      </div>
      {statusField?.visible !== false ? <div className="receiving-slip-status-line"><span>{statusField?.label || "Current Weighing Status"}</span><strong>{currentStatus}</strong></div> : null}
    </SlipSection>
  );
}

function GradingSection({ section, record, template }) {
  const parameters = parseParameters(record.grading_parameters_json);
  const groups = [
    { key: "received", title: "FFB Received (%)", fields: section.fields.filter((field) => !["unripe", "overripe", "wetWeight"].includes(field.key)) },
    { key: "returned", title: "FFB Returned (Bunches)", fields: section.fields.filter((field) => ["unripe", "overripe"].includes(field.key)) },
    { key: "wet", title: "Wet Weight / Wet Load", fields: section.fields.filter((field) => field.key === "wetWeight") },
  ];
  return (
    <SlipSection title={section.title} className="receiving-slip-grading-section">
      {record.grading_id || Object.keys(parameters).length ? groups.map((group) => (
        <div className="receiving-slip-grading-group" key={group.key}>
          <h4>{group.title}</h4>
          <div className="receiving-slip-field-grid">
            {group.fields.filter((field) => field.visible !== false).map((field) => (
              <SlipField key={field.key} label={field.label} value={formatParameterValue(field.key, parameters[field.key], template)} emphasis={field.key === "ripe"} />
            ))}
          </div>
        </div>
      )) : <p className="receiving-slip-empty">FFB grading has not been recorded.</p>}
    </SlipSection>
  );
}

function SummarySection({ section, record, statusLabel, template }) {
  const values = {
    gradingResult: record.ripeness || record.grading_result,
    acceptedQty: record.accepted_qty === null || record.accepted_qty === undefined ? EMPTY_VALUE : formatWeight(record.accepted_qty, template),
    rejectedQty: record.rejected_qty === null || record.rejected_qty === undefined ? EMPTY_VALUE : formatWeight(record.rejected_qty, template),
    gradingStatus: record.grading_id ? statusLabel(record.state, record) : "Pending grading",
  };
  return (
    <SlipSection title={section.title}>
      <div className="receiving-slip-field-grid">
        {section.fields.filter((field) => values[field.key] !== undefined && field.visible !== false).map((field) => (
          <SlipField key={field.key} label={field.label} value={values[field.key]} emphasis={field.key === "gradingResult"} />
        ))}
      </div>
    </SlipSection>
  );
}

function RemarksSection({ section, record, template }) {
  const values = {
    gradingRemarks: normalizeDisplayText(record.remarks, EMPTY_VALUE),
    receivingRemarks: normalizeDisplayText(record.exit_remarks, EMPTY_VALUE),
    generatedBy: [record.operator_name, record.created_at ? formatSlipDateTime(record.created_at, template) : null].filter(Boolean).join(` ${TEXT_SEPARATOR} `) || EMPTY_VALUE,
  };
  return (
    <SlipSection title={section.title}>
      <div className="receiving-slip-field-grid">
        {section.fields.filter((field) => values[field.key] !== undefined && field.visible !== false).map((field) => (
          <SlipField key={field.key} label={field.label} value={values[field.key]} />
        ))}
      </div>
      <p className="receiving-slip-footer-copy">{template.footerText}</p>
    </SlipSection>
  );
}

function renderSlipSection(section, props) {
  if (!section.visible) return null;
  if (section.key === "ticket") return <TicketSection key={section.key} section={section} {...props} />;
  if (section.key === "supplierVehicle") return <SupplierVehicleSection key={section.key} section={section} {...props} />;
  if (section.key === "weight") return <WeightSection key={section.key} section={section} {...props} />;
  if (section.key === "grading") return <GradingSection key={section.key} section={section} {...props} />;
  if (section.key === "summary") return <SummarySection key={section.key} section={section} {...props} />;
  if (section.key === "remarks") return <RemarksSection key={section.key} section={section} {...props} />;
  return null;
}

export function ReceivingSlip({ record, onClose, statusLabel, template = DEFAULT_RECEIVING_SLIP_TEMPLATE }) {
  const resolvedTemplate = resolveReceivingSlipTemplate(template);
  const sectionProps = { record, statusLabel, template: resolvedTemplate };
  return (
    <div className="receiving-slip-backdrop" onClick={onClose}>
      <section className="receiving-slip" onClick={(event) => event.stopPropagation()} aria-label={resolvedTemplate.name}>
        <div className="receiving-slip-toolbar">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /> Print Slip</button>
        </div>
        <div className="receiving-slip-paper" data-template-version={resolvedTemplate.version}>
          <SlipHeader template={resolvedTemplate} />
          <h2>{resolvedTemplate.documentTitle}</h2>
          {resolvedTemplate.sections.map((section) => renderSlipSection(section, sectionProps))}
          <footer>{resolvedTemplate.footerText}</footer>
        </div>
      </section>
    </div>
  );
}

export { SlipField, SlipSection };
