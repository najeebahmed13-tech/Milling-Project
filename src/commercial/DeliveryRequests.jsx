import React, { useEffect, useMemo, useState } from "react";
import "./sales-contract-details.css";
import "./delivery-request-details.css";
import "./delivery-request-form.css";
import { formatDate } from "../shared/formatters.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { Alert, Button, DateRangeFilter, DetailValue, FormField, IconButton, StatusBadge } from "../design-system/index.js";
import { QuantityInput, TextInput } from "../design-system/form-fields.jsx";
import { DEVELOPMENT_LOADING_PLAN, DEVELOPMENT_LOADING_PLAN_LEGACY_REQUEST_NO } from "./development-flow-fixture.js";

const STORAGE_KEY = "rockeye.commercial.deliveryRequests";
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    deliveryQuantity: "15000.00",
    uom: "MT",
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
/* Legacy inline fixture retained in history; active development fixture is shared below.
const developmentLoadingPlan = {
  id: "DEMO-LOADING-PLAN-001",
  requestNo: "DR-DEMO-STRAITS-CPO-001",
  requestDate: "16-10-2026",
  loadingInstructionNo: "LI-DEMO-STRAITS-CPO-001",
  customerName: "Straits Palm Refining",
  contractNumber: "SC-2026-0012",
  customerPo: "SPR-PO-2026-1007",
  deliveryLocation: "Delivery · Lot 27, Jalan Pelabuhan Tanjung Langsat, 81700 Pasir Gudang, Malaysia",
  deliveryDate: "20-10-2026",
  deliveryType: "Company Delivery",
  product: "Crude Palm Oil",
  requestedQuantity: "35.00",
  deliveryQuantity: "35.00",
  uom: "MT",
  sourceType: "Tank",
  sourceStorage: "CPO Tank 01",
  availableStock: 1200,
  loadingBay: "Loading Bay 01",
  loadingLine: "Loading Line A",
  loadingInstructions: "Development flow fixture: dispatch CPO from Tank 01 to the customer delivery location.",
  createdBy: "Development Fixture",
  createdAt: "2026-10-16T08:00:00.000Z",
  transporter: "Kencana Haulage Sdn. Bhd.",
  vehicle: "KCH-2601",
  vehicleId: "112",
  vehicleNo: "KCH-2601",
  driver: "Ahmad Faizal Rahman",
  driverId: "3",
  driverName: "Ahmad Faizal Rahman",
  itemId: "1",
  status: "ASSIGNED",
  loadingPlanStatus: "ASSIGNED",
  logisticsAssignedAt: "2026-10-16T08:05:00.000Z",
}; */
const readRequests = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const safe = Array.isArray(stored)
      ? stored.filter((item) => item && typeof item === "object")
      : [];
    if (import.meta.env.DEV) {
      const migrated = safe.map((item) => item.requestNo === DEVELOPMENT_LOADING_PLAN_LEGACY_REQUEST_NO ? { ...item, ...DEVELOPMENT_LOADING_PLAN } : item);
      const next = migrated.some((item) => item.requestNo === DEVELOPMENT_LOADING_PLAN.requestNo) ? migrated : [DEVELOPMENT_LOADING_PLAN, ...migrated];
      if (JSON.stringify(next) !== JSON.stringify(safe)) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
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
  const planned = parseDate(request.deliveryDate);
  if (
    ["SUBMITTED", "PLANNED", "PENDING_LOGISTICS_ASSIGNMENT", "ASSIGNED", "LOADING_IN_PROGRESS"].includes(request.status) &&
    planned &&
    planned < new Date(new Date().toDateString())
  )
    return "DELAYED";
  return request.status || "DRAFT";
};
const Field = ({ label, children, wide = false, readOnly = false, required = false, className = "" }) => (
  <FormField
    label={label}
    required={required}
    className={
      "master-field" +
      (wide ? " master-field-wide" : "") +
      (readOnly ? " readonly-field" : "") +
      (className ? ` ${className}` : "")
    }
  >
    {children}
  </FormField>
);
function DeliveryRequestDetails({ request, onBack, onCancel, onEdit }) {
  const [tab, setTab] = useState("Summary");
  const legacyDetailOld = (label, value) => (
    <div>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
  const displayDate = (date) => formatDate(date) === "-" ? "TBA" : formatDate(date);
  const legacyDetail = (label, value) => (
    <div>
      <span>{label}</span>
      <strong>{value === undefined || value === null || value === "" ? "TBA" : value}</strong>
    </div>
  );
  const detail = (label, value, pending = false) => (
    <div>
      <span>{label}</span>
      <strong><DetailValue value={value} pending={pending} /></strong>
    </div>
  );
  const removedFormFields = new Set([
    "Requested Quantity",
    "Quantity",
    "Tax",
    "Final Amount",
    "Planned Loading Date",
    "Loading Instructions",
  ]);
  const group = (items) =>
    items.filter(([label]) => !removedFormFields.has(label)).map(([label, value]) => (
      <React.Fragment key={label}>{detail(label, value)}</React.Fragment>
    ));
  const events = [
    [
      "Delivery request created",
      displayDate(request.requestDate),
      "The delivery requirement was created by " +
        (request.createdBy || "system") +
        ".",
    ],
    [
      "Loading plan assigned",
      displayDate(request.deliveryDate || request.requestDate),
      request.transporter
        ? "Transporter, vehicle and driver were assigned for logistics execution."
        : "Loading plan is pending transporter assignment.",
    ],
    [
      "Current status",
      displayDate(request.deliveryDate || request.requestDate),
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
            <StatusBadge status={request.status} />
          </div>
          <p>
            {request.customerName} · {request.product || "TBA"} · {displayDate(request.deliveryDate)}
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
                  ["Request Date", displayDate(request.requestDate)],
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
                  ["Delivery Date", displayDate(request.deliveryDate)],
                  ["Delivery Type", request.deliveryType],
                  ["Product", request.product],
                  [
                    "Delivery Quantity",
                    (request.deliveryQuantity || request.requestedQuantity || "—") +
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
          </div>
          <aside className="sales-contract-side">
            <section className="sales-contract-card">
              <h2>Quick Request Snapshot</h2>
              {[
                ["Customer", request.customerName],
                ["Product", request.product],
                [
                  "Delivery Quantity",
                  (request.deliveryQuantity || request.requestedQuantity || "—") +
                    " " +
                    (request.uom || ""),
                ],
                 ["Delivery Date", displayDate(request.deliveryDate)],
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
            <div className="sales-contract-activity-filters">
              <DateRangeFilter start={events[events.length - 1]?.[1]} end={events[0]?.[1]} />
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

export function DeliveryRequestsPage({ customers = [], contracts = [], items = [] }) {
  const [rows, setRows] = useState(readRequests);
  const { visibleItems, pagination } = usePaginatedItems(rows);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [product, setProduct] = useState("");
  const [loadingBay, setLoadingBay] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
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
  const activeItems = Array.isArray(items)
    ? items.filter((item) => item && item.status === "Active")
    : [];
  const selectedItem = activeItems.find((item) => String(item.id) === String(product));
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
  const isDeliveryAddress = (item) =>
    item?.type === "Delivery" || item?.type === "Shipping";
  const locations = Array.isArray(customer?.addresses)
    ? customer.addresses.filter((item) => item && typeof item === "object" && isDeliveryAddress(item))
    : [];
  const locationLabel = (item) =>
    [item?.type, item?.line1, item?.city, item?.country].filter(Boolean).join(" · ");
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
    setDraft({});
    setError("");
    setCustomerId("");
    setContractId("");
    setProduct("");
    setLoadingBay("");
    setTransporterId("");
    setVehicleId("");
    setDriverId("");
    setDeliveryLocation("");
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
        reportingDateTime: `${request.deliveryDate} 08:00`,
        millLocationGate: request.loadingBay || "Mill Gate",
        product: request.product,
        vehicleType: selectedVehicle?.vehicle_type || "Configured vehicle",
        quantity: request.deliveryQuantity || request.requestedQuantity || null,
      }),
    });
  };
  const save = async (event) => {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || "submit";
    const form = event.currentTarget;
    const rawData = {
      ...draft,
      ...Object.fromEntries(new FormData(form).entries()),
    };
    const {
      requestedQuantity: _requestedQuantity,
      deliveryQuantity: rawDeliveryQuantity,
      plannedLoadingDate: _plannedLoadingDate,
      loadingInstructions: _loadingInstructions,
      unitPrice: _unitPrice,
      taxRate: _taxRate,
      finalAmount: _finalAmount,
      ...data
    } = rawData;
    if (!customer) return setError("Select an active customer.");
    if (!contract)
      return setError("Select a contract for the selected customer.");
    if (!selectedItem) return setError("Select an active item.");
    if (!/^\d+(\.\d{1,2})?$/.test(String(rawDeliveryQuantity || "")) || Number(rawDeliveryQuantity) <= 0)
      return setError("Enter a delivery quantity greater than zero with up to 2 decimal places.");
    const deliveryQuantity = Number(rawDeliveryQuantity).toFixed(2);
    const request = {
      id: Date.now(),
      requestNo: makeNumber("DR"),
      requestDate: formatDate(new Date()),
      loadingInstructionNo: makeNumber("LI"),
      customerName: customer?.display_name || customer?.legal_name || "",
      contractNumber: contract?.contract_number || "",
      transporter: transporterName,
      vehicle: data.vehicleId,
      driver: data.driverId,
      createdBy: "Sean Shapiro",
      createdAt: editing?.createdAt || new Date().toISOString(),
      status: action === "draft" ? "DRAFT" : "PLANNED",
      loadingPlanStatus:
        action === "draft" ? "DRAFT" : "PENDING_LOGISTICS_ASSIGNMENT",
      attachmentName: form.elements.attachment?.files[0]?.name || "",
      ...data,
      deliveryQuantity,
      requestedQuantity: deliveryQuantity,
      itemId: selectedItem.id,
      product: selectedItem.name,
      uom: "MT",
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
          setProduct(String(selected.itemId || activeItems.find((item) => item.name === selected.product)?.id || ""));
          setTransporterId(transporterMatch?.id || "");
          setVehicleId(selected.vehicle || "");
          setDriverId(selected.driver || "");
          setLoadingBay(selected.loadingBay || "");
          setDeliveryLocation(selected.deliveryLocation || "");
          setDraft(selected);
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
                <th>Delivery Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((request) => (
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
                  <td>{formatDate(request.deliveryDate)}</td>
                  <td>
                    <StatusBadge status={lifecycleStatus(request)} />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan="7" className="master-empty">
                    No delivery requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination}
      </section>
      {showForm && (
        <div className="master-modal-backdrop">
          <form className="master-form delivery-request-form" onSubmit={save}>
            <div className="master-form-head">
              <div>
                <span>CUSTOMERS / DELIVERY REQUESTS</span>
                <h2>New Delivery Request</h2>
                {/* Legacy step summary intentionally hidden: this is now a single-step form. */}
                {/* <p>
                  Step {step} of 2 ·{" "}
                  Complete delivery request and loading plan in one step.
                </p> */}
                <p>Complete the delivery request and loading plan in one step.</p>
              </div>
              <IconButton type="button" label="Close new delivery request" onClick={resetForm}>
                ×
              </IconButton>
            </div>
            {error && <Alert tone="error" className="master-error">{error}</Alert>}
            <>
                <div className="master-form-grid delivery-request-fields">
                    <Field label="Customer" required>
                      <select
                        name="customerId"
                        value={customerId}
                        onChange={(event) => {
                          setCustomerId(event.target.value);
                          setContractId("");
                          setProduct("");
                          const selectedCustomer = customerRows.find((item) => String(item.id) === String(event.target.value));
                           const selectedLocation = selectedCustomer?.addresses?.find(isDeliveryAddress);
                          setDeliveryLocation(locationLabel(selectedLocation));
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
                      <TextInput
                        name="customerPo"
                        defaultValue={editing?.customerPo || ""}
                      />
                    </Field>
                    <Field label="Delivery Location" required>
                      <select
                        key={customerId}
                        name="deliveryLocation"
                        value={deliveryLocation}
                        onChange={(event) => setDeliveryLocation(event.target.value)}
                        required
                        disabled={!customerId}
                      >
                        <option value="">Select customer delivery address...</option>
                        {locations.slice(0, 1).map((item, index) => (
                          <option key={index} value={locationLabel(item)}>
                            {/* [item.type, item.line1, item.city, item.country]
                              .filter(Boolean)
                              .join(" · ")}
                            */}{locationLabel(item)}
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
                    <Field label="Product" required className="delivery-product-field">
                      <select name="product" value={product} onChange={(event) => setProduct(event.target.value)} required>
                        <option value="">Select item from Item Master...</option>
                        {activeItems.map((item) => (
                          <option key={item.id} value={item.id}>{item.item_code} · {item.name} ({item.unit})</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Delivery Quantity" required className="delivery-quantity-field">
                      <QuantityInput
                        name="deliveryQuantity"
                        uom="MT"
                        decimals={2}
                        min="0.01"
                        max="999999999.99"
                        required
                        defaultValue={editing?.deliveryQuantity || editing?.requestedQuantity || ""}
                        aria-describedby="delivery-quantity-help"
                      />
                      <small id="delivery-quantity-help" className="ds-field-hint">Enter up to 2 decimal places.</small>
                    </Field>
                    <Field label="Remarks" className="delivery-remarks-field">
                      <textarea
                        name="remarks"
                        defaultValue={editing?.remarks || ""}
                        rows="5"
                      />
                    </Field>
                    <Field label="Attachment" className="delivery-attachment-field">
                      <input
                        name="attachment"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </Field>
                </div>
                <div className="master-form-actions">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    name="action"
                    value="draft"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    name="action"
                    value="submit"
                  >
                    Submit Request
                  </Button>
                </div>
            </>
          </form>
        </div>
      )}
    </main>
  );
}
