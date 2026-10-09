import React, { useState } from "react";
import { RichTextEditor } from "../components/RichTextEditor.jsx";
import "./sales-contract-details.css";

const emptyLine = {
  product: "Crude Palm Oil (CPO - FFA < 4.5%)",
  quantity: "",
  unitPrice: "",
  ffa: "",
  moisture: "",
  dirt: "",
  dobi: "",
  certification: "",
  documents: [],
};
const Section = ({ title, action, children }) => (
  <section className="contract-section">
    <div className="contract-section-heading">
      <h2>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);
const DetailGrid = ({ items }) => (
  <div className="detail-grid">
    {items.map(([label, value]) => (
      <div key={label}>
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>
    ))}
  </div>
);
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <label className="contract-field">
      {label}
      {required && <em>*</em>}
      <input
        type={type}
        required={required}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function SalesContractsPage({ rows, onNew, onSelect }) {
  return (
    <main className="page contracts-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CUSTOMERS</div>
          <h1>Sales Contracts</h1>
          <p>
            Customer agreements, commercial terms and contracted commodities
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          ＋ New Sales Contract
        </button>
      </div>
      <article className="panel full-table">
        <div className="panel-header">
          <div>
            <h2>Sales contract register</h2>
            <p>Live contracts stored in SQLite</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contract Number</th>
                <th>Title</th>
                <th>Customer</th>
                <th>Valid Until</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((contract) => (
                <tr key={contract.id} onClick={() => onSelect(contract)}>
                  <td>
                    <strong>{contract.contract_number}</strong>
                  </td>
                  <td>{contract.title}</td>
                  <td>{contract.customer}</td>
                  <td>{contract.valid_until}</td>
                  <td>
                    {contract.products
                      .reduce(
                        (sum, line) =>
                          sum +
                          Number(line.quantity || 0) *
                            Number(line.unitPrice || 0),
                        0,
                      )
                      .toLocaleString()}{" "}
                    {contract.currency?.slice(0, 3)}
                  </td>
                  <td>
                    <span className="badge success">
                      <span className="badge-dot" />
                      {contract.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="empty-state">
              <strong>No sales contracts found</strong>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}

export function SalesContractForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    contractNumber: "SC-2026-0002",
    title: "",
    contractType: "Master Agreement (Framework)",
    signingDate: "2026-09-30",
    validFrom: "2026-09-30",
    validUntil: "2027-03-30",
    buyerReference: "",
    customer: "Apex Refineries (CUST-2026-001)",
    representative: "",
    email: "",
    phone: "",
    legalAddress: "",
    currency: "USD - US Dollar ($)",
    incoterm: "FOB Dumai Terminal",
    dischargePort: "Dumai Port (IDDUM) — Indonesia",
    paymentMode: "Letter of Credit (LC)",
    bank: "",
    paymentTerms: "",
    products: [{ ...emptyLine }],
    terms: "",
    documents: [],
  });
  const [error, setError] = useState("");
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setLine = (index, key, value) =>
    setForm((current) => ({
      ...current,
      products: current.products.map((line, i) =>
        i === index ? { ...line, [key]: value } : line,
      ),
    }));
  const submit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/sales-contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message);
      return;
    }
    onSaved(payload);
  };
  return (
    <div className="contract-screen">
      <form className="contract-form" onSubmit={submit}>
        <div className="contract-form-heading">
          <div>
            <span className="eyebrow">CUSTOMERS / SALES CONTRACTS</span>
            <h1>New Sales Contract</h1>
            <p>Complete each section to create a structured sales agreement.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
        <Section title="1. Contract Identification & Agreement Details">
          <div className="contract-grid three">
            <Field
              label="Contract Number"
              value={form.contractNumber}
              onChange={(v) => set("contractNumber", v)}
              required
            />
            <Field
              label="Contract Title / Subject"
              value={form.title}
              onChange={(v) => set("title", v)}
              required
            />
            <Select
              label="Contract Type"
              value={form.contractType}
              onChange={(v) => set("contractType", v)}
              options={[
                "Master Agreement (Framework)",
                "Spot Sales Contract",
                "Term Sales Contract",
              ]}
            />
          </div>
          <div className="contract-grid three">
            <Field
              label="Contract Signing Date"
              type="date"
              value={form.signingDate}
              onChange={(v) => set("signingDate", v)}
              required
            />
            <Field
              label="Validity Start Date"
              type="date"
              value={form.validFrom}
              onChange={(v) => set("validFrom", v)}
              required
            />
            <Field
              label="Validity End Date (Delivery Cutoff)"
              type="date"
              value={form.validUntil}
              onChange={(v) => set("validUntil", v)}
              required
            />
          </div>
          <Field
            label="Buyer Reference No / Tender PO Number"
            value={form.buyerReference}
            onChange={(v) => set("buyerReference", v)}
            placeholder="e.g. PO-APEX-DXB-9921 or TENDER-REF-2026-B"
          />
        </Section>
        <Section title="2. Customer & Buyer Information">
          <div className="contract-grid three">
            <Field
              label="Select Customer"
              value={form.customer}
              onChange={(v) => set("customer", v)}
              required
            />
            <Field
              label="Authorized Representative"
              value={form.representative}
              onChange={(v) => set("representative", v)}
            />
            <Field
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
            />
          </div>
          <div className="contract-grid two">
            <Field
              label="Direct Phone"
              value={form.phone}
              onChange={(v) => set("phone", v)}
            />
            <Field
              label="Billing / Legal Address"
              value={form.legalAddress}
              onChange={(v) => set("legalAddress", v)}
            />
          </div>
        </Section>
        <Section title="3. Commercial Terms, Incoterms & Discharge Hub">
          <div className="contract-grid three">
            <Select
              label="Currency"
              value={form.currency}
              onChange={(v) => set("currency", v)}
              options={[
                "USD - US Dollar ($)",
                "MYR - Malaysian Ringgit (RM)",
                "EUR - Euro (€)",
              ]}
              required
            />
            <Select
              label="Incoterm"
              value={form.incoterm}
              onChange={(v) => set("incoterm", v)}
              options={["FOB Dumai Terminal", "CIF", "FCA"]}
              required
            />
            <Field
              label="Discharge / Nearest Port"
              value={form.dischargePort}
              onChange={(v) => set("dischargePort", v)}
            />
          </div>
          <div className="contract-grid two">
            <Field
              label="Payment Mode"
              value={form.paymentMode}
              onChange={(v) => set("paymentMode", v)}
            />
            <Field
              label="Prime Issuing / Advising Bank"
              value={form.bank}
              onChange={(v) => set("bank", v)}
            />
          </div>
          <Field
            label="Payment Terms"
            value={form.paymentTerms}
            onChange={(v) => set("paymentTerms", v)}
          />
        </Section>
        <Section
          title="4. Contracted Commodities & Chemical Specifications"
          action={
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  products: [
                    ...current.products,
                    {
                      ...emptyLine,
                      product: "Palm Kernel (PK - Moisture < 7%)",
                    },
                  ],
                }))
              }
            >
              ＋ Add Product Line
            </button>
          }
        >
          {form.products.map((line, index) => (
            <div className="product-line" key={index}>
              <div className="product-line-heading">
                <strong>
                  <span>{index + 1}</span>Product Allocation & Specification
                  Line
                </strong>
                {form.products.length > 1 && (
                  <button
                    type="button"
                    className="row-more"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        products: current.products.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="contract-grid product-top">
                <Select
                  label="Product / Commodity"
                  value={line.product}
                  onChange={(v) => setLine(index, "product", v)}
                  options={[
                    "Crude Palm Oil (CPO - FFA < 4.5%)",
                    "Palm Kernel (PK - Moisture < 7%)",
                    "RBD Palm Olein",
                  ]}
                />
                <Field
                  label="Contracted Quantity (MT)"
                  type="number"
                  value={line.quantity}
                  onChange={(v) => setLine(index, "quantity", v)}
                  required
                />
                <Field
                  label="Unit Price (USD/MT)"
                  type="number"
                  value={line.unitPrice}
                  onChange={(v) => setLine(index, "unitPrice", v)}
                />
              </div>
              <div className="contract-grid five">
                {[
                  ["ffa", "FFA Max (%)"],
                  ["moisture", "Moisture Max (%)"],
                  ["dirt", "Dirt & Impurities (%)"],
                  ["dobi", "DOBI Min Value"],
                ].map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    value={line[key]}
                    onChange={(v) => setLine(index, key, v)}
                  />
                ))}
                <Field
                  label="Certification (Multi-Select)"
                  value={line.certification}
                  onChange={(v) => setLine(index, "certification", v)}
                  placeholder="RSPO Mass Balance"
                />
              </div>
              <div className="product-docs">
                <strong>⌕ Commodity Specification & Quality Documents</strong>
                <span>
                  Attach COA, Lab Analysis, RSPO Certificate, or MSDS for this
                  commodity
                </span>
                <input type="file" />
              </div>
            </div>
          ))}
        </Section>
        <Section title="5. Terms & Conditions">
          <label className="contract-field">
            <span>Terms & Conditions Clauses</span>
            <RichTextEditor value={form.terms} onChange={(value) => set("terms", value)} placeholder="All physical deliveries under this overarching Sales Contract shall conform to standard PORAM / FOSFA contract rules..." />
          </label>
        </Section>
        <Section title="6. Documents">
          <div className="document-upload">
            <strong>Upload Contract Document</strong>
            <span>Supports PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</span>
            <input type="file" />
          </div>
        </Section>
        <div className="contract-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary">Save Sales Contract</button>
        </div>
      </form>
    </div>
  );
}

