import React, { useEffect, useMemo, useState } from "react";
import "./masters.css";
import "../commercial/customer-details-overrides.css";

const STORAGE_KEY = "rockeye.master.transporters";
const countries = {
  Nigeria: ["Lagos", "Abuja Federal Capital Territory", "Rivers", "Ogun", "Kano", "Delta"],
  Ghana: ["Greater Accra", "Ashanti", "Western"],
  Malaysia: ["Johor", "Selangor", "Perak", "Pahang", "Sabah", "Sarawak"],
};
const paymentTerms = ["Net 15", "Net 30", "Net 45", "Advance", "Due on delivery"];
const sampleTransporters = [
  { id: "TR-MY-001", customerCode: "TR-MY-001", companyName: "Kencana Haulage Sdn. Bhd.", tradingName: "Kencana Haulage", companyType: "External", contactName: "Ahmad Faizal Rahman", primaryNumber: "+60 3 8062 4418", alternativeNumber: "+60 12 688 2041", primaryEmail: "operations@kencanahaulage.my", companyWebsite: "https://www.kencanahaulage.my", address: "Lot 18, Jalan Industri 3, Taman Perindustrian Puchong", country: "Malaysia", state: "Selangor", city: "Puchong", zipCode: "47160", companyRegNo: "201801023456", insurancePolicyNumber: "MSIG-MY-PL-26001", taxNo: "C20876543010", status: "Active", ownerName: "Ahmad Faizal Rahman", ownerPhone: "+60 12 688 2041", ownerEmail: "ahmad.faizal@kencanahaulage.my", ownerDob: "1982-04-18", insuranceBy: "MSIG Insurance (Malaysia) Bhd", insuranceExpiryDate: "2027-08-31", managedBy: "Company Admin", paymentTerms: "Net 30", paymentType: "Contractual", preIdentitySticker: "Yes", billingConfiguration: "Monthly", createdAt: "2026-09-15T08:30:00.000Z" },
  { id: "TR-MY-002", customerCode: "TR-MY-002", companyName: "Southern Palm Logistics Sdn. Bhd.", tradingName: "Southern Palm Logistics", companyType: "External", contactName: "Siti Nur Aisyah", primaryNumber: "+60 7 511 9082", alternativeNumber: "+60 13 770 1822", primaryEmail: "fleet@southernpalm.com.my", companyWebsite: "https://www.southernpalm.com.my", address: "No. 22, Jalan Mutiara Emas 5/7, Taman Mount Austin", country: "Malaysia", state: "Johor", city: "Johor Bahru", zipCode: "81100", companyRegNo: "202001034812", insurancePolicyNumber: "ETIQA-CV-26018", taxNo: "C30218765420", status: "Active", ownerName: "Siti Nur Aisyah", ownerPhone: "+60 13 770 1822", ownerEmail: "siti.aisyah@southernpalm.com.my", ownerDob: "1987-11-06", insuranceBy: "Etiqa General Insurance Berhad", insuranceExpiryDate: "2027-05-14", managedBy: "Company Admin", paymentTerms: "Net 15", paymentType: "Transactional", preIdentitySticker: "No", billingConfiguration: "Per Trip", createdAt: "2026-09-18T09:10:00.000Z" },
  { id: "TR-MY-003", customerCode: "TR-MY-003", companyName: "Perak Bulk Transport Sdn. Bhd.", tradingName: "Perak Bulk Transport", companyType: "External", contactName: "Kumaravel Muthu", primaryNumber: "+60 5 547 2266", alternativeNumber: "+60 16 521 9044", primaryEmail: "admin@perakbulk.com.my", companyWebsite: "https://www.perakbulk.com.my", address: "12, Persiaran Silibin Utara, Kawasan Perindustrian Silibin", country: "Malaysia", state: "Perak", city: "Ipoh", zipCode: "30100", companyRegNo: "201601018904", insurancePolicyNumber: "ALLIANZ-TRK-26027", taxNo: "C10549873260", status: "Active", ownerName: "Kumaravel Muthu", ownerPhone: "+60 16 521 9044", ownerEmail: "kumaravel@perakbulk.com.my", ownerDob: "1979-02-24", insuranceBy: "Allianz General Insurance Company (Malaysia) Berhad", insuranceExpiryDate: "2027-11-02", managedBy: "Sean Shapiro", paymentTerms: "Net 45", paymentType: "Contractual", preIdentitySticker: "Yes", billingConfiguration: "Weekly", createdAt: "2026-09-21T10:20:00.000Z" },
  { id: "TR-MY-004", customerCode: "TR-MY-004", companyName: "Borneo Cargo Movers Sdn. Bhd.", tradingName: "Borneo Cargo Movers", companyType: "External", contactName: "Mohd Hafiz bin Salleh", primaryNumber: "+60 88 437 190", alternativeNumber: "+60 19 882 7310", primaryEmail: "dispatch@borneocargo.com.my", companyWebsite: "https://www.borneocargo.com.my", address: "Block C, Lot 6, Kolombong Industrial Estate, Jalan Tuaran", country: "Malaysia", state: "Sabah", city: "Kota Kinabalu", zipCode: "88450", companyRegNo: "201901029771", insurancePolicyNumber: "TOKIO-MY-CARGO-26034", taxNo: "C90127654380", status: "Suspended", ownerName: "Mohd Hafiz bin Salleh", ownerPhone: "+60 19 882 7310", ownerEmail: "hafiz@borneocargo.com.my", ownerDob: "1985-07-12", insuranceBy: "Tokio Marine Insurans (Malaysia) Berhad", insuranceExpiryDate: "2027-03-20", managedBy: "Company Admin", paymentTerms: "Due on delivery", paymentType: "Transactional", preIdentitySticker: "No", billingConfiguration: "On Request", createdAt: "2026-09-25T07:45:00.000Z" },
  { id: "TR-MY-005", customerCode: "TR-MY-005", companyName: "East Coast Fleet Services Sdn. Bhd.", tradingName: "East Coast Fleet", companyType: "External", contactName: "Nurul Izzati Hassan", primaryNumber: "+60 9 859 7331", alternativeNumber: "+60 17 443 8290", primaryEmail: "transport@eastcoastfleet.my", companyWebsite: "https://www.eastcoastfleet.my", address: "Lot 9, Jalan Gebeng 2/4, Kawasan Perindustrian Gebeng", country: "Malaysia", state: "Johor", city: "Kuantan", zipCode: "26080", companyRegNo: "202201041225", insurancePolicyNumber: "ZURICH-MY-FLT-26042", taxNo: "C20765431890", status: "Active", ownerName: "Nurul Izzati Hassan", ownerPhone: "+60 17 443 8290", ownerEmail: "nurul.izzati@eastcoastfleet.my", ownerDob: "1990-09-30", insuranceBy: "Zurich General Insurance Malaysia Berhad", insuranceExpiryDate: "2028-01-18", managedBy: "Sean Shapiro", paymentTerms: "Net 30", paymentType: "Contractual", preIdentitySticker: "Yes", billingConfiguration: "Bi-Weekly", createdAt: "2026-09-29T14:00:00.000Z" },
];

