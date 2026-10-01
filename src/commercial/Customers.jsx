import React, { useState } from "react";
import { ListingActions } from "../components/ListingActions.jsx";

const Section = ({ title, action, children }) => (
  <section className="contract-section">
    <div className="contract-section-heading">
      <h2>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);
const Field = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) => (
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
const Select = ({ label, value, onChange, options, required = false }) => (
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
const emptyContact = {
  type: "Commercial",
  name: "",
  designation: "",
  email: "",
  mobileCode: "+971",
  mobile: "",
};
const emptyAddress = {
  type: "Registered",
  country: "United Arab Emirates",
  state: "Dubai",
  city: "",
  line1: "",
  line2: "",
  nearestPort: "",
};
const emptyProduct = {
  product: "Crude Palm Oil (CPO)",
  pricingMethod: "Fixed Price",
  price: "",
  currency: "USD",
  uom: "MT (Metric Tonne)",
  moq: "",
  deliveryTerm: "Mill Gate (EXW)",
  approved: "Yes",
};

function LegacyCustomersPage({ rows, onNew }) {
  return (
    <main className="page customers-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CUSTOMERS</div>
          <h1>Customers</h1>
          <p>
            Customer master data, contacts, addresses and commercial preferences
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          ＋ Add Customer
        </button>
      </div>
      <article className="panel full-table">
        <div className="panel-header">
          <div>
            <h2>Customer register</h2>
            <p>{rows.length} customer records</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer Code</th>
                <th>Legal Name</th>
                <th>Customer Group</th>
                <th>Origin</th>
                <th>Business Classification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.customer_code}</strong>
                  </td>
                  <td>{row.display_name || row.legal_name}</td>
                  <td>{row.customer_group}</td>
                  <td>{row.customer_origin}</td>
                  <td>{row.business_classification}</td>
                  <td>
                    <span className="badge success">
                      <span className="badge-dot" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}

export function CustomerForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    customerCode: "",
    legalName: "",
    displayName: "",
    customerType: "Company",
    registrationNo: "",
    incorporationDate: "",
    website: "",
    email: "",
    customerOrigin: "Domestic",
    businessClassification: "Refinery",
    customerGroup: "External",
    businessDescription: "",
    contacts: [{ ...emptyContact }, { ...emptyContact }],
    addresses: [{ ...emptyAddress }, { ...emptyAddress, type: "Shipping" }],
    commercial: {
      currency: "USD - US Dollar",
      taxCategory: "Standard",
      paymentTerms: "30 Days",
      paymentMode: "Bank Transfer / TT",
    },
    products: [{ ...emptyProduct }],
    creditApplicable: false,
    documents: [],
  });
  const [error, setError] = useState("");
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setNested = (key, name, value) =>
    setForm((current) => ({
      ...current,
      [key]: { ...current[key], [name]: value },
    }));
  const setArray = (key, index, name, value) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, i) =>
        i === index ? { ...item, [name]: value } : item,
      ),
    }));
  const submit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/customers", {
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
      <form className="contract-form customer-form" onSubmit={submit}>
        <div className="contract-form-heading">
          <div>
            <span className="eyebrow">CUSTOMERS / MASTER DATA</span>
            <h1>Add Customer</h1>
            <p>
              Create customer identity, classification, contacts, addresses and
              commercial settings.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
        <Section title="1. Basic Information">
          <div className="contract-grid two">
            <Field
              label="Customer Code"
              value={form.customerCode}
              onChange={(v) => set("customerCode", v)}
              required
              placeholder="Enter Code"
            />
            <Field
              label="Legal Name"
              value={form.legalName}
              onChange={(v) => set("legalName", v)}
              required
              placeholder="Registered Legal Name"
            />
            <Field
              label="Display Name"
              value={form.displayName}
              onChange={(v) => set("displayName", v)}
              placeholder="Trading / Display Name"
            />
            <Select
              label="Customer Entity Type"
              value={form.customerType}
              onChange={(v) => set("customerType", v)}
              options={["Company", "Government Entity", "Cooperative", "Individual"]}
              required
            />
            <Field
              label="Registration No."
              value={form.registrationNo}
              onChange={(v) => set("registrationNo", v)}
              placeholder="Company Reg. No"
            />
            <Field
              label="Incorporation Date"
              type="date"
              value={form.incorporationDate}
              onChange={(v) => set("incorporationDate", v)}
            />
            <Field
              label="Company Website"
              value={form.website}
              onChange={(v) => set("website", v)}
              placeholder="https://..."
            />
            <Field
              label="Company Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="company@example.com"
            />
            <label className="contract-field">
              Company Logo
              <input type="file" />
            </label>
          </div>
        </Section>
        <Section title="2. Classification">
          <div className="contract-grid two">
            <Select
              label="Customer Origin"
              value={form.customerOrigin}
              onChange={(v) => set("customerOrigin", v)}
              options={["Domestic", "International"]}
              required
            />
            <Select
              label="Business Classification"
              value={form.businessClassification}
              onChange={(v) => set("businessClassification", v)}
              options={[
                "Refinery",
                "Trader",
                "Manufacturer",
                "Distributor",
                "Other",
              ]}
              required
            />
            <Select
              label="Customer Group"
              value={form.customerGroup}
              onChange={(v) => set("customerGroup", v)}
              options={["Internal", "External"]}
              required
            />
          </div>
          <label className="contract-field">
            <span>Business Description</span>
            <textarea
              rows="3"
              value={form.businessDescription}
              onChange={(e) => set("businessDescription", e.target.value)}
              placeholder="Enter business description (optional)..."
            />
          </label>
        </Section>
        <Section
          title="3. Contacts"
          action={
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  contacts: [...current.contacts, { ...emptyContact }],
                }))
              }
            >
              ＋ Add Contact
            </button>
          }
        >
          {form.contacts.map((contact, index) => (
            <div className="customer-repeat" key={index}>
              <div className="repeat-heading">
                <strong>Contact #{index + 1}</strong>
                {form.contacts.length > 1 && (
                  <button
                    type="button"
                    className="row-more"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        contacts: current.contacts.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="contract-grid two">
                <Select
                  label="Contact Type"
                  value={contact.type}
                  onChange={(v) => setArray("contacts", index, "type", v)}
                  options={[
                    "Commercial",
                    "Procurement",
                    "Finance",
                    "Logistics",
                    "Quality",
                    "Management",
                    "Export",
                    "Other",
                  ]}
                  required
                />
                <Field
                  label="Contact Name"
                  value={contact.name}
                  onChange={(v) => setArray("contacts", index, "name", v)}
                  required
                  placeholder="Enter Name"
                />
                <Field
                  label="Designation"
                  value={contact.designation}
                  onChange={(v) =>
                    setArray("contacts", index, "designation", v)
                  }
                  placeholder="Enter Designation"
                />
                <Field
                  label="Email"
                  type="email"
                  value={contact.email}
                  onChange={(v) => setArray("contacts", index, "email", v)}
                  placeholder="Enter Email"
                />
                <label className="contract-field">
                  Mobile Number<em>*</em>
                  <div className="customer-phone-fields">
                    <select value={contact.mobileCode || "+971"} onChange={(e) => setArray("contacts", index, "mobileCode", e.target.value)}>
                      <option value="+971">AE +971</option><option value="+60">MY +60</option><option value="+62">ID +62</option><option value="+1">US +1</option>
                    </select>
                    <input required value={contact.mobile} onChange={(e) => setArray("contacts", index, "mobile", e.target.value)} placeholder="Enter Number" />
                  </div>
                </label>
              </div>
            </div>
          ))}
        </Section>
        <Section
          title="4. Addresses"
          action={
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  addresses: [
                    ...current.addresses,
                    { ...emptyAddress, type: "Shipping" },
                  ],
                }))
              }
            >
              ＋ Add Address
            </button>
          }
        >
          {form.addresses.map((address, index) => (
            <div className="customer-repeat" key={index}>
              <div className="repeat-heading">
                <strong>Address #{index + 1}</strong>
                {form.addresses.length > 1 && (
                  <button
                    type="button"
                    className="row-more"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        addresses: current.addresses.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="contract-grid two">
                <Select
                  label="Address Type"
                  value={address.type}
                  onChange={(v) => setArray("addresses", index, "type", v)}
                  options={["Registered", "Shipping", "Billing", "Other"]}
                  required
                />
                <Select
                  label="Country"
                  value={address.country}
                  onChange={(v) => setArray("addresses", index, "country", v)}
                  options={[
                    "United Arab Emirates",
                    "Malaysia",
                    "Indonesia",
                    "Singapore",
                    "Other",
                  ]}
                  required
                />
                <Field
                  label="Address Line 1"
                  value={address.line1}
                  onChange={(v) => setArray("addresses", index, "line1", v)}
                  required
                  placeholder="Street Address, P.O. Box, Company Name, c/o"
                />
                <Field
                  label="Address Line 2"
                  value={address.line2}
                  onChange={(v) => setArray("addresses", index, "line2", v)}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
                <Field
                  label="State / Province"
                  value={address.state}
                  onChange={(v) => setArray("addresses", index, "state", v)}
                  required
                />
                <Field
                  label="City"
                  value={address.city}
                  onChange={(v) => setArray("addresses", index, "city", v)}
                  required
                  placeholder="Enter City"
                />
              </div>
              {index === form.addresses.length - 1 && (
                <Field
                  label="Nearest Port"
                  value={address.nearestPort}
                  onChange={(v) => setArray("addresses", index, "nearestPort", v)}
                  placeholder="Select Nearest Port / Discharge Hub..."
                />
              )}
            </div>
          ))}
        </Section>
        <Section title="5. Commercial Profile">
          <div className="contract-grid two">
            <Select
              label="Default Currency"
              value={form.commercial.currency}
              onChange={(v) => setNested("commercial", "currency", v)}
              options={[
                "USD - US Dollar",
                "MYR - Malaysian Ringgit",
                "EUR - Euro",
              ]}
              required
            />
            <Select
              label="Tax Category"
              value={form.commercial.taxCategory}
              onChange={(v) => setNested("commercial", "taxCategory", v)}
              options={["Standard", "Zero Rated", "Exempt"]}
            />
            <Select
              label="Payment Terms"
              value={form.commercial.paymentTerms}
              onChange={(v) => setNested("commercial", "paymentTerms", v)}
              options={["30 Days", "60 Days", "90 Days"]}
              required
            />
            <Select
              label="Payment Mode"
              value={form.commercial.paymentMode}
              onChange={(v) => setNested("commercial", "paymentMode", v)}
              options={[
                "Bank Transfer / TT",
                "Letter of Credit (LC)",
                "Cash Against Documents",
              ]}
              required
            />
          </div>
        </Section>
        <Section
          title="6. Preferred Products"
          action={
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  products: [...current.products, { ...emptyProduct }],
                }))
              }
            >
              ＋ Add Product
            </button>
          }
        >
          {form.products.map((product, index) => (
            <div className="customer-repeat" key={index}>
              <div className="repeat-heading">
                <strong>Product #{index + 1}</strong>
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
              <div className="contract-grid two">
                <Select
                  label="Product / Item"
                  value={product.product}
                  onChange={(v) => setArray("products", index, "product", v)}
                  options={[
                    "Crude Palm Oil (CPO)",
                    "Palm Kernel (PK)",
                    "RBD Palm Olein",
                  ]}
                  required
                />
                <Select
                  label="Pricing Method"
                  value={product.pricingMethod}
                  onChange={(v) =>
                    setArray("products", index, "pricingMethod", v)
                  }
                  options={["Fixed Price", "Formula Based"]}
                  required
                />
                <Field
                  label="Customer Specific Price"
                  type="number"
                  value={product.price}
                  onChange={(v) => setArray("products", index, "price", v)}
                  placeholder="0.00"
                />
                <Select
                  label="Sales UOM"
                  value={product.uom}
                  onChange={(v) => setArray("products", index, "uom", v)}
                  options={["MT (Metric Tonne)", "KG (Kilogram)"]}
                  required
                />
                <Field
                  label="Min. Order Quantity (MOQ)"
                  value={product.moq}
                  onChange={(v) => setArray("products", index, "moq", v)}
                  placeholder="e.g. 25"
                />
                <Select
                  label="Default Delivery Term"
                  value={product.deliveryTerm}
                  onChange={(v) =>
                    setArray("products", index, "deliveryTerm", v)
                  }
                  options={["Mill Gate (EXW)", "FOB", "CIF"]}
                />
              </div>
            </div>
          ))}
        </Section>
        <Section title="7. Credit Profile">
          <label className="credit-check">
            <input
              type="checkbox"
              checked={form.creditApplicable}
              onChange={(e) => set("creditApplicable", e.target.checked)}
            />{" "}
            Credit Applicable for this Customer
          </label>
        </Section>
        <Section title="8. Documents">
          <div className="contract-grid two">
            <label className="contract-field">
              Company Registration
              <input type="file" />
            </label>
            <label className="contract-field">
              Tax Certificate
              <input type="file" />
            </label>
            <label className="contract-field">
              Trade License
              <input type="file" />
            </label>
            <label className="contract-field">
              Other Documents
              <input type="file" />
            </label>
          </div>
        </Section>
        <div className="contract-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Discard
          </button>
          <button className="btn btn-primary">Save Customer</button>
        </div>
      </form>
    </div>
  );
}