function formatActivityDate(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? day + "-" + month + "-" + year : value;
}

function SalesContractActivityTimeline({ contract, documents }) {
  const activities = (contract.activities?.length ? contract.activities : [
    { date: contract.created_at || contract.signing_date, time: "09:00 AM", user: contract.created_by || "System Admin", role: "Commercial User", action: "created this sales contract", detail: "Contract " + contract.contract_number + " was added for " + contract.customer + ".", tone: "created" },
    { date: contract.signing_date, time: "10:30 AM", user: contract.created_by || "System Admin", role: "Commercial User", action: "recorded the agreement signing date", detail: "Agreement terms were recorded with " + (contract.contract_type || "Sales Contract") + " status.", tone: "updated" },
    { date: contract.valid_from, time: "11:00 AM", user: contract.created_by || "System Admin", role: "Commercial User", action: "activated the contract validity period", detail: "Valid from " + formatActivityDate(contract.valid_from) + " to " + formatActivityDate(contract.valid_until) + ".", tone: "status" },
    ...documents.map((document) => ({ date: document.date || contract.created_at || contract.signing_date, time: "11:15 AM", user: contract.created_by || "System Admin", role: "Commercial User", action: "attached a contract document", detail: (document.title || document.file) + " was added to the contract record.", tone: "document" })),
  ]).sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  const grouped = activities.reduce((groups, activity) => {
    const key = activity.date || "unknown";
    groups[key] = groups[key] || [];
    groups[key].push(activity);
    return groups;
  }, {});

  return <div className="sales-contract-activity-panel">
    <div className="sales-contract-activity-toolbar">
      <div><h2>Activities</h2><p>Audit trail for {contract.contract_number}</p></div>
      <div className="sales-contract-activity-filters"><span className="sales-contract-activity-date-range">{formatActivityDate(activities[activities.length - 1]?.date)} - {formatActivityDate(activities[0]?.date)}</span></div>
    </div>
    <div className="sales-contract-activity-timeline">
      {Object.entries(grouped).map(([date, items]) => <section className="sales-contract-activity-day" key={date}>
        <div className="sales-contract-activity-date"><span>{formatActivityDate(date)}</span></div>
        <div className="sales-contract-activity-events">{items.map((activity, index) => <article className="sales-contract-activity-event" key={date + "-" + activity.action + "-" + index}>
          <time>{activity.time || "—"}</time>
          <span className={"sales-contract-activity-marker " + (activity.tone || "updated")} aria-hidden="true"><i /></span>
          <div className="sales-contract-activity-card"><p><strong>{activity.user || "System User"}</strong> <span>({activity.role || "User"})</span> {activity.action}.</p><small>{activity.detail}</small></div>
        </article>)}</div>
      </section>)}
    </div>
  </div>;
}