let activeTransporterForForm = null;

const readRows = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (stored.length) return stored;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTransporters));
    return sampleTransporters;
  } catch { return sampleTransporters; }
};

function Field({ label, required, name, ...props }) {
  return <label className="master-field"><span>{label}{required && <em>*</em>}</span><input name={name} required={required} defaultValue={activeTransporterForForm?.[name] || ""} {...props} /></label>;
}

function TransporterDetails({ transporter, onBack }) {
  const groups = [
    ["Company & Contact Information", [["Code", transporter.customerCode || transporter.id], ["Company Name", transporter.companyName], ["Trading Name", transporter.tradingName], ["Company Type", transporter.companyType], ["Primary Email", transporter.primaryEmail], ["Primary Number", transporter.primaryNumber], ["Alternative Number", transporter.alternativeNumber], ["Contact Name", transporter.contactName], ["Company Website", transporter.companyWebsite]]],
    ["Registered Address", [["Address", transporter.address], ["Country", transporter.country], ["State", transporter.state], ["City", transporter.city], ["Zip Code", transporter.zipCode]]],
    ["Registration, Tax & Insurance", [["Company Reg No", transporter.companyRegNo], ["TAX No", transporter.taxNo], ["Insurance Policy Number", transporter.insurancePolicyNumber], ["Insurance By", transporter.insuranceBy], ["Insurance Expiry Date", transporter.insuranceExpiryDate]]],
    ["Owner Details", [["Owner Name", transporter.ownerName], ["Owner Phone No.", transporter.ownerPhone], ["Owner Email", transporter.ownerEmail], ["Owner DOB", transporter.ownerDob], ["Managed By", transporter.managedBy]]],
    ["Payment & Billing", [["Payment Terms", transporter.paymentTerms], ["Payment Type", transporter.paymentType], ["Pre Identity Sticker", transporter.preIdentitySticker], ["Billing Configuration", transporter.billingConfiguration]]],
  ];
  return <main className="masters-page transporter-master-page"><div className="masters-breadcrumb"><button className="link-button" onClick={onBack}>Transporters</button><b>›</b><strong>Details</strong></div><div className="masters-heading"><div><span className="eyebrow">LOGISTICS / TRANSPORTERS</span><h1>{transporter.tradingName || transporter.companyName}</h1><p>{transporter.companyName} · {transporter.customerCode || transporter.id}</p></div><div className="detail-header-actions"><button className="btn btn-secondary" onClick={onBack}>Back to Listing</button><span className="customer-status">{transporter.status}</span></div></div><div className="transporter-detail-layout">{groups.map(([title, fields]) => <section className="transporter-detail-card" key={title}><h2>{title}</h2><div className="transporter-detail-grid">{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</div></section>)}</div></main>;
}

function TransporterDetailsReference({ transporter, onBack, onEdit }) {
  const [tab, setTab] = useState("Summary");
  const tabs = ["Summary", "Vehicles", "Drivers", "Deliveries", "Activities"];
  const Detail = ({ label, value, accent }) => <div className="customer-detail-item"><span>{label}</span><strong className={accent ? "detail-accent" : ""}>{value || "—"}</strong></div>;
  const Snapshot = ({ label, value, accent }) => <div className="snapshot-row"><span>{label}</span><strong className={accent ? "detail-accent" : ""}>{value}</strong></div>;
  const empty = (title, message) => <div className="customer-reference-collection"><div className="customer-reference-heading"><div><h2>{title}</h2><p>{message}</p></div></div><div className="customer-reference-empty">No {title.toLowerCase()} linked to this transporter yet.</div></div>;

  return <main className="customer-details-page transporter-details-reference">
    <div className="customer-breadcrumb"><button className="link-button" onClick={onBack}>Transporters</button><b>›</b><strong>Details</strong></div>
    <div className="customer-details-heading"><div><div className="customer-title-line"><h1>{transporter.tradingName || transporter.companyName}</h1><span className="customer-code-pill">{transporter.customerCode || transporter.id}</span><span className="customer-status">{transporter.status}</span></div><p>{transporter.companyName} · {transporter.companyType || "External"} · {transporter.country || "Nigeria"}</p></div><div className="customer-detail-actions"><button className="btn btn-primary" onClick={onEdit}>Edit Transporter</button><button className="btn btn-dark" onClick={onBack}>Back to Listing</button></div></div>
    <div className="customer-tabs">{tabs.map((item) => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Summary" && <div className="customer-details-layout"><div className="customer-details-main">
      <section className="customer-detail-card"><div className="customer-detail-card-heading"><h2>1. Company & Contact Information</h2></div><div className="customer-detail-grid"><Detail label="Company Name" value={transporter.companyName} /><Detail label="Trading Name" value={transporter.tradingName} /><Detail label="Code" value={transporter.customerCode || transporter.id} /><Detail label="Company Type" value={transporter.companyType} /><Detail label="Contact Name" value={transporter.contactName} /><Detail label="Primary Number" value={transporter.primaryNumber} /><Detail label="Alternative Number" value={transporter.alternativeNumber} /><Detail label="Email" value={transporter.primaryEmail} accent /><Detail label="Website" value={transporter.companyWebsite} accent /></div></section>
      <section className="customer-detail-card"><div className="customer-detail-card-heading"><h2>2. Registered Address</h2></div><div className="customer-detail-grid"><div className="detail-wide"><Detail label="Address" value={transporter.address} /></div><Detail label="Country" value={transporter.country} /><Detail label="State" value={transporter.state} /><Detail label="City" value={transporter.city} /><Detail label="Zip Code" value={transporter.zipCode} /></div></section>
      <section className="customer-detail-card"><div className="customer-detail-card-heading"><h2>3. Compliance & Insurance</h2></div><div className="customer-detail-grid"><Detail label="Company Reg No" value={transporter.companyRegNo} /><Detail label="TAX No" value={transporter.taxNo} /><Detail label="Insurance Policy Number" value={transporter.insurancePolicyNumber} /><Detail label="Insurance By" value={transporter.insuranceBy} /><Detail label="Insurance Expiry Date" value={transporter.insuranceExpiryDate} /><Detail label="Pre Identity Sticker" value={transporter.preIdentitySticker} /></div></section>
      <section className="customer-detail-card"><div className="customer-detail-card-heading"><h2>4. Owner & Payment Profile</h2></div><div className="customer-detail-grid"><Detail label="Owner Name" value={transporter.ownerName} /><Detail label="Owner Phone No." value={transporter.ownerPhone} /><Detail label="Owner Email" value={transporter.ownerEmail} /><Detail label="Owner DOB" value={transporter.ownerDob} /><Detail label="Payment Terms" value={transporter.paymentTerms} /><Detail label="Payment Type" value={transporter.paymentType} /><Detail label="Billing Configuration" value={transporter.billingConfiguration} /></div></section>
    </div><aside className="customer-details-side"><section className="customer-detail-card"><div className="customer-detail-card-heading"><h2>Quick Transporter Snapshot</h2></div><Snapshot label="Status" value={transporter.status} accent /><Snapshot label="Country" value={transporter.country || "Nigeria"} /><Snapshot label="Active Vehicles" value="0 Registered" /><Snapshot label="Active Drivers" value="0 Registered" /><Snapshot label="Deliveries" value="0 Recorded" /><Snapshot label="Insurance Expiry" value={transporter.insuranceExpiryDate || "—"} /></section><section className="customer-detail-card"><div className="customer-detail-card-heading"><h2>Primary Contact</h2></div><h3 className="primary-contact-name">{transporter.contactName || transporter.ownerName || "No contact recorded"}</h3><p>{transporter.primaryEmail || transporter.ownerEmail || "—"}</p><p>{transporter.primaryNumber || transporter.ownerPhone || "—"}</p></section></aside></div>}
    {tab === "Vehicles" && empty("Vehicles", "Vehicles registered against this transporter")} 
    {tab === "Drivers" && empty("Drivers", "Drivers associated with this transporter")}
    {tab === "Deliveries" && empty("Deliveries", "Inbound and outbound deliveries assigned to this transporter")}
    {tab === "Activities" && empty("Activities", "Audit trail for transporter master data changes")}
  </main>;
}

export function TransporterMaster() {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const states = useMemo(() => countries[country] || [], [country]);

  useEffect(() => setRows(readRows()), []);
  useEffect(() => {
    if (!showForm || !editing) return;
    const form = document.querySelector(".transporter-form");
    if (!form) return;
    Object.entries(editing).forEach(([name, value]) => {
      const field = form.elements[name];
      if (!field || field.type === "file" || value == null) return;
      if (field.length && field[0]?.type === "radio") {
        Array.from(field).forEach((radio) => { radio.checked = radio.value === value; });
      } else {
        field.value = value;
      }
    });
  }, [showForm, editing]);
  const close = () => { setShowForm(false); setEditing(null); setError(""); };
  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const profileImage = form.elements.profileImage.files[0];
    if (!editing && (!profileImage || !["image/jpeg", "image/png"].includes(profileImage.type) || profileImage.size > 2 * 1024 * 1024)) return setError("Profile image must be a JPG or PNG file up to 2MB.");
    const insuranceFile = form.elements.insuranceCopy.files[0];
    if (!editing && (!insuranceFile || !["application/pdf", "image/jpeg", "image/png"].includes(insuranceFile.type) || insuranceFile.size > 5 * 1024 * 1024)) return setError("Insurance copy must be PDF, JPG or PNG up to 5MB.");
    if (data.alternativeNumber && data.alternativeNumber === data.primaryNumber) return setError("Alternative number must differ from the primary number.");
    if (data.address.trim().length < 10) return setError("Address must contain at least 10 characters.");
    if (data.ownerDob && (new Date().getFullYear() - new Date(data.ownerDob).getFullYear() < 18)) return setError("Owner must be at least 18 years old.");
    if (new Date(data.insuranceExpiryDate) <= new Date()) return setError("Insurance expiry date must be in the future.");
    const next = { ...(editing || {}), id: editing?.id || data.customerCode || "TR-" + String(Date.now()).slice(-6), ...data, status: data.status || "Active", createdAt: editing?.createdAt || new Date().toISOString() };
    const updated = editing ? rows.map((row) => row.id === editing.id ? next : row) : [...rows, next];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRows(updated);
    close();
  };

  if (selected) return <TransporterDetailsReference transporter={selected} onBack={() => setSelected(null)} onEdit={() => { setEditing(selected); setCountry(selected.country || "Nigeria"); setState(selected.state || ""); setSelected(null); setShowForm(true); }} />;

  activeTransporterForForm = editing;
  return <main className="masters-page transporter-master-page">
    <div className="masters-breadcrumb"><span>Logistics</span><b>›</b><strong>Transporters</strong></div>
    <div className="masters-heading"><div><h1>Transporters</h1><p>Manage transport service providers, ownership, insurance and billing information.</p></div><button className="btn btn-primary" onClick={() => { setError(""); setShowForm(true); }}>＋ Add Transporter</button></div>
    <section className="panel masters-panel"><div className="masters-toolbar"><strong>Transporter register</strong><span>{rows.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Transporter Name</th><th>Code</th><th>Company Name</th><th>Trading Name</th><th>Primary Email</th><th>Country</th><th>Insurance Expiry</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><button className="table-link" onClick={() => setSelected(row)}>{row.companyName || row.tradingName}</button></td><td>{row.customerCode || row.id}</td><td>{row.companyName}</td><td>{row.tradingName}</td><td>{row.primaryEmail}</td><td>{row.country}</td><td>{row.insuranceExpiryDate}</td><td><span className="customer-status">{row.status}</span></td></tr>)}{!rows.length && <tr><td colSpan="8" className="master-empty">No transporters registered.</td></tr>}</tbody></table></div></section>
    {showForm && <div className="master-modal-backdrop"><form className="master-form transporter-form" onSubmit={submit}>
      <div className="master-form-head"><div><span>LOGISTICS / TRANSPORTERS</span><h2>Add Transporter</h2><p>Register a transport service provider and maintain compliance details.</p></div><button type="button" onClick={close}>×</button></div>
      {error && <div className="master-error">{error}</div>}
      <section className="transporter-form-section"><h3>1. Company & Contact Information</h3><div className="master-form-grid"><Field label="Company Name" name="companyName" required placeholder="Service provider legal name" /><Field label="Code" name="customerCode" placeholder="Auto-generated if blank" /><Field label="Trading Name" name="tradingName" required /><label className="master-field"><span>Company Logo<span className="optional-label"> (Optional)</span></span><input name="companyLogo" type="file" accept=".jpg,.jpeg,.png" /></label><label className="master-field"><span>Type of Company<em>*</em></span><select name="companyType" required><option value="">Select type</option><option>Internal</option><option>External</option></select></label><Field label="Contact Name" name="contactName" pattern="[A-Za-z ]+" /><Field label="Primary Number" name="primaryNumber" required type="tel" /><Field label="Alternative Number" name="alternativeNumber" type="tel" /><Field label="Email" name="primaryEmail" required type="email" /><Field label="Website" name="companyWebsite" type="url" placeholder="https://example.com" /></div></section>
      <section className="transporter-form-section"><h3>2. Registered Address</h3><div className="master-form-grid"><label className="master-field master-field-wide"><span>Address<em>*</em></span><textarea name="address" required minLength="10" rows="3" placeholder="Full registered address" /></label><label className="master-field"><span>Country<em>*</em></span><select name="country" value={country} onChange={(event) => { setCountry(event.target.value); setState(""); }} required>{Object.keys(countries).map((item) => <option key={item}>{item}</option>)}</select></label><label className="master-field"><span>State<em>*</em></span><select name="state" value={state} onChange={(event) => setState(event.target.value)} required><option value="">Select state</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label><Field label="City" name="city" required /><Field label="Zip Code" name="zipCode" pattern="[0-9A-Za-z -]+" /></div></section>
      <section className="transporter-form-section"><h3>3. Additional Information</h3><div className="master-form-grid"><Field label="Company Reg No" name="companyRegNo" required pattern="[A-Za-z0-9 -]+" /><Field label="Insurance Policy Number" name="insurancePolicyNumber" required pattern="[A-Za-z0-9 -]+" /><label className="master-field"><span>Insurance By<em>*</em></span><input name="insuranceBy" required placeholder="Insurer name" list="insurer-list" /><datalist id="insurer-list"><option value="Leadway Assurance" /><option value="AXA Mansard" /><option value="AIICO Insurance" /></datalist></label><Field label="Insurance Expiry Date" name="insuranceExpiryDate" required type="date" /><Field label="TAX No" name="taxNo" required pattern="[A-Za-z0-9 -]+" /><label className="master-field"><span>Status<em>*</em></span><select name="status" defaultValue="Active" required><option>Active</option><option>Inactive</option><option>Suspended</option></select></label><label className="master-field master-field-wide"><span>Insurance Copy<em>*</em></span><input name="insuranceCopy" required type="file" accept=".pdf,.jpg,.jpeg,.png" /></label></div><p className="transporter-help">Insurance copy accepts PDF/JPG/PNG max 5MB.</p></section>
      <section className="transporter-form-section"><h3>4. Owner Details</h3><div className="master-form-grid"><Field label="Owner Name" name="ownerName" required pattern="[A-Za-z ]+" /><Field label="Owner Phone No." name="ownerPhone" required type="tel" /><Field label="Owner Email" name="ownerEmail" required type="email" /><Field label="Owner DOB" name="ownerDob" type="date" /><label className="master-field"><span>Profile Image<em>*</em></span><input name="profileImage" required type="file" accept=".jpg,.jpeg,.png" /></label></div><p className="transporter-help">Profile image must be JPG or PNG up to 2MB.</p></section>
      <section className="transporter-form-section"><h3>6. Payment & Billing Configuration</h3><div className="master-form-grid"><label className="master-field"><span>Payment Terms<em>*</em></span><select name="paymentTerms" required><option value="">Select terms</option>{paymentTerms.map((term) => <option key={term}>{term}</option>)}</select></label><label className="master-field"><span>Payment Type</span><select name="paymentType"><option>Transactional</option><option>Contractual</option></select></label><fieldset className="transporter-radio"><legend>Pre Identity Sticker</legend><label><input type="radio" name="preIdentitySticker" value="No" defaultChecked /> No</label><label><input type="radio" name="preIdentitySticker" value="Yes" /> Yes</label></fieldset><label className="master-field"><span>Billing Configuration</span><select name="billingConfiguration"><option value="">Select billing configuration</option><option>Per Trip</option><option>On Request</option><option>Weekly</option><option>Bi-Weekly</option><option>Monthly</option></select></label></div></section>
      <div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-primary">Save</button></div>
    </form></div>}
  </main>;
}