export function CustomersPage({ rows, onNew, onSelect }) {
  const [search, setSearch] = useState("");
  const filteredRows = rows.filter((row) => `${row.legal_name} ${row.display_name} ${row.customer_code} ${row.customer_group} ${row.email}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <main className="customer-list-page">
      <div className="customer-breadcrumb">
        <span>Customers</span>
        <b>›</b>
        <strong>Listing</strong>
      </div>
      <div className="customer-list-heading">
        <h1>Listing</h1>
        <div className="customer-list-actions">
          <ListingActions search={search} setSearch={setSearch} rows={filteredRows} columns={["legal_name", "customer_code", "customer_group", "customer_origin", "business_classification", "email", "status"]} />
          <button title="Search">⌕</button>
          <button title="Refresh">↻</button>
          <button title="Download">⇩</button>
          <button title="Filter">▽</button>
          <button title="View">◉</button>
          <button className="btn btn-primary" onClick={onNew}>
            ＋
            <span>
              Add
              <br />
              Customer
            </span>
          </button>
        </div>
      </div>
      <article className="panel customer-list-panel">
        <div className="table-wrap">
          <table className="customer-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="Select all customers" />
                </th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>Business Classification</th>
                <th>Group</th>
                <th>Company email</th>
                <th>Primary contact name</th>
                <th>Primary contact Number</th>
                <th>Currency</th>
                <th>Credit Limit (If given)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const contact = row.contacts?.[0] || {};
                const address = row.addresses?.[0] || {};
                const addressText =
                  [address.city, address.country].filter(Boolean).join(", ") ||
                  "—";
                const currency = (row.commercial?.currency || "USD").split(
                  " ",
                )[0];
                const credit = row.commercial?.creditLimit || "—";
                return (
                  <tr key={row.id} onClick={() => onSelect?.(row)}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.legal_name}`}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                    <td className="customer-name-cell">
                      {row.display_name || row.legal_name}
                    </td>
                    <td>{addressText}</td>
                    <td>
                      <span className="classification-pill">
                        {row.business_classification}
                      </span>
                    </td>
                    <td>{row.customer_group}</td>
                    <td>{row.email || "—"}</td>
                    <td>{contact.name || "—"}</td>
                    <td>{contact.mobile || "—"}</td>
                    <td>
                      <strong>{currency}</strong>
                    </td>
                    <td>
                      <strong>{credit}</strong>
                    </td>
                    <td>
                      <span className="customer-status">{row.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="customer-pagination">
          <span>
            View 1 – {rows.length} of {rows.length}
          </span>
          <div>
            <button disabled>‹</button>
            <button className="current">1</button>
            <button disabled>›</button>
          </div>
          <select defaultValue="50">
            <option>50</option>
            <option>100</option>
          </select>
        </div>
      </article>
    </main>
  );
}

