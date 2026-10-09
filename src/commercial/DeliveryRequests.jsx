import React, { useEffect, useMemo, useState } from "react";
import "./sales-contract-details.css";
import "./delivery-request-details.css";
import { formatDate } from "../shared/formatters.js";

const STORAGE_KEY = "rockeye.commercial.deliveryRequests";
const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const makeNumber = (prefix) =>
  prefix +
  "-" +
  new Date().toISOString().slice(0, 10).replaceAll("-", "") +
  "-" +
  String(Date.now()).slice(-4);
const seed = [
  {
    id: "DR-20261007-SPR-CPO-15000",
    requestNo: "DR-20261007-0001",
    requestDate: "07-10-2026",
    loadingInstructionNo: "LI-20261007-0001",
    customerName: "Straits Palm Refining",
    contractNumber: "SC-2026-0012",
    customerPo: "SPR-PO-2026-1007",
    deliveryLocation:
      "Delivery · Lot 27, Jalan Pelabuhan Tanjung Langsat, Pasir Gudang, Malaysia",
    deliveryDate: "30-10-2026",
    deliveryType: "Company Delivery",
    product: "Crude Palm Oil (CPO)",
    requestedQuantity: "15000",
    uom: "MT",
    remainingQuantity: "15000",
    loadingQuantity: "",
    sourceType: "Tank",
    sourceStorage: "",
    availableStock: 1200,
    loadingBay: "",
    loadingLine: "",
    plannedLoadingDate: "30-10-2026",
    loadingInstructions: "",
    attachmentName: "",
    remarks: "",
    createdBy: "Sean Shapiro",
    status: "DRAFT",
    taxRate: "0",
    unitPrice: "925",
  },
];
const readRequests = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const safe = Array.isArray(stored)
      ? stored.filter((item) => item && typeof item === "object")
      : [];
    if (safe.length) return safe;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {}
  return seed;
};
const parseDate = (value) => {
  if (!value) return null;
  const parts = String(value).split("-");
  return parts.length === 3 && parts[0].length === 2
    ? new Date(parts[2] + "-" + parts[1] + "-" + parts[0])
    : new Date(value);
};
const lifecycleStatus = (request) => {
  if (request.deliveryRequestStatus === "FULFILLED") return "FULFILLED";
  if (request.status === "CANCELLED" || request.status === "COMPLETED" || request.status === "FULFILLED")
    return request.status;
  if (request.loadingFulfilled && request.vehicleExitAt) return "FULFILLED";
  const planned = parseDate(request.plannedLoadingDate || request.deliveryDate);
  if (
    ["SUBMITTED", "PLANNED", "PENDING_LOGISTICS_ASSIGNMENT", "ASSIGNED", "LOADING_IN_PROGRESS"].includes(request.status) &&
    planned &&
    planned < new Date(new Date().toDateString())
  )
    return "DELAYED";
  return request.status || "DRAFT";
};
const Field = ({ label, children, wide = false, readOnly = false, required = false }) => (
  <label
    className={
      "master-field" +
      (wide ? " master-field-wide" : "") +
      (readOnly ? " readonly-field" : "")
    }
  >
    <span>{label}{required && <em aria-hidden="true">*</em>}</span>
    {children}
  </label>
);
function DeliveryRequestDetails({ request, onBack, onCancel, onEdit }) {
  const [tab, setTab] = useState("Summary");
  const detail = (label, value) => (
    <div>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
  const group = (items) =>
    items.map(([label, value]) => (
      <React.Fragment key={label}>{detail(label, value)}</React.Fragment>
    ));
  const events = [
    [
      "Delivery request created",
      request.requestDate,
      "The delivery requirement was created by " +
        (request.createdBy || "system") +
        ".",
    ],
    [
      "Loading plan assigned",
      request.plannedLoadingDate || request.requestDate,
      request.transporter
        ? "Transporter, vehicle and driver were assigned for logistics execution."
        : "Loading plan is pending transporter assignment.",
    ],
    [
      "Current status",
      request.status,
      "Request remains available for the next configured logistics workflow stage.",
    ],
  ];
  return (
    <main className="sales-contract-details-page delivery-request-page">
      <div className="sales-contract-breadcrumb">
        <span>Customers</span>
        <b>›</b>
        <span>Delivery Requests</span>
        <b>›</b>
        <strong>Details</strong>
      </div>
      <div className="sales-contract-details-heading">
        <div>
          <div className="sales-contract-title-line">
            <h1>{request.requestNo}</h1>
            <span className="sales-contract-code">{request.deliveryType}</span>
            <span className="customer-status">{request.status}</span>
          </div>
          <p>
            {request.customerName} · {request.product} · {request.deliveryDate}
          </p>
        </div>
        <div className="detail-header-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Back to Listing
          </button>
          {request.status === "DRAFT" && (
            <button className="btn btn-primary" onClick={onEdit}>
              Edit Request
            </button>
          )}
          {!request.vehicleArrivedAt && !["COMPLETED", "CANCELLED", "FULFILLED"].includes(request.status) && (
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancel Request
            </button>
          )}
        </div>
      </div>
      <div className="sales-contract-tabs">
        <button
          className={tab === "Summary" ? "selected" : ""}
          onClick={() => setTab("Summary")}
        >
          Summary
        </button>
        <button
          className={tab === "Activities" ? "selected" : ""}
          onClick={() => setTab("Activities")}
        >
          Activities
        </button>
      </div>
      {tab === "Summary" ? (
        <div className="sales-contract-detail-layout">
          <div className="sales-contract-main">
            <section className="sales-contract-card">
              <h2>1. Request & Customer Information</h2>
              <div className="sales-contract-grid">
                {group([
                  ["Delivery Request No.", request.requestNo],
                  ["Request Date", request.requestDate],
                  ["Customer", request.customerName],
                  ["Sales Contract", request.contractNumber],
                  ["Customer PO No. Reference", request.customerPo],
                  ["Created By", request.createdBy],
                ])}
              </div>
            </section>
            <section className="sales-contract-card">
              <h2>2. Delivery Planning</h2>
              <div className="sales-contract-grid">
                {group([
                  ["Delivery Location", request.deliveryLocation],
                  ["Delivery Date", request.deliveryDate],
                  ["Delivery Type", request.deliveryType],
                  ["Product", request.product],
                  [
                    "Requested Quantity",
                    (request.requestedQuantity || "—") +
                      " " +
                      (request.uom || ""),
                  ],
                  ["Tax", (request.taxRate || "0") + "%"],
                  [
                    "Final Amount",
                    request.finalAmount ? money(request.finalAmount) : "—",
                  ],
                ])}
              </div>
            </section>
            <section className="sales-contract-card">
              <h2>3. Loading Plan</h2>
              <div className="sales-contract-grid">
                {group([
                  ["Loading Instruction No.", request.loadingInstructionNo],
                  [
                    "Remaining Quantity",
                    (request.remainingQuantity ?? "—") +
                      " " +
                      (request.uom || ""),
                  ],
                  ["Transporter", request.transporter],
                  ["Vehicle", request.vehicle],
                  ["Driver", request.driver],
                  ["Loading Bay", request.loadingBay],
                  ["Loading Line", request.loadingLine],
                  ["Planned Loading Date", request.plannedLoadingDate],
                  ["Loading Instructions", request.loadingInstructions],
                  ["Attachment", request.attachmentName],
                  ["Remarks", request.remarks],
                ])}
              </div>
            </section>
          </div>
          <aside className="sales-contract-side">
            <section className="sales-contract-card">
              <h2>Quick Request Snapshot</h2>
              {[
                ["Customer", request.customerName],
                ["Product", request.product],
                [
                  "Quantity",
                  (request.requestedQuantity || "—") +
                    " " +
                    (request.uom || ""),
                ],
                ["Planned Date", request.deliveryDate],
                ["Status", request.status],
              ].map(([label, value]) => (
                <div className="sales-contract-snapshot" key={label}>
                  <span>{label}</span>
                  <strong>{value || "—"}</strong>
                </div>
              ))}
            </section>
          </aside>
        </div>
      ) : (
        <section className="sales-contract-tab-panel sales-contract-activities-panel">
          <div className="sales-contract-activity-toolbar">
            <div>
              <h2>Delivery Request Activities</h2>
              <p>Traceable request and loading-plan events.</p>
            </div>
          </div>
          <div className="sales-contract-activity-timeline">
            {events.map(([title, date, description]) => (
              <article key={title}>
                <div className="activity-dot" />
                <div>
                  <span>{date}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export function DeliveryRequestsPage({ customers = [], contracts = [] }) {
  const [rows, setRows] = useState(readRequests);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [product, setProduct] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [loadingBay, setLoadingBay] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [unitPriceValue, setUnitPriceValue] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [transporters] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("rockeye.master.transporters") || "[]",
      );
      if (Array.isArray(stored) && stored.length)
        return stored.filter((item) => item && typeof item === "object");
    } catch {}
    return [
      {
        id: "TR-MY-001",
        companyName: "Kencana Haulage Sdn. Bhd.",
        status: "Active",
      },
      {
        id: "TR-MY-002",
        companyName: "Southern Palm Logistics Sdn. Bhd.",
        status: "Active",
      },
      {
        id: "TR-MY-003",
        companyName: "Perak Bulk Transport Sdn. Bhd.",
        status: "Active",
      },
      {
        id: "TR-MY-005",
        companyName: "East Coast Fleet Services Sdn. Bhd.",
        status: "Active",
      },
    ];
  });
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/vehicles").then((response) => response.json()),
      fetch("/api/drivers").then((response) => response.json()),
    ])
      .then(([vehicleRows, driverRows]) => {
        if (active) {
          setVehicles(Array.isArray(vehicleRows) ? vehicleRows : []);
          setDrivers(Array.isArray(driverRows) ? driverRows : []);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const customerRows = Array.isArray(customers)
    ? customers.filter((item) => item && typeof item === "object")
    : [];
  const contractRows = Array.isArray(contracts)
    ? contracts.filter((item) => item && typeof item === "object")
    : [];
  const customer = customerRows.find(
    (item) => String(item.id) === String(customerId),
  );
  const customerContracts = contractRows.filter(
    (item) =>
      item.customer === customer?.display_name ||
      item.customer === customer?.legal_name,
  );
  const contract = contractRows.find(
    (item) => String(item.id) === String(contractId),
  );
  const products =
    Array.isArray(contract?.products) && contract.products.length
      ? contract.products.filter((item) => item && typeof item === "object")
      : Array.isArray(customer?.products)
        ? customer.products.filter((item) => item && typeof item === "object")
        : [];
  const productLine =
    products.find((item) => (item.product || item.name) === product) || {};
  const unitPrice = Number(
    unitPriceValue || productLine.unitPrice || productLine.price || 0,
  );
  const finalAmount =
    Number(requestedQuantity || 0) *
    unitPrice *
    (1 + Number(taxRate || 0) / 100);
  const remainingQuantity = Number(requestedQuantity || 0);
  const selectedTransporter = transporters.find(
    (item) => item && String(item.id) === String(transporterId),
  );
  const transporterName =
    selectedTransporter?.companyName || selectedTransporter?.tradingName || "";
  const vehicleRows = Array.isArray(vehicles)
    ? vehicles.filter((item) => item && typeof item === "object")
    : [];
  const driverRows = Array.isArray(drivers)
    ? drivers.filter((item) => item && typeof item === "object")
    : [];
  const transporterVehicles = vehicleRows.filter(
    (item) => item.status === "ACTIVE" && item.transporter === transporterName,
  );
  const transporterDrivers = driverRows.filter(
    (item) => item.status === "ACTIVE" && item.transporter === transporterName,
  );
  const locations = Array.isArray(customer?.addresses)
    ? customer.addresses.filter((item) => item && typeof item === "object")
    : [];
  const loadingLines =
    loadingBay === "Loading Bay 01"
      ? ["Loading Line A", "Loading Line B"]
      : loadingBay === "Loading Bay 02"
        ? ["Loading Line C"]
        : [];
  const customerOptions = useMemo(
    () =>
      customerRows.filter(
        (item) => String(item.status || "Active").toLowerCase() === "active",
      ),
    [customerRows],
  );
  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setStep(1);
    setDraft({});
    setError("");
    setCustomerId("");
    setContractId("");
    setProduct("");
    setRequestedQuantity("");
    setLoadingBay("");
    setTransporterId("");
    setVehicleId("");
    setDriverId("");
    setTaxRate("0");
    setUnitPriceValue("");
  };
  const notifyTransporter = async (request) => {
    const selectedVehicle = vehicleRows.find(
      (item) => String(item.id) === String(request.vehicle),
    );
    const recipient = transporterName.toLowerCase().includes("kencana")
      ? "kancana@yopmail.com"
      : selectedTransporter?.notificationEmail ||
        selectedTransporter?.primaryEmail ||
        "";
    if (!recipient) return;
    await fetch("/api/notifications/transporter-delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient,
        deliveryReference: request.requestNo,
        loadingInstructionNo: request.loadingInstructionNo,
        reportingDateTime: `${request.plannedLoadingDate || request.deliveryDate} 08:00`,
        millLocationGate: request.loadingBay || "Mill Gate",
        product: request.product,
        vehicleType: selectedVehicle?.vehicle_type || "Configured vehicle",
        quantity: `${request.requestedQuantity || ""} ${request.uom || "MT"}`,
      }),
    });
  };
  const save = async (event) => {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || "submit";
    const form = event.currentTarget;
    const data = {
      ...draft,
      ...Object.fromEntries(new FormData(form).entries()),
    };
    const quantity = Number(data.requestedQuantity);
    const contractedQuantity = Number(productLine.quantity || 0);
    if (!customer) return setError("Select an active customer.");
    if (!contract)
      return setError("Select a contract for the selected customer.");
    if (!quantity || quantity <= 0)
      return setError("Requested quantity must be greater than zero.");
    if (contractedQuantity && quantity > contractedQuantity)
      return setError(
        "Requested quantity cannot exceed the contracted quantity.",
      );
    const request = {
      id: Date.now(),
      requestNo: makeNumber("DR"),
      requestDate: formatDate(new Date()),
      loadingInstructionNo: makeNumber("LI"),
      customerName: customer?.display_name || customer?.legal_name || "",
      contractNumber: contract?.contract_number || "",
      product: data.product,
      transporter: transporterName,
      vehicle: data.vehicleId,
      driver: data.driverId,
      unitPrice,
      taxRate,
      finalAmount,
      createdBy: "Sean Shapiro",
      status: action === "draft" ? "DRAFT" : "PLANNED",
      loadingPlanStatus:
        action === "draft" ? "DRAFT" : "PENDING_LOGISTICS_ASSIGNMENT",
      attachmentName: form.elements.attachment.files[0]?.name || "",
      ...data,
    };
    const next = editing
      ? rows.map((item) =>
          item.id === editing.id
            ? {
                ...request,
                id: editing.id,
                requestNo: editing.requestNo,
                requestDate: editing.requestDate,
                loadingInstructionNo: editing.loadingInstructionNo,
              }
            : item,
        )
      : [request, ...rows];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRows(next);
    if (action !== "draft") {
      try {
        await notifyTransporter(request);
      } catch {}
    }
    resetForm();
  };
  if (selected)
    return (
      <DeliveryRequestDetails
        request={selected}
        onBack={() => setSelected(null)}
        onEdit={() => {
          const customerMatch = customerRows.find(
            (item) =>
              (item.display_name || item.legal_name) === selected.customerName,
          );
          const contractMatch = contractRows.find(
            (item) => item.contract_number === selected.contractNumber,
          );
          const transporterMatch = transporters.find(
            (item) =>
              (item.companyName || item.tradingName) === selected.transporter,
          );
          setEditing(selected);
          setSelected(null);
          setCustomerId(customerMatch?.id || "");
          setContractId(contractMatch?.id || "");
          setProduct(selected.product || "");
          setRequestedQuantity(selected.requestedQuantity || "");
          setTaxRate(selected.taxRate || "0");
          setUnitPriceValue(String(selected.unitPrice || ""));
          setTransporterId(transporterMatch?.id || "");
          setVehicleId(selected.vehicle || "");
          setDriverId(selected.driver || "");
          setLoadingBay(selected.loadingBay || "");
          setDraft(selected);
          setStep(1);
          setShowForm(true);
        }}
        onCancel={() => {
          if (rows.find((item) => item.id === selected.id)?.vehicleArrivedAt) return;
          const next = rows.map((item) =>
            item.id === selected.id
              ? { ...item, status: "CANCELLED", loadingPlanStatus: "CANCELLED" }
              : item,
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setRows(next);
          setSelected(null);
        }}
      />
    );
  return (
    <main className="sales-contract-details-page delivery-request-page">
      <div className="sales-contract-breadcrumb">
        <span>Customers</span>
        <b>›</b>
        <strong>Delivery Requests</strong>
      </div>
      <div className="sales-contract-details-heading">
        <div>
          <h1>Delivery Requests</h1>
          <p>
            Create and manage customer delivery requirements against active
            sales contracts.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError("");
            setStep(1);
            setShowForm(true);
          }}
        >
          + New Delivery Request
        </button>
      </div>
      <section className="sales-contract-tab-panel delivery-request-list">
        <div className="sales-contract-activity-toolbar">
          <div>
            <h2>Delivery request register</h2>
            <p>{rows.length} requests recorded</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Request Date</th>
                <th>Customer</th>
                <th>Contract</th>
                <th>Product</th>
                <th>Requested Qty</th>
                <th>Delivery Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => (
                <tr
                  key={request.id}
                  onClick={() =>
                    setSelected({
                      ...request,
                      status: lifecycleStatus(request),
                    })
                  }
                >
                  <td>
                    <button className="table-link">{request.requestNo}</button>
                  </td>
                  <td>{request.requestDate}</td>
                  <td>{request.customerName}</td>
                  <td>{request.contractNumber}</td>
                  <td>{request.product}</td>
                  <td>
                    {request.requestedQuantity} {request.uom}
                  </td>
                  <td>{request.deliveryDate}</td>
                  <td>
                    <span className="customer-status">
                      {lifecycleStatus(request)}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan="8" className="master-empty">
                    No delivery requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {showForm && (
        <div className="master-modal-backdrop">
          <form className="master-form delivery-request-form" onSubmit={save}>
            <div className="master-form-head">
              <div>
                <span>CUSTOMERS / DELIVERY REQUESTS</span>
                <h2>New Delivery Request</h2>
                <p>
                  Step {step} of 2 ·{" "}
                  {step === 1 ? "Delivery Request" : "Loading Plan"}
                </p>
              </div>
              <button type="button" onClick={resetForm}>
                ×
              </button>
            </div>
            {error && <div className="master-error">{error}</div>}
            {step === 1 && (
              <>
                <section className="transporter-form-section">
                  <h3>1. Delivery Request</h3>
                  <div className="master-form-grid">
                    <Field label="Customer" required>
                      <select
                        name="customerId"
                        value={customerId}
                        onChange={(event) => {
                          setCustomerId(event.target.value);
                          setContractId("");
                          setProduct("");
                          setUnitPriceValue("");
                        }}
                        required
                      >
                        <option value="">Select active customer...</option>
                        {customerOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.display_name || item.legal_name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Contract" required>
                      <select
                        name="contractId"
                        value={contractId}
                        onChange={(event) => {
                          setContractId(event.target.value);
                          setProduct("");
                          setUnitPriceValue("");
                        }}
                        required
                        disabled={!customerId}
                      >
                        <option value="">Select customer contract...</option>
                        {customerContracts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.contract_number} · {item.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Customer PO No. Reference">
                      <input
                        name="customerPo"
                        defaultValue={editing?.customerPo || ""}
                      />
                    </Field>
                    <Field label="Delivery Location" required>
                      <select
                        name="deliveryLocation"
                        defaultValue={editing?.deliveryLocation || ""}
                        required
                        disabled={!customerId}
                      >
                        <option value="">Select customer location...</option>
                        {locations.map((item, index) => (
                          <option key={index}>
                            {[item.type, item.line1, item.city, item.country]
                              .filter(Boolean)
                              .join(" · ")}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Delivery Date" required>
                      <input
                        name="deliveryDate"
                        type="date"
                        defaultValue={
                          editing?.deliveryDate
                            ?.split("-")
                            .reverse()
                            .join("-") || ""
                        }
                        required
                      />
                    </Field>
                    <Field label="Delivery Type" required>
                      <select
                        name="deliveryType"
                        defaultValue="Company Delivery"
                        required
                      >
                        <option>Self Pickup</option>
                        <option>Company Delivery</option>
                      </select>
                    </Field>
                    <div className="delivery-product-lines master-field-wide">
                      <span className="delivery-product-lines-label">
                        Product line<em>*</em>
                      </span>
                      <div className="delivery-line-table-wrap">
                        <table className="delivery-line-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Unit</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Amount</th>
                              <th>TAX</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <select
                                  name="product"
                                  value={product}
                                  onChange={(event) => {
                                    const selected = products.find(
                                      (item) =>
                                        (item.product || item.name) ===
                                        event.target.value,
                                    );
                                    setProduct(event.target.value);
                                    setUnitPriceValue(
                                      String(
                                        selected?.unitPrice ??
                                          selected?.price ??
                                          "",
                                      ),
                                    );
                                  }}
                                  required
                                  disabled={!contractId}
                                >
                                  <option value="">Select product...</option>
                                  {products.map((item) => (
                                    <option
                                      key={item.product || item.name}
                                      value={item.product || item.name}
                                    >
                                      {item.product || item.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  className="readonly-control"
                                  value={productLine.uom || "MT"}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  name="requestedQuantity"
                                  type="number"
                                  placeholder="0.00"
                                  value={requestedQuantity}
                                  onChange={(event) =>
                                    setRequestedQuantity(event.target.value)
                                  }
                                  min="0.001"
                                  step="0.001"
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  name="unitPrice"
                                  type="number"
                                  value={
                                    unitPriceValue ||
                                    (productLine.unitPrice ??
                                      productLine.price ??
                                      "")
                                  }
                                  onChange={(event) =>
                                    setUnitPriceValue(event.target.value)
                                  }
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </td>
                              <td>
                                <input
                                  className="readonly-control"
                                  value={
                                    requestedQuantity
                                      ? money(
                                          Number(requestedQuantity) * unitPrice,
                                        )
                                      : "0.00"
                                  }
                                  readOnly
                                />
                              </td>
                              <td>
                                <select
                                  name="taxRate"
                                  value={taxRate}
                                  onChange={(event) =>
                                    setTaxRate(event.target.value)
                                  }
                                >
                                  <option value="0">N/A</option>
                                  <option value="5">5%</option>
                                  <option value="6">6%</option>
                                  <option value="10">10%</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  className="readonly-control"
                                  value={
                                    finalAmount ? money(finalAmount) : "0.00"
                                  }
                                  readOnly
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
                <div className="master-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(event) => {
                      setDraft(
                        Object.fromEntries(
                          new FormData(event.currentTarget.form).entries(),
                        ),
                      );
                      setStep(2);
                    }}
                  >
                    Next: Loading Plan
                  </button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <section className="transporter-form-section">
                  <h3>2. Sales Loading Plan</h3>
                  <div className="master-form-grid">
                    <Field label="Requested Quantity" readOnly>
                      <input
                        className="readonly-control"
                        value={
                          requestedQuantity + " " + (productLine.uom || "MT")
                        }
                        readOnly
                      />
                    </Field>
                    <Field label="Planned Loading Date" required>
                      <input
                        name="plannedLoadingDate"
                        type="date"
                        defaultValue={
                          editing?.plannedLoadingDate
                            ?.split("-")
                            .reverse()
                            .join("-") || ""
                        }
                        required
                      />
                    </Field>
                    <Field label="Loading Instructions" wide>
                      <textarea
                        name="loadingInstructions"
                        defaultValue={editing?.loadingInstructions || ""}
                        rows="3"
                      />
                    </Field>
                    <Field label="Attachment" wide>
                      <input
                        name="attachment"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </Field>
                    <Field label="Remarks" wide>
                      <textarea
                        name="remarks"
                        defaultValue={editing?.remarks || ""}
                        rows="3"
                      />
                    </Field>
                  </div>
                </section>
                <div className="master-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-secondary"
                    name="action"
                    value="draft"
                  >
                    Save Draft
                  </button>
                  <button
                    className="btn btn-primary"
                    name="action"
                    value="submit"
                  >
                    Submit Request
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
