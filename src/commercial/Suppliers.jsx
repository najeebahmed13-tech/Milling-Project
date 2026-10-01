import React, { useState } from "react";
import "./commercial.css";
import "./supplier-details-overrides.css";
import { ListingActions } from "../components/ListingActions.jsx";

const Building2 = ({ className = "w-4 h-4 mr-2" }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

const Plus = ({ className = "w-3 h-3 mr-1" }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Trash2 = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const Breadcrumb = ({ items = [] }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#6B7280", marginBottom: "14px" }}>
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && <span style={{ color: "#9CA3AF" }}>›</span>}
        <span style={{ fontWeight: idx === items.length - 1 ? 600 : 400, color: idx === items.length - 1 ? "#111827" : "#6B7280" }}>
          {item.label}
        </span>
      </React.Fragment>
    ))}
  </div>
);

const SectionHeader = ({ title, action }) => (
  <div className="supplier-form-section-heading">
    <h2>{title}</h2>
    {action && <div>{action}</div>}
  </div>
);

const COUNTRY_STATES = {
  Indonesia: [
    "Riau", "North Sumatra", "West Sumatra", "Jambi", "South Sumatra", "Bengkulu", "Lampung",
    "West Kalimantan", "Central Kalimantan", "South Kalimantan", "East Kalimantan", "North Kalimantan",
    "Aceh", "DKI Jakarta", "West Java", "Central Java", "East Java"
  ],
  Malaysia: [
    "Johor", "Pahang", "Perak", "Sabah", "Sarawak", "Selangor", "Kedah", "Kelantan", "Melaka",
    "Negeri Sembilan", "Penang", "Perlis", "Terengganu", "Kuala Lumpur", "Labuan"
  ],
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al-Quwain"],
  Singapore: ["Central Community", "North East Community", "North West Community", "South East Community"],
  India: ["Andhra Pradesh", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Delhi"],
};

const DEFAULT_DELIVERY_TERMS = [
  "Delivered to Mill (DAP)",
  "Ex-Estate / Farmgate (EXW)",
  "FOB Port Terminal",
  "CIF Port",
];

function configuredDeliveryTerms() {
  try {
    const stored = localStorage.getItem("rockeye.master.deliveryTerms");
    const records = stored ? JSON.parse(stored) : [];
    const active = records.filter((record) => record.active !== false && record.name);
    return active.length ? active.map((record) => record.name) : DEFAULT_DELIVERY_TERMS;
  } catch {
    return DEFAULT_DELIVERY_TERMS;
  }
}

export function SupplierForm({ onClose, onSaved, items = [] }) {
  const [formData, setFormData] = useState({
    // 1. Basic Info
    supplierCode: `SUP-2026-${Math.floor(100 + Math.random() * 900)}`,
    name: "",
    displayName: "",
    supplierType: "",
    registrationNo: "",
    incorporationDate: "",
    companyEmail: "",
    phone: "",
    companyWebsite: "",
    group: "External",

    // 2. Classification & Sustainability
    category: "",
    sustainabilityCert: "RSPO Certified (Identity Preserved)",
    businessDescription: "",

    // 6. Commercial & Banking
    currency: "MYR",
    paymentTerms: "30 Days",
    paymentMode: "Bank Transfer",
    bankName: "",
    bankAccountNo: "",
    taxRegistrationNo: "",

  });

  const [contacts, setContacts] = useState([
    {
      id: "1",
      type: "Procurement / Dispatch",
      name: "",
      designation: "",
      email: "",
      mobileCode: "+60",
      mobile: "",
      isPrimary: true,
    },
  ]);

  const [addresses, setAddresses] = useState([
    {
      id: "1",
      type: "Plantation Estate Site",
      line1: "",
      line2: "",
      country: "Malaysia",
      state: "Johor",
      city: "",
      isDefault: true,
    },
  ]);

  const [supplyItems, setSupplyItems] = useState([
    {
      id: "1",
      item: "",
      supplyCapacity: "2,500 MT / Month",
      deliveryTerm: "Delivered to Mill (DAP)",
      currency: "MYR",
    },
  ]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sustainabilityDocument, setSustainabilityDocument] = useState(null);
  const deliveryTerms = configuredDeliveryTerms();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? e.target.checked : value;
    if (name === "sustainabilityCert" && value === "Non-certified") setSustainabilityDocument(null);
    if (name === "category" && !value.startsWith("FFB Supplier")) {
      setSustainabilityDocument(null);
      setFormData((prev) => ({ ...prev, [name]: val, supplierType: "", sustainabilityCert: "Non-certified" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  // Contacts handlers
  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "General",
        name: "",
        designation: "",
        email: "",
        mobileCode: "+60",
        mobile: "",
        isPrimary: false,
      },
    ]);
  };

  const handleRemoveContact = (id) => {
    if (contacts.length === 1) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleContactChange = (id, field, value) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value };
        }
        if (field === "isPrimary" && value === true) {
          return { ...c, isPrimary: false };
        }
        return c;
      })
    );
  };

  // Addresses handlers
  const handleAddAddress = () => {
    setAddresses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "Depot / Warehouse",
        line1: "",
        line2: "",
        country: "Malaysia",
        state: "Johor",
        city: "",
        isDefault: false,
      },
    ]);
  };

  const handleRemoveAddress = (id) => {
    if (addresses.length === 1) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddressChange = (id, field, value) => {
    setAddresses((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          if (field === "country") {
            updated.state = COUNTRY_STATES[value]?.[0] || "";
          }
          return updated;
        }
        if (field === "isDefault" && value === true) {
          return { ...a, isDefault: false };
        }
        return a;
      })
    );
  };

  // Supply Items handlers
  const handleAddSupplyItem = () => {
    setSupplyItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        item: "",
        supplyCapacity: "",
        deliveryTerm: deliveryTerms[0] || DEFAULT_DELIVERY_TERMS[0],
        currency: formData.currency,
      },
    ]);
  };

  const handleRemoveSupplyItem = (id) => {
    if (supplyItems.length === 1) return;
    setSupplyItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSupplyItemChange = (id, field, value) => {
    setSupplyItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

    const newSupplier = {
      id: `s-${Date.now()}`,
      supplierCode: formData.supplierCode,
      vendorCode: formData.supplierCode,
      name: formData.name || "New Supplier Entity",
      displayName: formData.displayName || formData.name,
      category: formData.category,
      supplierType: formData.supplierType,
      vendorType: formData.supplierType,
      group: formData.group,
      registrationNo: formData.registrationNo,
      incorporationDate: formData.incorporationDate,
      companyEmail: formData.companyEmail || primaryContact?.email || "",
      phone: `${primaryContact?.mobileCode || "+60"} ${primaryContact?.mobile || formData.phone}`.trim(),
      companyWebsite: formData.companyWebsite,
      sustainabilityCert: formData.sustainabilityCert,
      city: defaultAddress?.city || "Johor",
      country: defaultAddress?.country || "Malaysia",
      paymentTerms: formData.paymentTerms,
      paymentMode: formData.paymentMode,
      currency: formData.currency,
      bankName: formData.bankName,
      bankAccountNo: formData.bankAccountNo,
      taxRegistrationNo: formData.taxRegistrationNo,
      status: "Active",
      registeredOn: new Date().toISOString().split("T")[0],
      contacts,
      addresses,
      supplyItems,
      documents: sustainabilityDocument ? [{ type: "Sustainability Certificate", name: sustainabilityDocument.name, fileType: sustainabilityDocument.type, size: sustainabilityDocument.size }] : [],
    };

    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || "Unable to save supplier.");
        setSaving(false);
        return;
      }
      if (onSaved) {
        onSaved(payload);
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Network error saving supplier.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="supplier-add-screen">
      <div className="supplier-add-container">
        <Breadcrumb items={[{ label: "Suppliers" }, { label: "Listing" }, { label: "Add Supplier" }]} />

        <div className="supplier-form-header">
          <div>
            <h1>
              <span className="supplier-form-title-icon">
                <Building2 />
              </span>
              Add Supplier
            </h1>
            <p>
              Register new FFB supplier, estate cooperative, CPO transporter, or mill contractor
            </p>
          </div>

        </div>

        {error && (
          <div className="form-error supplier-form-error">
            <span>Error:</span> {error}
          </div>
        )}

        <div className="supplier-form-card">
          <form id="supplier-add-form" onSubmit={handleSubmit}>
            {/* SECTION 1: BASIC INFORMATION */}
            <SectionHeader title="1. Basic Information" />
            <div className="supplier-grid-3">
              <div>
                <label className="form-label">
                  Supplier Code <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="supplierCode"
                  required
                  className="form-input bg-gray-50"
                  style={{ fontFamily: "monospace" }}
                  value={formData.supplierCode}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2">
                <label className="form-label">
                  Supplier Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="form-input"
                  placeholder="e.g. Sawit Makmur Plantation Koperasi"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Trade Name</label>
                <input
                  type="text"
                  name="displayName"
                  className="form-input"
                  placeholder="e.g. Sawit Makmur Estate"
                  value={formData.displayName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">
                  Registration No.
                </label>
                <input
                  type="text"
                  name="registrationNo"
                  className="form-input"
                  placeholder="e.g. 199801023941 or NIB-992384"
                  value={formData.registrationNo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Incorporation Date</label>
                <input
                  type="date"
                  name="incorporationDate"
                  className="form-input"
                  value={formData.incorporationDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">
                  Company Email
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  className="form-input"
                  placeholder="procurement@supplier.com"
                  value={formData.companyEmail}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Company Contact Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="+60 12 345 6789"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Company Website</label>
                <input
                  type="url"
                  name="companyWebsite"
                  className="form-input"
                  placeholder="https://..."
                  value={formData.companyWebsite}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* SECTION 2: PROCUREMENT CLASSIFICATION & SUSTAINABILITY */}
            <SectionHeader title="2. Classification & Sustainability" />
            <div className="supplier-grid-3">
              <div>
                <label className="form-label">
                  Primary Supplier Category <span className="req">*</span>
                </label>
                <select name="category" className="form-input" required value={formData.category} onChange={handleChange}>
                  <option value="">Select primary supplier category...</option>
                  <option value="FFB Supplier (Estate)">FFB Supplier (Commercial Estate)</option>
                  <option value="FFB Supplier (Smallholder / Koperasi)">FFB Supplier (Smallholder / Koperasi)</option>
                  <option value="FFB Supplier (Dealer)">FFB Supplier (Dealer)</option>
                  <option value="Logistics & Transport (CPO/PK Tankers)">Logistics & Transport (CPO/PK Tankers)</option>
                  <option value="Mill Machinery & Spare Parts">Mill Machinery & Spare Parts</option>
                  <option value="Chemicals & Water Treatment">Chemicals & Water Treatment</option>
                  <option value="Fuel & Biomass Services">Fuel & Biomass Services</option>
                  <option value="Weighbridge & Calibration Services">Weighbridge & Calibration Services</option>
                  <option value="Civil & Mill Maintenance">Civil & Mill Maintenance</option>
                </select>
              </div>
              {formData.category.startsWith("FFB Supplier") && <div>
                <label className="form-label">Supplier Type <small>(Optional)</small></label>
                <select name="supplierType" className="form-input" value={formData.supplierType} onChange={handleChange}>
                  <option value="">Select supplier type...</option>
                  <option value="Company">Company / Corporate Entity</option>
                  <option value="Cooperative">Plantation Cooperative (Koperasi)</option>
                  <option value="Individual">Individual Smallholder (Pekebun Kecil)</option>
                </select>
              </div>}
              <div>
                <label className="form-label">
                  Supplier Group <span className="req">*</span>
                </label>
                <select name="group" className="form-input" value={formData.group} onChange={handleChange}>
                  <option value="External">External Supplier</option>
                  <option value="Internal">Internal / Own Mill Group</option>
                  <option value="Cooperative">Smallholder Cooperative Scheme</option>
                  <option value="Intercompany">Intercompany</option>
                </select>
              </div>
              {formData.category.startsWith("FFB Supplier") && <div>
                <label className="form-label">Sustainability Certification</label>
                <select name="sustainabilityCert" className="form-input" value={formData.sustainabilityCert} onChange={handleChange}>
                  <option value="RSPO Certified (Identity Preserved)">RSPO Certified (Identity Preserved)</option>
                  <option value="RSPO Certified (Mass Balance)">RSPO Certified (Mass Balance)</option>
                  <option value="MSPO Certified">MSPO Supply Chain Certified</option>
                  <option value="ISCC EU Certified">ISCC EU Certified</option>
                  <option value="Non-certified">Non-certified / Conventional</option>
                </select>
              </div>}

              <div className="col-span-3">
                <label className="form-label">Description</label>
                <textarea
                  name="businessDescription"
                  rows={2}
                  className="form-input"
                  placeholder="Brief summary of harvesting acreage, tanker capacity, or technical capabilities..."
                  value={formData.businessDescription}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* SECTION 3: CONTACT PERSONS */}
            <SectionHeader
              title="3. Contact Person(s)"
              action={
                <button
                  type="button"
                  onClick={handleAddContact}
                  style={{ background: "none", border: "none", color: "#c51d2c", fontSize: "11.5px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <Plus /> Add Contact
                </button>
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {contacts.map((contact, index) => (
                <div key={contact.id} style={{ border: "1px solid #E2E2E2", borderRadius: "4px", padding: "12px", background: "#FDFDFD" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Contact #{index + 1}</span>
                      <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", color: "#4B5563", fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={contact.isPrimary}
                          onChange={(e) => handleContactChange(contact.id, "isPrimary", e.target.checked)}
                          style={{ accentColor: "#c51d2c", width: "14px", height: "14px" }}
                        />
                        <span>Primary Contact</span>
                      </label>
                    </div>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: "2px" }}
                        title="Remove Contact"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>

                  <div className="supplier-grid-4">
                    <div>
                      <label className="form-label">Department</label>
                      <select
                        className="form-input"
                        value={contact.type}
                        onChange={(e) => handleContactChange(contact.id, "type", e.target.value)}
                      >
                        <option value="Procurement / Dispatch">Procurement / Dispatch</option>
                        <option value="Estate Manager">Estate Manager / Harvester</option>
                        <option value="Logistics / Fleet Manager">Logistics / Fleet Manager</option>
                        <option value="Finance / Billing">Finance / Billing</option>
                        <option value="Executive / Owner">Executive / Owner</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">
                        Full Name <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Full Name"
                        value={contact.name}
                        onChange={(e) => handleContactChange(contact.id, "name", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Operations Manager"
                        value={contact.designation}
                        onChange={(e) => handleContactChange(contact.id, "designation", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Email Address <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="contact@supplier.com"
                        value={contact.email}
                        onChange={(e) => handleContactChange(contact.id, "email", e.target.value)}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="form-label">
                        Mobile Number <span className="req">*</span>
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <select
                          className="form-input"
                          style={{ width: "95px", flexShrink: 0 }}
                          value={contact.mobileCode}
                          onChange={(e) => handleContactChange(contact.id, "mobileCode", e.target.value)}
                        >
                          <option value="+60">+60 (MY)</option>
                          <option value="+62">+62 (ID)</option>
                          <option value="+971">+971 (AE)</option>
                          <option value="+65">+65 (SG)</option>
                          <option value="+91">+91 (IN)</option>
                        </select>
                        <input
                          type="tel"
                          required
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder="12 345 6789"
                          value={contact.mobile}
                          onChange={(e) => handleContactChange(contact.id, "mobile", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 4: OPERATIONAL LOCATIONS & ADDRESSES */}
            <SectionHeader
              title="4. Location & Address"
              action={
                <button
                  type="button"
                  onClick={handleAddAddress}
                  style={{ background: "none", border: "none", color: "#c51d2c", fontSize: "11.5px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <Plus /> Add Address
                </button>
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {addresses.map((address, index) => (
                <div key={address.id} style={{ border: "1px solid #E2E2E2", borderRadius: "4px", padding: "12px", background: "#FDFDFD" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Location #{index + 1}</span>
                      <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", color: "#4B5563", fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={address.isDefault}
                          onChange={(e) => handleAddressChange(address.id, "isDefault", e.target.checked)}
                          style={{ accentColor: "#c51d2c", width: "14px", height: "14px" }}
                        />
                        <span>Default Location</span>
                      </label>
                    </div>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(address.id)}
                        style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: "2px" }}
                        title="Remove Location"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>

                  <div className="supplier-grid-4">
                    <div>
                      <label className="form-label">Address Type</label>
                      <select
                        className="form-input"
                        value={address.type}
                        onChange={(e) => handleAddressChange(address.id, "type", e.target.value)}
                      >
                        <option value="Plantation Estate Site">Plantation Estate Site</option>
                        <option value="Depot / Warehouse">Depot / Warehouse / Garage</option>
                        <option value="Registered Office">Registered Corporate Office</option>
                        <option value="Billing Address">Billing Address</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="form-label">
                        Address Line 1 <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Street / Estate Division / KM Marker"
                        value={address.line1}
                        onChange={(e) => handleAddressChange(address.id, "line1", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Country <span className="req">*</span>
                      </label>
                      <select
                        className="form-input"
                        value={address.country}
                        onChange={(e) => handleAddressChange(address.id, "country", e.target.value)}
                      >
                        <option value="Malaysia">Malaysia</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Singapore">Singapore</option>
                        <option value="India">India</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">
                        State / Province <span className="req">*</span>
                      </label>
                      <select
                        className="form-input"
                        value={address.state}
                        onChange={(e) => handleAddressChange(address.id, "state", e.target.value)}
                      >
                        {(COUNTRY_STATES[address.country] || []).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">
                        City / District <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Pekanbaru or Pasir Gudang"
                        value={address.city}
                        onChange={(e) => handleAddressChange(address.id, "city", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 5: SUPPLY CAPABILITIES & COMMODITIES */}
            <SectionHeader
              title="5. Supply Item(s)"
              action={
                <button
                  type="button"
                  onClick={handleAddSupplyItem}
                  style={{ background: "none", border: "none", color: "#c51d2c", fontSize: "11.5px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <Plus /> Add Supply Item
                </button>
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {supplyItems.map((item, index) => (
                <div key={item.id} style={{ border: "1px solid #E2E2E2", borderRadius: "4px", padding: "12px", background: "#FDFDFD" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Commodity / Item #{index + 1}</span>
                    {supplyItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSupplyItem(item.id)}
                        style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: "2px" }}
                        title="Remove Item"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>

                  <div className="supplier-grid-3">
                    <div>
                      <label className="form-label">
                        Item <span className="req">*</span>
                      </label>
                      <select required className="form-input" value={item.item} onChange={(e) => handleSupplyItemChange(item.id, "item", e.target.value)}>
                        <option value="">Select item from Item Master...</option>
                        {items.filter((masterItem) => masterItem.status === "Active").map((masterItem) => <option key={masterItem.id} value={masterItem.name}>{masterItem.item_code} · {masterItem.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Estimated Monthly Supply Capacity</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 3,000 MT / Month or 80 Trips / Month"
                        value={item.supplyCapacity}
                        onChange={(e) => handleSupplyItemChange(item.id, "supplyCapacity", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Delivery Term</label>
                      <select
                        className="form-input"
                        value={item.deliveryTerm}
                        onChange={(e) => handleSupplyItemChange(item.id, "deliveryTerm", e.target.value)}
                      >
                        {deliveryTerms.map((term) => <option key={term} value={term}>{term}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 6: COMMERCIAL & BANKING PROFILE */}
            <SectionHeader title="6. Commercial & Banking Profile" />
            <div className="supplier-grid-3">
              <div>
                <label className="form-label">
                  Default Currency <span className="req">*</span>
                </label>
                <select name="currency" className="form-input" value={formData.currency} onChange={handleChange}>
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Payment Terms <span className="req">*</span>
                </label>
                <select name="paymentTerms" className="form-input" value={formData.paymentTerms} onChange={handleChange}>
                  <option value="Immediate / Cash">Immediate / Cash upon Weighment</option>
                  <option value="Weekly Cash">Weekly Settlement</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="45 Days">45 Days</option>
                  <option value="60 Days">60 Days</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Payment Mode <span className="req">*</span>
                </label>
                <select name="paymentMode" className="form-input" value={formData.paymentMode} onChange={handleChange}>
                  <option value="Bank Transfer">Direct Bank Wire / GIRO</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Letter of Credit">Letter of Credit (LC)</option>
                  <option value="Cash">Cash on Delivery</option>
                </select>
              </div>

              <div>
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  className="form-input"
                  placeholder="e.g. Maybank or Bank Mandiri"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Bank Account No. / IBAN</label>
                <input
                  type="text"
                  name="bankAccountNo"
                  className="form-input"
                  style={{ fontFamily: "monospace" }}
                  placeholder="e.g. 5510-8910-2391"
                  value={formData.bankAccountNo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Tax ID (NPWP / TRN / SST)</label>
                <input
                  type="text"
                  name="taxRegistrationNo"
                  className="form-input"
                  style={{ fontFamily: "monospace" }}
                  placeholder="e.g. NPWP-01.892.441.0"
                  value={formData.taxRegistrationNo}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* SECTION 7: DOCUMENTS & COMPLIANCE */}
            <SectionHeader title="7. Compliance Documents" />
            <div className="supplier-grid-2">
              <div>
                <label className="form-label">Business Registration Certificate (SSM / NIB)</label>
                <div style={{ position: "relative", height: "32px" }}>
                  <input type="file" style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 10 }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #D1D5DB", borderRadius: "4px", padding: "0 10px", background: "#fff", pointerEvents: "none" }}>
                    <span style={{ color: "#9CA3AF", fontSize: "11px" }}>Choose file...</span>
                    <span style={{ fontSize: "11px", color: "#374151", fontWeight: 500, background: "#F3F4F6", padding: "2px 8px", borderRadius: "3px", border: "1px solid #E5E7EB" }}>Browse</span>
                  </div>
                </div>
              </div>

              {formData.category.startsWith("FFB Supplier") && formData.sustainabilityCert !== "Non-certified" ? <div>
                <label className="form-label">{formData.sustainabilityCert} Document</label>
                <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setSustainabilityDocument(event.target.files?.[0] || null)} />
              </div> : <div className="supplier-document-note">No sustainability document is required for a non-certified supplier.</div>}

              <div>
                <label className="form-label">Tax ID Proof (NPWP / TRN / VAT)</label>
                <div style={{ position: "relative", height: "32px" }}>
                  <input type="file" style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 10 }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #D1D5DB", borderRadius: "4px", padding: "0 10px", background: "#fff", pointerEvents: "none" }}>
                    <span style={{ color: "#9CA3AF", fontSize: "11px" }}>Choose file...</span>
                    <span style={{ fontSize: "11px", color: "#374151", fontWeight: 500, background: "#F3F4F6", padding: "2px 8px", borderRadius: "3px", border: "1px solid #E5E7EB" }}>Browse</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Bank Account Verification Letter</label>
                <div style={{ position: "relative", height: "32px" }}>
                  <input type="file" style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 10 }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #D1D5DB", borderRadius: "4px", padding: "0 10px", background: "#fff", pointerEvents: "none" }}>
                    <span style={{ color: "#9CA3AF", fontSize: "11px" }}>Choose file...</span>
                    <span style={{ fontSize: "11px", color: "#374151", fontWeight: 500, background: "#F3F4F6", padding: "2px 8px", borderRadius: "3px", border: "1px solid #E5E7EB" }}>Browse</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E2E2E2" }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ width: "145px" }}>
                {saving ? "Saving..." : "Save Supplier"}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary" style={{ width: "145px" }}>
                Discard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { SupplierForm as SupplierAdd };

const DetailSection = ({ title, children }) => (
  <section className="supplier-detail-section">
    <h2>{title}</h2>
    <div className="supplier-detail-grid">{children}</div>
  </section>
);

const DetailValue = ({ label, value, wide }) => (
  <div className={wide ? "supplier-detail-value wide" : "supplier-detail-value"}>
    <span>{label}</span>
    <strong>{value || "-"}</strong>
  </div>
);

export function SupplierDetails({ supplier, onBack, onEdit }) {
  const [tab, setTab] = useState("Summary");
  const details = supplier.details || {};
  const contacts = details.contacts || [];
  const addresses = details.addresses || [];
  const supplyItems = details.supplyItems || [];
  const primary = contacts.find((contact) => contact.isPrimary) || contacts[0];
  const tabs = [
    ["Summary", "▣"],
    ["Contacts", contacts.length],
    ["Addresses", addresses.length],
    ["Supply Item(s)", supplyItems.length],
    ["Transactions", 0],
    ["Documents", (details.documents || []).length],
  ];

  return (
    <main className="supplier-detail-page">
      <div className="supplier-detail-breadcrumb">
        <span>Suppliers</span>
        <b>›</b>
        <strong>Details</strong>
      </div>
      <div className="supplier-detail-top">
        <div>
          <div className="supplier-title-row">
            <h1>{details.displayName || supplier.name}</h1>
            <code>{supplier.supplier_code}</code>
            <span className="supplier-active">{supplier.status}</span>
          </div>
          <p>
            {supplier.name} • {supplier.category} • {supplier.supplier_group} Entity • {details.addresses?.[0]?.country || supplier.location}
          </p>
        </div>
        <div className="supplier-detail-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Back to Listing
          </button>
          <button className="btn btn-primary" onClick={onEdit}>
            Edit Supplier
          </button>
        </div>
      </div>
      <div className="supplier-detail-tabs">
        {tabs.map(([label, count]) => (
          <button key={label} className={tab === label ? "active" : ""} onClick={() => setTab(label)}>
            {label}
            {typeof count === "number" && <small>{count}</small>}
          </button>
        ))}
      </div>
      <div className="supplier-detail-body">
        {tab === "Summary" && (
          <div className="supplier-detail-columns">
            <div>
              <DetailSection title="1. Basic Information">
                <DetailValue label="Supplier Name" value={supplier.name} />
                <DetailValue label="Trade Name" value={details.displayName} />
                <DetailValue label="Registration No." value={details.registrationNo} />
                <DetailValue label="Incorporation Date" value={details.incorporationDate} />
                <DetailValue label="Company Email" value={supplier.email} />
                <DetailValue label="Company Website" value={details.companyWebsite} />
              </DetailSection>
              <DetailSection title="2. Classification & Sustainability">
                <DetailValue label="Supplier Category" value={supplier.category} />
                <DetailValue label="Supplier Type" value={details.supplierType || details.vendorType} />
                <DetailValue label="Supplier Group" value={supplier.supplier_group} />
                <DetailValue label="Sustainability Certification" value={details.sustainabilityCert} />
                <DetailValue label="Description" value={details.businessDescription} wide />
              </DetailSection>
              <DetailSection title="3. Commercial & Banking Profile">
                <DetailValue label="Operating Currency" value={details.currency} />
                <DetailValue label="Payment Terms" value={supplier.payment_terms} />
                <DetailValue label="Payment Mode" value={details.paymentMode} />
                <DetailValue label="Tax Registration No." value={details.taxRegistrationNo} />
                <DetailValue label="Bank Name" value={details.bankName} />
                <DetailValue label="Account Number / IBAN" value={details.bankAccountNo} />
              </DetailSection>
            </div>
            <aside>
              <div className="supplier-snapshot">
                <h3>Quick Supplier Snapshot</h3>
                <DetailValue label="Supplier Category" value={supplier.category} />
                <DetailValue label="Supplier Group" value={supplier.supplier_group} />
                <DetailValue label="Entity Type" value={details.supplierType || details.vendorType || "—"} />
                <DetailValue label="Location" value={supplier.location || details.addresses?.[0]?.country} />
                <DetailValue label="Registered On" value={details.registeredOn || "30-09-2026"} />
                <DetailValue label="Hotline / Mobile" value={supplier.phone} />
                <DetailValue label="Active Contacts" value={`${contacts.length} Registered`} />
                <DetailValue label="Configured Locations" value={`${addresses.length} Sites`} />
                <DetailValue label="Supply Lines" value={`${supplyItems.length} Configured`} />
                <DetailValue label="Documents Status" value={(details.documents || []).length ? "Uploaded" : "Pending"} />
              </div>
              <div className="supplier-primary-contact">
                <span>PRIMARY CONTACT</span>
                <h3>{primary?.name || supplier.contact_person}</h3>
                <p>{primary?.designation || "Supplier Representative"}</p>
                <p>{primary?.email || supplier.email}</p>
                <p>{primary ? `${primary.mobileCode || "+60"} ${primary.mobile || ""}` : supplier.phone}</p>
              </div>
            </aside>
          </div>
        )}
        {tab === "Contacts" && (
          <DetailSection title="Contact Person(s)">
            <div className="supplier-card-list">
              {contacts.length ? (
                contacts.map((contact, index) => (
                  <article key={index}>
                    <span>
                      {contact.type || "Department"}
                      {contact.isPrimary ? " • Primary" : ""}
                    </span>
                    <h3>{contact.name || "Unnamed contact"}</h3>
                    <p>{contact.designation || "Representative"}</p>
                    <p>{contact.email || "-"}</p>
                    <p>
                      {contact.mobileCode || "+60"} {contact.mobile || "-"}
                    </p>
                  </article>
                ))
              ) : (
                <p className="muted">No contacts configured for this supplier.</p>
              )}
            </div>
          </DetailSection>
        )}
        {tab === "Addresses" && (
          <DetailSection title="Location & Address">
            <div className="supplier-card-list">
              {addresses.length ? (
                addresses.map((address, index) => (
                  <article key={index}>
                    <span>
                      {address.type}
                      {address.isDefault ? " • Primary Site" : ""}
                    </span>
                    <h3>{address.city || "Location"}</h3>
                    <p>{address.line1 || "-"}</p>
                    <p>{address.line2 || ""}</p>
                    <p>
                      {address.state}, {address.country}
                    </p>
                  </article>
                ))
              ) : (
                <p className="muted">No addresses configured for this supplier.</p>
              )}
            </div>
          </DetailSection>
        )}
        {tab === "Supply Item(s)" && (
          <DetailSection title="Supply Item(s)">
            <div className="supplier-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Supply Capacity</th>
                    <th>Delivery Term</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplyItems.length ? (
                    supplyItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.item}</td>
                        <td>{item.supplyCapacity || item.capacity || "-"}</td>
                        <td>{item.deliveryTerm}</td>
                        <td>
                          <span className="supplier-active">Approved</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No supply items configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DetailSection>
        )}
        {tab === "Transactions" && (
          <DetailSection title="Purchase Orders, Inbound Weighbridge & Invoices">
            <p className="muted">No transactions recorded for this supplier yet.</p>
          </DetailSection>
        )}
        {tab === "Documents" && (
          <DetailSection title="Compliance, Sustainability & Regulatory Documents">
            {(details.documents || []).length ? <div className="supplier-card-list">{details.documents.map((document, index) => <article key={index}><span>{document.type || "Supplier Document"}</span><h3>{document.name}</h3><p>{document.fileType || "Document"}</p></article>)}</div> : <p className="muted">No documents uploaded for this supplier yet.</p>}
          </DetailSection>
        )}
      </div>
    </main>
  );
}

export function SuppliersPage({ rows, onNew, onSelect }) {
  const [search, setSearch] = useState("");
  const filteredRows = rows.filter((row) => `${row.name} ${row.supplier_code} ${row.category} ${row.supplier_group} ${row.contact_person}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <main className="customer-list-page supplier-list-page">
      <div className="customer-breadcrumb">
        <span>Suppliers</span>
        <b>›</b>
        <strong>Suppliers Listing</strong>
      </div>
      <div className="customer-list-heading">
        <h1>Suppliers</h1>
        <div className="customer-list-actions">
          <ListingActions search={search} setSearch={setSearch} rows={filteredRows} columns={["name", "supplier_code", "category", "supplier_group", "contact_person", "phone", "email", "location", "payment_terms", "status"]} />
          <button title="Search">⌕</button>
          <button title="Refresh">↻</button>
          <button title="Download">⇩</button>
          <button title="Filter">▽</button>
          <button title="View">◉</button>
          <button className="btn btn-primary" onClick={onNew}>
            ＋ Add Supplier
          </button>
        </div>
      </div>
      <article className="panel customer-list-panel">
        <div className="table-wrap">
          <table className="customer-table supplier-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Supplier Code</th>
                <th>Category / Service</th>
                <th>Group</th>
                <th>Contact Person</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Location</th>
                <th>Payment Terms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} onClick={() => onSelect(row)}>
                  <td className="customer-name-cell">▥ {row.name}</td>
                  <td>{row.supplier_code}</td>
                  <td>
                    <span className="classification-pill">{row.category}</span>
                  </td>
                  <td>{row.supplier_group}</td>
                  <td>
                    <strong>{row.contact_person}</strong>
                  </td>
                  <td>{row.phone}</td>
                  <td>{row.email}</td>
                  <td>{row.location}</td>
                  <td>{row.payment_terms}</td>
                  <td>
                    <span className="customer-status">{row.status}</span>
                  </td>
                </tr>
              ))}
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