export function CustomerDetails({ customer, onBack, onEdit }) {
  const contact = customer.contacts?.[0] || {};
  const address = customer.addresses?.[0] || {};
  const commercial = customer.commercial || {};
  const currency = (commercial.currency || "USD").split(" ")[0];
  return (
    <main className="customer-details-page">
      <div className="customer-breadcrumb">
        <span>Customers</span>
        <b>›</b>
        <strong>Details</strong>
      </div>
      <div className="customer-details-heading">
        <div>
          <div className="customer-title-line">
            <h1>{customer.display_name || customer.legal_name}</h1>
            <span className="customer-code-pill">{customer.customer_code}</span>
            <span className="customer-status">{customer.status}</span>
          </div>
          <p>
            {customer.legal_name} • {customer.business_classification} •{" "}
            {customer.customer_origin}
          </p>
        </div>
        <div className="customer-detail-actions">
          <button className="btn btn-dark" onClick={onBack}>
            Back to Listing
          </button>
          <button className="btn btn-primary" onClick={onEdit}>
            Edit Customer
          </button>
        </div>
      </div>
      <div className="customer-tabs">
        <button className="selected">▥ Summary</button>
        <button>
          ♧ Contacts <b>{customer.contacts?.length || 0}</b>
        </button>
        <button>
          ⌖ Addresses <b>{customer.addresses?.length || 0}</b>
        </button>
        <button>
          ◇ Preferred Products <b>{customer.products?.length || 0}</b>
        </button>
        <button>
          ▣ Transactions <b>1</b>
        </button>
        <button>
          ▤ Documents <b>{customer.documents?.length || 0}</b>
        </button>
      </div>
      <div className="customer-details-layout">
        <div className="customer-details-main">
          <DetailCard title="1. Basic Information">
            <div className="customer-detail-grid">
              <Detail label="Company Legal Name" value={customer.legal_name} />
              <Detail
                label="Display / Trade Name"
                value={customer.display_name}
              />
              <Detail
                label="Registration Number (CR / Reg No)"
                value={customer.registration_no}
              />
              <Detail
                label="Incorporation Date"
                value={customer.incorporation_date}
              />
              <Detail label="Company Email" value={customer.email} accent />
              <Detail label="Company Website" value={customer.website} accent />
            </div>
          </DetailCard>
          <DetailCard title="2. Classification">
            <div className="customer-detail-grid">
              <Detail
                label="Customer Origin"
                value={customer.customer_origin}
                pill
              />
              <Detail
                label="Business Classification"
                value={customer.business_classification}
                pill
                red
              />
              <Detail
                label="Customer Group"
                value={customer.customer_group}
                pill
              />
              <div className="detail-wide">
                <Detail
                  label="Business Description"
                  value={
                    customer.business_description ||
                    "No business description recorded."
                  }
                />
              </div>
            </div>
          </DetailCard>
          <DetailCard title="3. Commercial Profile">
            <div className="customer-detail-grid">
              <Detail label="Default Currency" value={currency} />
              <Detail label="Tax Category" value={commercial.taxCategory} />
              <Detail label="Payment Terms" value={commercial.paymentTerms} />
              <Detail label="Payment Mode" value={commercial.paymentMode} />
            </div>
          </DetailCard>
          <DetailCard
            title="4. Credit Profile"
            action={
              <span className="credit-enabled">
                {customer.credit_applicable
                  ? "Credit Enabled"
                  : "Credit Not Enabled"}
              </span>
            }
          >
            <div className="credit-summary">
              <div>
                <span>APPROVED CREDIT LIMIT</span>
                <strong>{commercial.creditLimit || "—"}</strong>
              </div>
              <div>
                <span>CREDIT UTILIZED</span>
                <strong className="credit-used">
                  {commercial.creditUtilized || "—"}
                </strong>
              </div>
              <div>
                <span>AVAILABLE CREDIT</span>
                <strong className="credit-available">
                  {commercial.creditAvailable || "—"}
                </strong>
              </div>
            </div>
            {customer.credit_applicable && (
              <>
                <div className="credit-progress">
                  <span>Utilization Rate</span>
                  <b>46%</b>
                  <i>
                    <em />
                  </i>
                </div>
                <p className="credit-tenure">
                  ◷ Approved Credit Tenure:{" "}
                  <strong>{commercial.paymentTerms || "30 Days"}</strong>
                </p>
              </>
            )}
          </DetailCard>
        </div>
        <aside className="customer-details-side">
          <DetailCard title="Quick Customer Snapshot">
            <Snapshot label="Registered On" value={customer.created_at} />
            <Snapshot label="Phone Hotline" value={contact.mobile || "—"} />
            <Snapshot
              label="Active Contacts"
              value={`${customer.contacts?.length || 0} Registered`}
              accent
            />
            <Snapshot
              label="Configured Addresses"
              value={`${customer.addresses?.length || 0} Locations`}
            />
            <Snapshot
              label="Preferred Products"
              value={`${customer.products?.length || 0} Products`}
            />
            <Snapshot label="Dispatches & Orders" value="1 Transactions" />
            <Snapshot
              label="Documents Status"
              value={customer.documents?.length ? "Verified" : "Pending"}
              accent
            />
          </DetailCard>
          <DetailCard
            title="PRIMARY CONTACT"
            action={
              <span className="contact-type-pill">
                {contact.type || "Commercial"}
              </span>
            }
          >
            <h3 className="primary-contact-name">
              {contact.name || "No primary contact"}
            </h3>
            <p>{contact.designation || "Primary contact"}</p>
            <p>✉ {contact.email || "—"}</p>
            <p>♧ {contact.mobile || "—"}</p>
          </DetailCard>
        </aside>
      </div>
    </main>
  );
}
function DetailCard({ title, action, children }) {
  return (
    <section className="customer-detail-card">
      <div className="customer-detail-card-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Detail({ label, value, accent = false, pill = false, red = false }) {
  return (
    <div className="customer-detail-item">
      <span>{label}</span>
      <strong
        className={`${accent ? "accent" : ""} ${pill ? "detail-pill" : ""} ${red ? "red" : ""}`}
      >
        {value || "—"}
      </strong>
    </div>
  );
}
function Snapshot({ label, value, accent = false }) {
  return (
    <div className="snapshot-row">
      <span>{label}</span>
      <strong className={accent ? "accent" : ""}>{value}</strong>
    </div>
  );
}

export function CustomerDetailsReference({ customer, onBack, onEdit }) {
  const [tab, setTab] = useState("Summary");
  const contact = customer.contacts?.[0] || {};
  const commercial = customer.commercial || {};
  const tabs = ["Summary", "Contacts", "Addresses", "Preferred Products", "Transactions", "Documents"];
  const count = (name) => name === "Contacts" ? customer.contacts?.length || 0 : name === "Addresses" ? customer.addresses?.length || 0 : name === "Preferred Products" ? customer.products?.length || 0 : name === "Documents" ? customer.documents?.length || 0 : name === "Transactions" ? 1 : "";
  return <main className="customer-details-page">
    <div className="customer-breadcrumb"><span>Customers</span><b>›</b><strong>Details</strong></div>
    <div className="customer-details-heading"><div><div className="customer-title-line"><h1>{customer.display_name || customer.legal_name}</h1><span className="customer-code-pill">{customer.customer_code}</span><span className="customer-status">{customer.status}</span></div><p>{customer.legal_name} • {customer.business_classification} • {customer.customer_origin}</p></div><div className="customer-detail-actions"><button className="btn btn-dark" onClick={onBack}>Back to Listing</button><button className="btn btn-primary" onClick={onEdit}>Edit Customer</button></div></div>
    <div className="customer-tabs">{tabs.map((name) => <button key={name} className={tab === name ? "selected" : ""} onClick={() => setTab(name)}>{name}{count(name) !== "" && <b>{count(name)}</b>}</button>)}</div>
    {tab === "Summary" && <div className="customer-details-layout"><div className="customer-details-main">
      <DetailCard title="1. Basic Information"><div className="customer-detail-grid"><Detail label="Company Legal Name" value={customer.legal_name} /><Detail label="Display / Trade Name" value={customer.display_name} /><Detail label="Registration Number (CR / Reg No)" value={customer.registration_no} /><Detail label="Incorporation Date" value={customer.incorporation_date} /><Detail label="Company Email" value={customer.email} accent /><Detail label="Company Website" value={customer.website} accent /></div></DetailCard>
      <DetailCard title="2. Classification"><div className="customer-detail-grid"><Detail label="Customer Origin" value={customer.customer_origin} pill /><Detail label="Business Classification" value={customer.business_classification} pill red /><Detail label="Customer Group" value={customer.customer_group} pill /><div className="detail-wide"><Detail label="Business Description" value={customer.business_description || "No business description recorded."} /></div></div></DetailCard>
      <DetailCard title="3. Commercial Profile"><div className="customer-detail-grid"><Detail label="Default Currency" value={(commercial.currency || "USD").split(" ")[0]} /><Detail label="Tax Category" value={commercial.taxCategory} /><Detail label="Payment Terms" value={commercial.paymentTerms} /><Detail label="Payment Mode" value={commercial.paymentMode} /></div></DetailCard>
      <DetailCard title="4. Credit Profile" action={<span className="credit-enabled">{customer.credit_applicable ? "Credit Enabled" : "Credit Not Enabled"}</span>}><div className="credit-summary"><div><span>APPROVED CREDIT LIMIT</span><strong>{commercial.creditLimit || "—"}</strong></div><div><span>CREDIT UTILIZED</span><strong className="credit-used">{commercial.creditUtilized || "—"}</strong></div><div><span>AVAILABLE CREDIT</span><strong className="credit-available">{commercial.creditAvailable || "—"}</strong></div></div>{customer.credit_applicable && <div className="credit-progress"><span>Utilization Rate</span><b>46%</b><i><em /></i></div>}</DetailCard>
    </div><aside className="customer-details-side"><DetailCard title="Quick Customer Snapshot"><Snapshot label="Registered On" value={customer.created_at || "—"} /><Snapshot label="Phone Hotline" value={contact.mobile || "—"} /><Snapshot label="Active Contacts" value={`${customer.contacts?.length || 0} Registered`} accent /><Snapshot label="Configured Addresses" value={`${customer.addresses?.length || 0} Locations`} /><Snapshot label="Preferred Products" value={`${customer.products?.length || 0} Products`} /><Snapshot label="Dispatches & Orders" value="1 Transactions" /><Snapshot label="Documents Status" value={customer.documents?.length ? "Verified" : "Pending"} accent /></DetailCard><DetailCard title="PRIMARY CONTACT" action={<span className="contact-type-pill">{contact.type || "Commercial"}</span>}><h3 className="primary-contact-name">{contact.name || "No primary contact"}</h3><p>{contact.designation || "Primary contact"}</p><p>✉ {contact.email || "—"}</p><p>☎ {contact.mobileCode || ""} {contact.mobile || "—"}</p></DetailCard></aside></div>}
    {tab === "Contacts" && <ReferenceCollection title="Authorized Customer Contacts" items={customer.contacts || []} empty="No contacts found for this customer." render={(item) => <><span>{item.type || "Commercial"}</span><h3>{item.name || "Unnamed contact"}</h3><p>{item.designation || "Representative"}</p><p>{item.email || "—"}</p><p>{item.mobileCode || ""} {item.mobile || "—"}</p></>} />}
    {tab === "Addresses" && <ReferenceCollection title="Registered & Operational Addresses" items={customer.addresses || []} empty="No addresses configured for this customer." render={(item) => <><span>{item.type || "Registered"}</span><h3>{item.city || "Address"}</h3><p>{item.line1 || "—"}</p><p>{item.city}{item.state ? `, ${item.state}` : ""}, {item.country}</p>{item.nearestPort && <p className="collection-accent">Nearest Port: {item.nearestPort}</p>}</>} />}
    {tab === "Preferred Products" && <ReferenceCollection title="Product Mappings & Specific Pricing" items={customer.products || []} empty="No preferred products configured." render={(item) => <><span>{item.pricingMethod || "Fixed Price"}</span><h3>{item.product}</h3><p>{item.currency || "USD"} {item.price || item.unitPrice || "0.00"}</p><p>{item.uom || "MT (Metric Tonne)"} • {item.deliveryTerm || "Mill Gate (EXW)"}</p></>} />}
    {tab === "Transactions" && <ReferenceCollection title="Sales Contracts, Dispatches & Invoices" items={[]} empty="No transactions found for this customer." render={() => null} />}
    {tab === "Documents" && <ReferenceCollection title="Compliance & Legal Documents" items={customer.documents || []} empty="No documents uploaded for this customer." render={(item) => <><span>{item.type || "Document"}</span><h3>{item.name || item.fileName || "Uploaded document"}</h3><p>{item.fileName || "File available"}</p><p>{item.status || "Pending"}</p></>} />}
  </main>;
}

function ReferenceCollection({ title, items, empty, render }) {
  return <div className="customer-reference-collection"><div className="customer-reference-heading"><div><h2>{title}</h2><p>Customer master information and configured records</p></div><strong>{items.length} Records</strong></div>{items.length ? <div className="customer-reference-grid">{items.map((item, index) => <article key={index}>{render(item)}</article>)}</div> : <p className="customer-reference-empty">{empty}</p>}</div>;
}