export function ContractDetails({ contract, onClose }) {
  const [tab, setTab] = useState("Summary");
  const tabs = ["Summary", "Outbound Deliveries", "Sales Invoices", "Documents", "Activities"];
  const products = contract.products || [];
  const documents = contract.documents || [];
  const empty = (message) => message === "No activities recorded"
    ? <SalesContractActivityTimeline contract={contract} documents={documents} />
    : <div className="sales-contract-empty"><strong>{message}</strong><span>Records linked to this contract will appear here.</span></div>;

  return <main className="sales-contract-details-page"><div className="sales-contract-breadcrumb"><span>Customers</span><b>›</b><span>Sales Contracts</span><b>›</b><strong>Details</strong></div><div className="sales-contract-details-heading"><div><div className="sales-contract-title-line"><h1>{contract.title}</h1><span className="sales-contract-code">{contract.contract_number}</span><span className="customer-status">{contract.state}</span></div><p>{contract.customer} · {contract.contract_type || "Sales Contract"} · {contract.currency || "—"}</p></div><div className="sales-contract-detail-actions"><button className="btn btn-secondary" onClick={onClose}>Back to Listing</button></div></div><div className="sales-contract-tabs">{tabs.map((name) => <button key={name} className={tab === name ? "selected" : ""} onClick={() => setTab(name)}>{name}{name === "Documents" && <b>{documents.length}</b>}{name === "Outbound Deliveries" && <b>0</b>}{name === "Sales Invoices" && <b>0</b>}</button>)}</div>{tab === "Summary" && <div className="sales-contract-detail-layout"><div className="sales-contract-main"><section className="sales-contract-card"><h2>1. Contract Identification & Agreement Details</h2><div className="sales-contract-grid">{[["Contract Number", contract.contract_number], ["Contract Title / Subject", contract.title], ["Contract Type", contract.contract_type], ["Contract Signing Date", contract.signing_date], ["Validity Start Date", contract.valid_from], ["Validity End Date", contract.valid_until], ["Buyer Reference", contract.buyer_reference]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</div></section><section className="sales-contract-card"><h2>2. Customer & Buyer Information</h2><div className="sales-contract-grid">{[["Customer", contract.customer], ["Authorized Representative", contract.representative], ["Email Address", contract.email], ["Direct Phone", contract.phone], ["Billing / Legal Address", contract.legal_address]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</div></section><section className="sales-contract-card"><h2>3. Commercial Terms & Discharge</h2><div className="sales-contract-grid">{[["Currency", contract.currency], ["Incoterm", contract.incoterm], ["Discharge / Nearest Port", contract.discharge_port], ["Payment Mode", contract.payment_mode], ["Bank", contract.bank], ["Payment Terms", contract.payment_terms]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</div></section><section className="sales-contract-card"><h2>4. Contracted Commodities & Specifications</h2>{products.length ? products.map((line, index) => <article className="sales-contract-product" key={index}><h3>{index + 1}. {line.product}</h3><div className="sales-contract-grid">{[["Contracted Quantity (MT)", line.quantity], ["Unit Price", line.unitPrice], ["FFA Max (%)", line.ffa], ["Moisture Max (%)", line.moisture], ["Dirt & Impurities (%)", line.dirt], ["DOBI Min Value", line.dobi], ["Certification", line.certification]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</div></article>) : empty("No contracted products recorded.")}</section><section className="sales-contract-card"><h2>5. Terms & Conditions</h2><p className="sales-contract-terms">{contract.terms || "No terms recorded."}</p></section></div><aside className="sales-contract-side"><section className="sales-contract-card"><h2>Quick Contract Snapshot</h2>{[["Customer", contract.customer], ["Contract Type", contract.contract_type], ["Validity", `${contract.valid_from || "—"} — ${contract.valid_until || "—"}`], ["Products", `${products.length} Configured`], ["Documents", `${documents.length} Uploaded`]].map(([label, value]) => <div className="sales-contract-snapshot" key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</section><section className="sales-contract-card"><h2>Contract Status</h2><p className="sales-contract-status-copy">This contract is currently <strong>{contract.state}</strong>.</p><p className="muted">Outbound deliveries and sales invoices will be linked here as the contract is used.</p></section></aside></div>}{tab === "Outbound Deliveries" && <div className="sales-contract-tab-panel">{empty("No outbound deliveries linked")}</div>}{tab === "Sales Invoices" && <div className="sales-contract-tab-panel">{empty("No sales invoices linked")}</div>}{tab === "Documents" && <div className="sales-contract-tab-panel">{documents.length ? documents.map((document) => <article className="sales-contract-record" key={document.file}><strong>{document.title}</strong><span>{document.file} · {document.size}</span></article>) : empty("No documents attached")}</div>}{tab === "Activities" && <div className="sales-contract-tab-panel">{empty("No activities recorded")}</div>}</main>;
}
function Select({ label, value, onChange, options, required = false }) {
  return (
    <label className="contract-field">
      {label}
      {required && <em>*</em>}
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function LegacyContractDetails({ contract, onClose }) {
  return (
    <div className="contract-screen">
      <div className="contract-detail-page">
        <div className="contract-form-heading">
          <div>
            <span className="eyebrow">CUSTOMERS / SALES CONTRACTS</span>
            <h1>{contract.contract_number}</h1>
            <p>{contract.title}</p>
          </div>
          <div className="contract-detail-actions">
            <span className="badge success">
              <span className="badge-dot" />
              {contract.state}
            </span>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <Section title="1. Contract Identification & Agreement Details">
          <DetailGrid
            items={[
              ["Contract Number", contract.contract_number],
              ["Contract Title / Subject", contract.title],
              ["Contract Type", contract.contract_type],
              ["Contract Signing Date", contract.signing_date],
              ["Validity Start Date", contract.valid_from],
              ["Validity End Date", contract.valid_until],
              ["Buyer Reference", contract.buyer_reference],
            ]}
          />
        </Section>
        <Section title="2. Customer & Buyer Information">
          <DetailGrid
            items={[
              ["Customer", contract.customer],
              ["Authorized Representative", contract.representative],
              ["Email Address", contract.email],
              ["Direct Phone", contract.phone],
              ["Billing / Legal Address", contract.legal_address],
            ]}
          />
        </Section>
        <Section title="3. Commercial Terms, Incoterms & Discharge Hub">
          <DetailGrid
            items={[
              ["Currency", contract.currency],
              ["Incoterm", contract.incoterm],
              ["Discharge / Nearest Port", contract.discharge_port],
              ["Payment Mode", contract.payment_mode],
              ["Prime Issuing / Advising Bank", contract.bank],
              ["Payment Terms", contract.payment_terms],
            ]}
          />
        </Section>
        <Section title="4. Contracted Commodities & Chemical Specifications">
          {contract.products.map((line, index) => (
            <div className="product-detail" key={index}>
              <h3>
                {index + 1}. {line.product}
              </h3>
              <DetailGrid
                items={[
                  ["Contracted Quantity (MT)", line.quantity],
                  ["Unit Price", line.unitPrice],
                  ["FFA Max (%)", line.ffa],
                  ["Moisture Max (%)", line.moisture],
                  ["Dirt & Impurities (%)", line.dirt],
                  ["DOBI Min Value", line.dobi],
                  ["Certification", line.certification],
                ]}
              />
            </div>
          ))}
        </Section>
        <Section title="5. Terms & Conditions">
          <p className="contract-terms">
            {contract.terms || "No terms recorded."}
          </p>
        </Section>
        <Section title="6. Documents">
          {contract.documents.length ? (
            contract.documents.map((document) => (
              <div className="document-row" key={document.file}>
                <strong>{document.title}</strong>
                <span>
                  {document.file} · {document.size}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">No documents attached.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
