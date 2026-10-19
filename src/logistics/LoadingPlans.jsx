import React, { useEffect, useState } from "react";
import "../masters/masters.css";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import "./loading-plans.css";
import "./loading-plan-progress.css";
import "./loading-plan-operation.css";
import "./loading-plan-checklists.css";
import { formatDate, formatDateTime, formatVehiclePlate } from "../shared/formatters.js";
import { ActionMenu, ActivityTimeline, Badge, DetailValue, DrawerCloseButton, FormField, ImageCarousel, NumberInput, ReadOnlyField, ReadOnlySummary, ReferenceCode, StatusBadge } from "../design-system/index.js";
import { QuantityInput } from "../design-system/form-fields.jsx";
import { getLoadingPlanExecutionSteps, getLoadingPlanNextAction } from "./dispatchWorkflow.js";
import { DEVELOPMENT_LOADING_PLAN, DEVELOPMENT_LOADING_PLAN_LEGACY_REQUEST_NO } from "../commercial/development-flow-fixture.js";

const KEY = "rockeye.commercial.deliveryRequests";
const CONFIRMED_QUANTITY_REPAIRS = {
  "DR-20261013-7766": "3000.00",
};
const value = (v, fallback = "—") =>
  v === undefined || v === null || v === "" ? fallback : v;
const planQuantity = (plan = {}) => {
  const linkedRequest =
    plan.deliveryRequest ||
    plan.deliveryRequestDetails ||
    plan.delivery_request ||
    plan.deliveryRequestData ||
    plan.delivery_request_data ||
    plan.request;
  const candidates = [
    plan.deliveryQuantity,
    plan.deliveryRequestQuantity,
    plan.requestedQuantity,
    plan.quantity,
    plan.loadingQuantity,
    plan.deliveryQty,
    plan.requestedQty,
    plan.plannedQuantity,
    plan.delivery_quantity,
    plan.delivery_request_quantity,
    plan.requested_quantity,
    plan.delivery_qty,
    plan.planned_quantity,
    plan.quantity_mt,
    plan.deliveryQuantityMt,
    plan.requestedQuantityMt,
    linkedRequest?.deliveryQuantity,
    linkedRequest?.deliveryRequestQuantity,
    linkedRequest?.requestedQuantity,
    linkedRequest?.quantity,
    linkedRequest?.delivery_quantity,
    linkedRequest?.delivery_qty,
    linkedRequest?.quantity_mt,
  ];
  return candidates.find((quantity) => {
    if (quantity === undefined || quantity === null || quantity === "") return false;
    const numericQuantity = typeof quantity === "number"
      ? quantity
      : Number(String(quantity).trim().match(/^\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(numericQuantity) && numericQuantity > 0;
  })?.toString().match(/^\d+(?:\.\d+)?/)?.[0];
};
const waybillNumber = (plan) =>
  plan.waybillNo || `WBILL-${String(plan.id || "PLAN").slice(-8).toUpperCase()}`;
const waybillUrl = (plan) =>
  `${window.location.origin}${window.location.pathname}?loadingPlan=${encodeURIComponent(plan.id)}&waybill=${encodeURIComponent(waybillNumber(plan))}`;
const WaybillQr = ({ plan, size = 54 }) => {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(waybillUrl(plan), { width: size * 3, margin: 1 })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [plan, size]);
  return src ? <img className="waybill-qr" width={size} height={size} src={src} alt={`QR for ${waybillNumber(plan)}`} /> : <span className="waybill-qr-placeholder">QR</span>;
};
const downloadWaybill = async (plan) => {
  const number = waybillNumber(plan);
  const qr = await QRCode.toDataURL(waybillUrl(plan), { width: 220, margin: 1 });
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  let y = 18;
  doc.setTextColor(24, 36, 59);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("OUTBOUND WAYBILL", left, y);
  doc.addImage(qr, "PNG", 168, 12, 25, 25);
  y += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(82, 101, 127);
  doc.text(`Waybill No: ${number}`, left, y);
  doc.text(`Generated: ${plan.waybillGeneratedAt ? new Date(plan.waybillGeneratedAt).toLocaleString() : new Date().toLocaleString()}`, left, y + 5);
  const section = (title, entries) => {
    y += 14;
    doc.setFillColor(245, 248, 251);
    doc.roundedRect(left, y - 5, 174, 8 + entries.length * 6, 2, 2, "F");
    doc.setTextColor(24, 36, 59);
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.text(title, left + 4, y);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    entries.forEach(([label, entry]) => {
      y += 6;
      doc.setTextColor(132, 146, 166);
      doc.text(`${label}:`, left + 4, y);
      doc.setTextColor(52, 64, 84);
      doc.text(String(value(entry)), left + 42, y);
    });
  };
  section("SUPPLIER / CUSTOMER", [["Supplier", plan.supplierName || plan.supplier], ["Customer", plan.customerName], ["Delivery location", plan.deliveryLocation || plan.millLocationGate]]);
  section("CARGO", [["Product", plan.product], ["Quantity", `${value(plan.netWeight)} ${value(plan.uom, "MT")}`], ["Quality", plan.qualityReleased ? "Released" : "Pending"], ["Quality result", plan.qualityRemarks || "Released for dispatch"]]);
  section("TRANSPORT", [["Transporter", plan.transporter], ["Driver", plan.driver], ["Vehicle", plan.vehicle], ["Loading bay", plan.loadingBay]]);
  section("WEIGHMENT", [["Weighbridge ticket", plan.emptyWeighbridgeTicket], ["First tare", `${value(plan.tareWeight)} MT`], ["Loaded gross", `${value(plan.grossWeight)} MT`], ["Certified net", `${value(plan.netWeight)} MT`]]);
  y += 12;
  doc.setTextColor(132, 146, 166);
  doc.setFontSize(8);
  doc.text("Scan the QR code to open the Loading Plan details in the mill system.", left, y);
  doc.save(`${number}.pdf`);
};
const read = () => {
  try {
    const records = JSON.parse(localStorage.getItem(KEY) || "[]");
    const safeRecords = Array.isArray(records) ? records : [];
    if (import.meta.env.DEV) {
      const migrated = safeRecords.map((record) => record.requestNo === DEVELOPMENT_LOADING_PLAN_LEGACY_REQUEST_NO ? { ...record, ...DEVELOPMENT_LOADING_PLAN } : record);
      const next = migrated.some((record) => record.requestNo === DEVELOPMENT_LOADING_PLAN.requestNo) ? migrated : [DEVELOPMENT_LOADING_PLAN, ...migrated];
      if (JSON.stringify(next) !== JSON.stringify(safeRecords)) localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    }
    let changed = false;
    const normalized = safeRecords.map((record) => {
      const confirmedQuantity =
        CONFIRMED_QUANTITY_REPAIRS[record.requestNo] ||
        CONFIRMED_QUANTITY_REPAIRS[record.loadingInstructionNo];
      const resolvedQuantity = planQuantity(record) || confirmedQuantity;
      if (resolvedQuantity === undefined || record.deliveryQuantity === resolvedQuantity) return record;
      changed = true;
      // Backfill the canonical field from an existing business value or an
      // explicitly confirmed data repair for a known incomplete record.
      return {
        ...record,
        deliveryQuantity: resolvedQuantity,
        requestedQuantity: record.requestedQuantity || resolvedQuantity,
        uom: record.uom || "MT",
      };
    });
    if (changed) localStorage.setItem(KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
};
const status = (p) =>
  p.status === "CANCELLED" || p.loadingPlanStatus === "CANCELLED"
    ? "CANCELLED"
    : p.vehicleExitAt
      ? "COMPLETED"
      : p.dispatchAt
        ? "DISPATCHED"
        : p.postLoadingChecklistAt && p.secondWeighmentAt
          ? "LOADED"
          : p.loadingCompletedAt
            ? "LOADED"
            : p.loadingStartedAt
              ? "LOADING IN PROGRESS"
              : p.transporter
                ? "ASSIGNED"
                : p.status === "DRAFT"
                  ? "DRAFT"
                : "AWAITING LOGISTICS";
const Detail = ({ label, value: v, pending = false }) => (
  <div>
    <span>{label}</span>
    <strong><DetailValue value={v} pending={pending} /></strong>
  </div>
);
const State = ({ label, done, value: v }) => (
  <div>
    <span className={done ? "done" : "pending"}>{done ? "✓" : "○"}</span>
    <strong>{label}</strong>
    <em>{v}</em>
  </div>
);

function OperationForm({ action, plan, close, submit }) {
  const ticket =
    plan.emptyWeighbridgeTicket ||
    `WB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(plan.id).slice(-4)}`;
  const sample =
    plan.sampleReference ||
    `SAMPLE-${String(plan.requestNo || plan.id).replace(/[^A-Za-z0-9]/g, "")}`;
  const pre = [
    ["Tanker compartment is clean", "clean"],
    ["Tanker compartment is dry", "dry"],
    [
      "No foreign material or previous cargo residue observed",
      "foreignMaterial",
    ],
    ["No abnormal odour observed", "odour"],
    ["Tanker body, manhole and internal condition acceptable", "bodyCondition"],
    ["Outlet valve closed and in serviceable condition", "outletClosed"],
  ];
  const post = [
    ["Outlet valve is fully closed", "outletClosed"],
    ["Manhole / hatch is properly closed", "manholeClosed"],
    ["Loading hose / coupling disconnected safely", "hoseDisconnected"],
    ["No residual product leakage at connection point", "noLeakage"],
    ["Vehicle exterior is free from significant CPO spillage", "noSpillage"],
  ];
  const [data, setData] = useState(
    action === "assign"
      ? {
          transporter: plan.transporter || "",
          vehicle: plan.vehicle || "",
          driver: plan.driver || "",
          loadingBay: plan.loadingBay || "",
          loadingLine: plan.loadingLine || "",
          sourceStorage: plan.sourceStorage || "",
        }
      : action === "arrival"
        ? { tareWeight: plan.tareWeight || plan.emptyTareWeight || "" }
        : action === "load"
          ? { actualLoadingQuantity: plan.actualLoadingQuantity || "" }
          : action === "exit"
      ? {
          grossWeight: plan.secondGrossWeight || plan.grossWeight || "",
          tare: plan.secondTareWeight || plan.tareWeight || plan.emptyTareWeight || "",
          secondRemarks: plan.secondRemarks || "",
        }
      : action === "pre"
        ? {
            ...Object.fromEntries(pre.map(([, key]) => [key, "pending"])),
            finalStatus: "",
          }
      : action === "post"
        ? {
            ...Object.fromEntries(post.map(([, key]) => [key, "pending"])),
            sampleCollectedCheck: "pending",
            qualityTestingCheck: "pending",
            postFinalStatus: "",
            postLoadingRemarks: "",
          }
      : action === "seal"
        ? {
            seals: (Array.isArray(plan.sealNumbers)
              ? plan.sealNumbers
              : String(plan.sealNumbers || "").split(",").filter(Boolean)
            ).map((seal) =>
              typeof seal === "string" ? { sealNumber: seal } : seal,
            ).length
              ? (Array.isArray(plan.sealNumbers)
                  ? plan.sealNumbers
                  : String(plan.sealNumbers || "").split(",").filter(Boolean)
                ).map((seal) =>
                  typeof seal === "string" ? { sealNumber: seal } : seal,
                )
              : [{ sealNumber: "" }],
            sealRemarks: plan.sealRemarks || "",
          }
      : { sampleReference: sample },
  );
  const [validationError, setValidationError] = useState("");
  const [transporters, setTransporters] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("rockeye.master.transporters") || "[]",
      );
      const storedTanks = JSON.parse(
        localStorage.getItem("rockeye.master.tanks") || "[]",
      );
      setTanks(
        Array.isArray(storedTanks) && storedTanks.length
          ? storedTanks
          : [
              { id: "TANK-001", code: "CPO-TANK-01", name: "CPO Tank 01", compatibleMaterial: "CPO", active: true },
              { id: "TANK-002", code: "CPO-TANK-02", name: "CPO Tank 02", compatibleMaterial: "CPO", active: true },
              { id: "TANK-003", code: "CPO-TANK-03", name: "CPO Tank 03", compatibleMaterial: "CPO", active: true },
              { id: "TANK-004", code: "CPO-TANK-04", name: "CPO Tank 04", compatibleMaterial: "CPO", active: true },
              { id: "TANK-005", code: "PK-TANK-01", name: "Palm Kernel Tank 01", compatibleMaterial: "PK", active: true },
              { id: "TANK-006", code: "CPO-TANK-05", name: "CPO Tank 05", compatibleMaterial: "CPO", active: true },
            ],
      );
      setTransporters(
        Array.isArray(stored) && stored.length
          ? stored
          : [
              { id: "TR-MY-001", companyName: "Kencana Haulage Sdn. Bhd.", status: "Active" },
              { id: "TR-MY-002", companyName: "Southern Palm Logistics Sdn. Bhd.", status: "Active" },
              { id: "TR-MY-003", companyName: "Perak Bulk Transport Sdn. Bhd.", status: "Active" },
              { id: "TR-MY-005", companyName: "East Coast Fleet Services Sdn. Bhd.", status: "Active" },
            ],
      );
    } catch {}
    Promise.all([
      fetch("/api/vehicles").then((response) => response.json()),
      fetch("/api/drivers").then((response) => response.json()),
    ])
      .then(([vehicleRows, driverRows]) => {
        setVehicles(Array.isArray(vehicleRows) ? vehicleRows : []);
        setDrivers(Array.isArray(driverRows) ? driverRows : []);
      })
      .catch(() => {});
  }, []);
  const set = (name, val) => setData((current) => ({ ...current, [name]: val }));
  const updateSeal = (index, value) =>
    setData((current) => ({
      ...current,
      seals: current.seals.map((seal, sealIndex) =>
        sealIndex === index ? { ...seal, sealNumber: value } : seal,
      ),
    }));
  const addSeal = () =>
    setData((current) => ({
      ...current,
      seals: [...current.seals, { sealNumber: "" }],
    }));
  const removeSeal = (index) =>
    setData((current) => ({
      ...current,
      seals: current.seals.filter((_, sealIndex) => sealIndex !== index),
    }));
  const uploadEvidence = async (checkpoint, fileList, storageKey = "preLoadingAttachments") => {
    const files = Array.from(fileList || []).filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
    );
    const images = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result,
              });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          }),
      ),
    );
    const validImages = images.filter(Boolean);
    if (!validImages.length) return;
    setData((current) => ({
      ...current,
      [storageKey]: {
        ...(current[storageKey] || {}),
        [checkpoint]: [
          ...(current[storageKey]?.[checkpoint] || []),
          ...validImages,
        ],
      },
    }));
  };
  const uploadDocuments = async (fileList, storageKey) => {
    const files = Array.from(fileList || []).filter((file) =>
      (file.type.startsWith("image/") || file.type === "application/pdf") && file.size <= 10 * 1024 * 1024,
    );
    const documents = await Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    })));
    const validDocuments = documents.filter(Boolean);
    if (!validDocuments.length) return;
    setData((current) => ({ ...current, [storageKey]: [...(current[storageKey] || []), ...validDocuments] }));
  };
  const selectedTransporter = transporters.find(
    (item) => (item.companyName || item.tradingName) === data.transporter,
  );
  const transporterName = selectedTransporter?.companyName || data.transporter;
  const availableVehicles = vehicles.filter(
    (item) => item.status === "ACTIVE" && item.transporter === transporterName,
  );
  const availableDrivers = drivers.filter(
    (item) => item.status === "ACTIVE" && item.transporter === transporterName,
  );
  const checks = action === "pre" ? pre : post;
  const decisionField = action === "post" ? "postFinalStatus" : "finalStatus";
  const deliveryQuantity = Number(planQuantity(plan) || 0);
  const enteredLoadingQuantity = Number(data.actualLoadingQuantity || 0);
  const loadingQuantityDifference = deliveryQuantity - enteredLoadingQuantity;
  const tareWeight = Number(data.tare || 0);
  const maximumGrossWeight = deliveryQuantity + tareWeight;
  const save = (e) => {
    e.preventDefault();
    const fail = (message) => {
      setValidationError(message);
    };
    setValidationError("");
    if (action === "assign" && (!data.transporter || !data.vehicle || !data.driver || !data.sourceStorage))
      return fail("Select a transporter, vehicle, driver, and storage tank before saving.");
    const plannedQuantity = Number(planQuantity(plan) ?? 0);
    if (action === "load") {
      const enteredQuantity = Number(data.actualLoadingQuantity);
      if (plannedQuantity <= 0)
        return fail("Delivery Quantity is not available for this Loading Plan.");
      if (enteredQuantity <= 0)
        return fail("Enter the Actual Loading Quantity.");
      if (Math.abs(enteredQuantity - plannedQuantity) > 0.0001)
        return fail(`Actual Loading Quantity must equal ${plannedQuantity.toFixed(2)} ${plan.uom || "MT"}.`);
    }
    if (action === "exit") {
      const grossWeight = Number(data.grossWeight);
      const tare = Number(data.tare);
      if (grossWeight <= 0 || tare <= 0 || grossWeight < tare)
        return fail("Enter valid weights. Gross Weight must be greater than or equal to Tare Weight.");
      if (deliveryQuantity <= 0)
        return fail("Delivery Quantity is not available for this Loading Plan.");
      if (grossWeight > deliveryQuantity + tare + 0.0001)
        return fail(`Gross Weight cannot exceed ${maximumGrossWeight.toFixed(3)} MT (Delivery Quantity ${deliveryQuantity.toFixed(3)} MT + Tare Weight ${tare.toFixed(3)} MT).`);
    }
    if (
      action === "sample" &&
      ["ffa", "dobi", "moisture", "dirt"].some(
        (parameter) => data[parameter] === undefined || data[parameter] === "" || Number.isNaN(Number(data[parameter])),
      )
      )
      return fail("Enter all required quality values.");
    if (action === "pre" && checks.some(([, n]) => data[n] !== "yes"))
      return fail("Complete all pre-loading checklist items.");
    if (action === "pre" && !data.finalStatus)
      return fail("Select the pre-loading checklist status.");
    if (
      action === "pre" &&
      data.finalStatus === "override" &&
      !data.preLoadingRemarks?.trim()
    )
      return fail("Add remarks when overriding the pre-loading checklist.");
    if (action === "post" && checks.some(([, n]) => data[n] !== "yes"))
      return fail("Complete all post-loading checklist items.");
    if (action === "post" && (data.sampleCollectedCheck !== "yes" || data.qualityTestingCheck !== "yes"))
      return fail("Complete the sample and quality testing checks.");
    if (action === "post" && (!plan.sampleCollectedAt || !plan.qualityReleased))
      return fail("Sample collection and quality release must be completed first.");
    if ((action === "pre" || action === "post") && !data[decisionField])
      return fail("Select the checklist decision.");
    if (action === "post" && data[decisionField] === "override" && !data.postLoadingRemarks?.trim())
      return fail("Add remarks when overriding the post-loading checklist.");
    if (action === "seal" && (!data.seals?.length || data.seals.some((seal) => !seal.sealNumber?.trim())))
      return fail("Enter at least one seal number.");
    submit(data);
  };
  const field = (label, name, type = "text", required = false) => (
    <label>
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      <input
        type={type}
        value={data[name] || ""}
        onChange={(e) => set(name, e.target.value)}
        required={required}
      />
    </label>
  );
  return (
    <div className={`loading-plan-form-overlay${action === "assign" ? " logistics-assignment-overlay" : action === "arrival" ? " vehicle-arrival-overlay" : action === "load" ? " loading-execution-overlay" : action === "sample" ? " sample-quality-overlay" : action === "seal" ? " seal-record-overlay" : action === "exit" ? " second-weighment-overlay" : ""}`}>
      <form className={`loading-plan-operation-form${action === "assign" ? " logistics-assignment-drawer" : action === "arrival" ? " vehicle-arrival-drawer" : action === "load" ? " loading-execution-drawer" : action === "sample" ? " sample-quality-drawer" : action === "seal" ? " seal-record-drawer" : action === "exit" ? " second-weighment-drawer" : ""}`} onSubmit={save}>
        <div className={`master-form-head${action === "arrival" ? " vehicle-arrival-header" : action === "load" ? " loading-execution-header" : action === "sample" ? " sample-quality-header" : action === "seal" ? " seal-record-header" : action === "exit" ? " second-weighment-header" : ""}`}>
          <div>
            <span>LOGISTICS / LOADING PLAN</span>
            <h2>
              {action === "assign"
                ? "Logistics Assignment"
                : action === "load"
                  ? "Loading Execution"
                  : action === "arrival"
                ? "Vehicle Arrival & First Weighment"
                : action === "pre"
                  ? "Pre-Loading Checklist"
                  : action === "sample"
                    ? "Sample Collection & Quality"
                    : action === "seal"
                      ? "Record Seal"
                      : action === "post"
                        ? "Post-Loading Checklist"
                        : action === "exit"
                          ? "Second Weighment & Vehicle Exit"
                          : "Loading Operation"}
            </h2>
            <ReferenceCode>{plan.loadingInstructionNo || plan.requestNo}</ReferenceCode>
          </div>
          <DrawerCloseButton onClick={close} label="Close logistics assignment" />{/*
            ×
          */}
        </div>
        {validationError && <div className="form-error" role="alert">{validationError}</div>}
        {action === "assign" && (
          <div className="loading-plan-assignment-form logistics-assignment-form">
            <ReadOnlySummary title="Delivery Request" reference={plan.requestNo} className="logistics-assignment-summary">
              <ReadOnlyField label="Customer / Consignee" value={plan.customerName} pending={!plan.customerName} />
              <ReadOnlyField label="Delivery Destination" value={plan.deliveryLocation || plan.millLocationGate || "Mill Gate"} />
              <ReadOnlyField label="Delivery Date" value={formatDate(plan.deliveryDate)} pending={!plan.deliveryDate} />
              <ReadOnlyField label="Delivery Quantity" value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || "MT"}` : undefined} pending={!planQuantity(plan)} meta={plan.product ? `Product: ${plan.product}` : undefined} emphasis />
            </ReadOnlySummary>
            <section className="loading-plan-assignment-section logistics-assignment-entry">
              <div className="loading-plan-assignment-heading"><h3>Transporter Assignment</h3><span>Required before vehicle arrival</span></div>
              <div className="loading-plan-operation-fields">
                <label className="assignment-transporter"><span>Transporter Company<em>*</em></span><select value={data.transporter || ""} onChange={(e) => set("transporter", e.target.value)} required><option value="">Select transporter...</option>{transporters.filter((item) => String(item.status || "Active").toLowerCase() === "active").map((item) => <option key={item.id} value={item.companyName || item.tradingName}>{item.companyName || item.tradingName}</option>)}</select></label>
                <label><span>Vehicle<em>*</em></span><select value={data.vehicle || ""} onChange={(e) => set("vehicle", e.target.value)} required disabled={!data.transporter}><option value="">Select vehicle...</option>{availableVehicles.map((item) => <option key={item.id} value={item.registration_no}>{item.registration_no} · {item.vehicle_type}</option>)}</select></label>
                <label><span>Driver<em>*</em></span><select value={data.driver || ""} onChange={(e) => set("driver", e.target.value)} required disabled={!data.transporter}><option value="">Select driver...</option>{availableDrivers.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.license_no}</option>)}</select></label>
                <label><span>Storage Tank<em>*</em></span><select value={data.sourceStorage || ""} onChange={(e) => set("sourceStorage", e.target.value)} required><option value="">Select tank...</option>{tanks.filter((tank) => tank.active !== false && tank.name !== "Palm Kernel Tank 01").map((tank) => <option key={tank.id} value={tank.name || tank.code}>{tank.name || tank.code} · {tank.compatibleMaterial || "Configured material"}</option>)}</select></label>
              </div>
              {plan.loadingInstructions && <div className="assignment-instructions"><span>Special Loading Instructions</span><p>{plan.loadingInstructions}</p></div>}
            </section>
          </div>
        )}
        {action === "load" && (
          <div className="loading-execution-form">
            <ReadOnlySummary title="Loading Plan" reference={plan.requestNo} className="loading-execution-summary">
              <ReadOnlyField label="Loading Plan No." value={plan.loadingInstructionNo} pending={!plan.loadingInstructionNo} />
              <ReadOnlyField label="Customer / Consignee" value={plan.customerName} pending={!plan.customerName} />
              <ReadOnlyField label="Product" value={plan.product} pending={!plan.product} />
              <ReadOnlyField label="Delivery Quantity" value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || "MT"}` : undefined} pending={!planQuantity(plan)} emphasis />
              <ReadOnlyField label="Transporter" value={plan.transporter} pending={!plan.transporter} />
              <ReadOnlyField label="Storage Tank" value={plan.sourceStorage} pending={!plan.sourceStorage} />
              <ReadOnlyField label="Vehicle" value={plan.vehicle} pending={!plan.vehicle} />
              <ReadOnlyField label="Driver" value={plan.driver} pending={!plan.driver} />
            </ReadOnlySummary>
            <section className="loading-execution-weight-overview">
              <div className="loading-execution-section-heading"><h3>Weight Overview</h3><span>Recorded weighbridge values</span></div>
              <div className="loading-execution-weight-cards">
                <div><span>Gross Weight (MT)</span><strong>{plan.grossWeight ? Number(plan.grossWeight).toFixed(3) : "Pending"}</strong><small>{plan.grossWeight ? "Recorded" : "Awaiting reading"}</small></div>
                <div className="tare"><span>Tare Weight (MT)</span><strong>{plan.tareWeight || plan.emptyTareWeight ? Number(plan.tareWeight || plan.emptyTareWeight).toFixed(3) : "Pending"}</strong><small>{plan.tareWeight || plan.emptyTareWeight ? "First weighment" : "Awaiting reading"}</small></div>
                <div className="net"><span>Net Weight (MT)</span><strong>{plan.netWeight ? Number(plan.netWeight).toFixed(3) : "Pending"}</strong><small>{plan.netWeight ? "Certified balance" : "Awaiting tare"}</small></div>
              </div>
            </section>
            <section className="loading-execution-entry">
              <div className="loading-execution-section-heading"><h3>Loading Quantity Entry</h3><span>Operational quantity</span></div>
              <label className="loading-execution-quantity-label">
              <span>Actual Loading Quantity (MT)<em>*</em></span>
              <QuantityInput min="0.01" decimals={2} required value={data.actualLoadingQuantity || ""} onChange={(event) => set("actualLoadingQuantity", event.target.value)} />
            </label>
            <p className={`loading-plan-calculation${enteredLoadingQuantity > 0 && Math.abs(loadingQuantityDifference) < 0.0001 ? " loading-plan-calculation-valid" : ""}`}>
              {enteredLoadingQuantity > 0
                ? Math.abs(loadingQuantityDifference) < 0.0001
                  ? `Entered quantity matches the Delivery Quantity: ${enteredLoadingQuantity.toFixed(2)} ${value(plan.uom, "MT")}`
                  : `Entered: ${enteredLoadingQuantity.toFixed(2)} ${value(plan.uom, "MT")} · Difference to Delivery Quantity: ${Math.abs(loadingQuantityDifference).toFixed(2)} ${value(plan.uom, "MT")}`
                : `Delivery Quantity: ${value(planQuantity(plan))} ${value(plan.uom, "MT")}`}
            </p>
            </section>
          </div>
        )}
        {action === "arrival" && (
          <div className="loading-plan-weighment-form">
            <section className="loading-plan-assignment-summary">
              <div className="assignment-summary-heading"><span>Loading Plan Reference</span><strong>{value(plan.loadingInstructionNo || plan.requestNo)}</strong></div>
              <div className="loading-plan-operational-summary">
                <div className="loading-plan-summary-group">
                  <h4>Delivery Context</h4>
                  <div className="assignment-summary-grid">
                    <ReadOnlyField label="Delivery Request" value={plan.requestNo} pending={!plan.requestNo} />
                    <ReadOnlyField label="Customer" value={plan.customerName} pending={!plan.customerName} />
                    <ReadOnlyField label="Delivery Date" value={formatDate(plan.deliveryDate)} pending={!plan.deliveryDate} />
                  </div>
                </div>
                <div className="loading-plan-summary-group">
                  <h4>Loading Plan</h4>
                  <div className="assignment-summary-grid">
                    <ReadOnlyField label="Product" value={plan.product} pending={!plan.product} />
                    <ReadOnlyField label="Delivery Quantity" value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || "MT"}` : undefined} pending={!planQuantity(plan)} emphasis />
                    <ReadOnlyField label="Storage Tank" value={plan.sourceStorage} pending={!plan.sourceStorage} />
                  </div>
                </div>
                <div className="loading-plan-summary-group">
                  <h4>Transport Assignment</h4>
                  <div className="assignment-summary-grid">
                    <ReadOnlyField label="Transporter" value={plan.transporter} pending={!plan.transporter} />
                    <ReadOnlyField label="Vehicle" value={plan.vehicle} pending={!plan.vehicle} />
                    <ReadOnlyField label="Driver" value={plan.driver} pending={!plan.driver} />
                  </div>
                </div>
              </div>
            </section>
            <section className="loading-plan-weighment-entry">
              <div className="loading-plan-assignment-heading"><h3>Vehicle Arrival &amp; First Weighment</h3><span>Weighbridge entry</span></div>
              <p className="readonly-operation-field">Weighbridge Ticket No.: {ticket} · System generated / readonly</p>
              <div className="loading-plan-operation-fields">{field("Tare Weight (MT)", "tareWeight", "number", true)}</div>
            </section>
          </div>
        )}
        {action === "exit" && (
          <div className="second-weighment-form">
            <ReadOnlySummary title="Second Weighment & Vehicle Exit" reference={plan.requestNo || plan.loadingInstructionNo} className="second-weighment-summary">
              <ReadOnlyField label="Loading Plan No." value={plan.loadingInstructionNo} pending={!plan.loadingInstructionNo} />
              <ReadOnlyField label="Weighbridge Ticket" value={ticket} />
              <ReadOnlyField label="Customer / Consignee" value={plan.customerName} pending={!plan.customerName} />
              <ReadOnlyField label="Product" value={plan.product} pending={!plan.product} />
              <ReadOnlyField label="Delivery Quantity" value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || "MT"}` : undefined} pending={!planQuantity(plan)} emphasis />
              <ReadOnlyField label="Vehicle" value={plan.vehicle} pending={!plan.vehicle} />
              <ReadOnlyField label="Driver" value={plan.driver} pending={!plan.driver} />
              <ReadOnlyField label="Storage Tank" value={plan.sourceStorage} pending={!plan.sourceStorage} />
            </ReadOnlySummary>
            <section className="sample-quality-context">
              <div className="sample-quality-section-heading"><div><h3>Ticket &amp; Logistics Details</h3><p>Confirm the dispatch vehicle and weighbridge reference before recording the loaded reading.</p></div><span>Second weighing</span></div>
              <div className="sample-quality-context-grid">
                <div><span>Weighbridge Ticket</span><strong>{ticket}</strong></div>
                <div><span>Vehicle</span><strong>{value(plan.vehicle)}</strong></div>
                <div><span>Driver</span><strong>{value(plan.driver)}</strong></div>
                <div><span>Supplier / Customer</span><strong>{value(plan.customerName || plan.transporter)}</strong></div>
              </div>
            </section>
            <section className="sample-quality-section">
              <div className="sample-quality-section-heading"><div><h3>Weight Overview &amp; Balance</h3><p>Net weight is calculated automatically from gross and tare.</p></div><span>Unit: Metric Tonnes (MT)</span></div>
              <div className="second-weight-overview">
                <div><span>Gross Weight</span><strong>{data.grossWeight ? Number(data.grossWeight).toFixed(3) : "Pending"} <small>MT</small></strong><em>Enter loaded vehicle reading</em></div>
                <div className="second-weight-tare"><span>First Tare Weight</span><strong>{data.tare ? Number(data.tare).toFixed(3) : "Pending"} <small>MT</small></strong><em>System captured from first weighment</em></div>
                <div><span>Net Weight</span><strong>{data.grossWeight && data.tare ? (Number(data.grossWeight) - Number(data.tare)).toFixed(3) : "Pending"} <small>MT</small></strong><em>Auto calculated</em></div>
              </div>
            </section>
            <section className="sample-quality-section second-weighment-entry">
              <div className="sample-quality-section-heading"><div><h3>Second Weighment Entry</h3><p>Enter the loaded vehicle gross reading. Tare is carried forward from the first weighment.</p></div></div>
              <label><span>Gross Weight (MT) <em>*</em></span><input type="number" min="0" step="0.001" value={data.grossWeight || ""} onChange={(event) => set("grossWeight", event.target.value)} required placeholder="0.000" /></label>
              {data.grossWeight && data.tare && deliveryQuantity > 0 && Number(data.grossWeight) > maximumGrossWeight && (
                <p className="form-error" role="alert">Gross Weight cannot exceed {maximumGrossWeight.toFixed(3)} MT (Delivery Quantity + Tare Weight).</p>
              )}
              <p className="second-weight-help">Net Weight = Gross Weight − First Tare Weight. The certified net weight will be locked after saving.</p>
              <label><span>Remarks</span><textarea value={data.secondRemarks || ""} onChange={(event) => set("secondRemarks", event.target.value)} rows="3" placeholder="Add vehicle exit notes, exceptions, or observations..." /></label>
              <label><span>Attachments <small>(Optional · multiple image or PDF files)</small></span><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => uploadDocuments(event.target.files, "secondAttachments")} /></label>
            </section>
          </div>
        )}
        {action === "pre" && (
          <div className="preloading-inspection">
            <section className="preloading-summary">
              <div className="preloading-summary-grid">
                <div><span>Vehicle</span><strong>{value(plan.vehicle)}</strong></div>
                <div><span>Transporter</span><strong>{value(plan.transporter)}</strong></div>
                <div><span>Product</span><strong>{value(plan.product)}</strong></div>
                <div><span>Delivery Qty</span><strong>{value(planQuantity(plan))} {value(plan.uom, "MT")}</strong></div>
                <div><span>Source Tank</span><strong>{value(plan.sourceStorage)}</strong></div>
                <div><span>Loading Bay</span><strong>{value(plan.loadingBay)}</strong></div>
                <div><span>Tare Weight</span><strong>{plan.tareWeight ? `${Number(plan.tareWeight).toFixed(3)} MT` : "Pending"}</strong></div>
                <div><span>QC Status</span><strong className="preloading-qc-status">Pending</strong></div>
              </div>
            </section>
            <section>
              <div className="preloading-heading">
                <div>
                  <h3>Inspection Checklist</h3>
                  <p>Verify tanker compartment cleanliness, integrity, and safety protocols prior to loading authorization.</p>
                </div>
                <span className="preloading-count">{pre.length} Mandatory Checkpoints</span>
              </div>
              <div className="preloading-checklist">
                {pre.map(([label, name], index) => {
                  const descriptions = {
                    clean: "Verify zero residual liquid or previous cargo inside the compartment.",
                    dry: "No visible water, moisture, or condensation film.",
                    foreignMaterial: "No foreign material or previous cargo residue observed.",
                    odour: "No abnormal odour from previous cargo or contamination.",
                    bodyCondition: "Tanker body, manhole, and internal condition acceptable.",
                    outletClosed: "Outlet valve is closed and serviceable before loading.",
                  };
                  const selected = data[name] || "pending";
                  return (
                    <article className="preloading-check-row" key={name}>
                      <div className="preloading-check-copy">
                        <strong>{index + 1}. {label} <em aria-label="Mandatory">*</em></strong>
                        <small>{descriptions[name]}</small>
                      </div>
                      <div className="preloading-segmented" role="group" aria-label={`${label} result`}>
                        <button type="button" className={selected === "yes" ? "active yes" : ""} onClick={() => set(name, "yes")}>YES</button>
                        <button type="button" className={selected === "no" ? "active no" : ""} onClick={() => set(name, "no")}>NO</button>
                        <button type="button" className={selected === "na" ? "active na" : ""} onClick={() => set(name, "na")}>N/A</button>
                      </div>
                      <label className="preloading-attachment" title="Upload image evidence" aria-label={`Upload image evidence for ${label}`}>
                        <input type="file" accept="image/*" multiple onChange={(event) => uploadEvidence(name, event.target.files)} />
                        <span>📎{data.preLoadingAttachments?.[name]?.length ? ` ${data.preLoadingAttachments[name].length}` : ""}</span>
                      </label>
                    </article>
                  );
                })}
              </div>
            </section>
            <label className="preloading-remarks">
              <span>Final Remarks / Corrective Actions {data.finalStatus === "override" ? <em>*</em> : <small>(Optional)</small>}</span>
              <textarea name="preLoadingRemarks" value={data.preLoadingRemarks || ""} onChange={(e) => set("preLoadingRemarks", e.target.value)} rows="3" placeholder="Record corrective actions, exceptions, or inspection notes..." required={data.finalStatus === "override"} />
            </label>
          </div>
        )}
        {action === "post" && (
          <div className="preloading-inspection postloading-inspection">
            <section className="preloading-summary">
              <div className="preloading-summary-grid">
                <div><span>Vehicle</span><strong>{value(plan.vehicle)}</strong></div>
                <div><span>Transporter</span><strong>{value(plan.transporter)}</strong></div>
                <div><span>Product</span><strong>{value(plan.product)}</strong></div>
                <div><span>Loaded Qty</span><strong>{value(plan.loadedQuantity || planQuantity(plan))} {value(plan.uom, "MT")}</strong></div>
                <div><span>Loading Bay</span><strong>{value(plan.loadingBay)}</strong></div>
                <div><span>Storage Tank</span><strong>{value(plan.sourceStorage)}</strong></div>
                <div><span>Seal Status</span><strong className="preloading-qc-status">{plan.sealRecordedAt ? "Recorded" : "Pending"}</strong></div>
                <div><span>QC Status</span><strong className="preloading-qc-status">{plan.qualityReleased ? "Released" : "Pending"}</strong></div>
              </div>
            </section>
            <section>
              <div className="preloading-heading">
                <div><h3>Inspection Checklist</h3><p>Verify the vehicle is safe, sealed, and ready for dispatch clearance.</p></div>
                <span className="preloading-count">{post.length + 2} Mandatory Checkpoints</span>
              </div>
              <div className="preloading-checklist">
                {post.map(([label, name], index) => {
                  const descriptions = {
                    outletClosed: "Must be closed before dispatch.",
                    manholeClosed: "Must be secured before dispatch.",
                    hoseDisconnected: "Must be fully disconnected safely.",
                    noLeakage: "Leakage requires dispatch hold and corrective action.",
                    noSpillage: "Major spillage requires cleaning before movement.",
                  };
                  const selected = data[name] || "pending";
                  return (
                    <article className="preloading-check-row" key={name}>
                      <div className="preloading-check-copy"><strong>{index + 1}. {label} <em aria-label="Mandatory">*</em></strong><small>{descriptions[name]}</small></div>
                      <div className="preloading-segmented" role="group" aria-label={`${label} result`}>
                        <button type="button" className={selected === "yes" ? "active yes" : ""} onClick={() => set(name, "yes")}>YES</button>
                        <button type="button" className={selected === "no" ? "active no" : ""} onClick={() => set(name, "no")}>NO</button>
                        <button type="button" className={selected === "na" ? "active na" : ""} onClick={() => set(name, "na")}>N/A</button>
                      </div>
                      <label className="preloading-attachment" title="Upload image evidence" aria-label={`Upload image evidence for ${label}`}>
                        <input type="file" accept="image/*" multiple onChange={(event) => uploadEvidence(name, event.target.files, "postLoadingAttachments")} />
                        <span>📎{data.postLoadingAttachments?.[name]?.length ? ` ${data.postLoadingAttachments[name].length}` : ""}</span>
                      </label>
                    </article>
                  );
                })}
                <article className="preloading-check-row preloading-system-check">
                  <div className="preloading-check-copy"><strong>6. Required dispatch sample has been collected <em aria-label="Mandatory">*</em></strong><small>Sample record must exist before dispatch clearance.</small></div>
                  <div className="preloading-segmented" role="group" aria-label="Dispatch sample result"><button type="button" className={data.sampleCollectedCheck === "yes" ? "active yes" : ""} onClick={() => set("sampleCollectedCheck", "yes")}>YES</button><button type="button" className={data.sampleCollectedCheck === "no" ? "active no" : ""} onClick={() => set("sampleCollectedCheck", "no")}>NO</button><button type="button" className={data.sampleCollectedCheck === "na" ? "active na" : ""} onClick={() => set("sampleCollectedCheck", "na")}>N/A</button></div>
                  <label className="preloading-attachment" title="Upload image evidence" aria-label="Upload dispatch sample evidence"><input type="file" accept="image/*" multiple onChange={(event) => uploadEvidence("sampleCollectedCheck", event.target.files, "postLoadingAttachments")} /><span>📎{data.postLoadingAttachments?.sampleCollectedCheck?.length ? ` ${data.postLoadingAttachments.sampleCollectedCheck.length}` : ""}</span></label>
                </article>
                <article className="preloading-check-row preloading-system-check">
                  <div className="preloading-check-copy"><strong>7. Quality testing completed <em aria-label="Mandatory">*</em></strong><small>Released laboratory result must exist before dispatch clearance.</small></div>
                  <div className="preloading-segmented" role="group" aria-label="Quality testing result"><button type="button" className={data.qualityTestingCheck === "yes" ? "active yes" : ""} onClick={() => set("qualityTestingCheck", "yes")}>YES</button><button type="button" className={data.qualityTestingCheck === "no" ? "active no" : ""} onClick={() => set("qualityTestingCheck", "no")}>NO</button><button type="button" className={data.qualityTestingCheck === "na" ? "active na" : ""} onClick={() => set("qualityTestingCheck", "na")}>N/A</button></div>
                  <label className="preloading-attachment" title="Upload image evidence" aria-label="Upload quality testing evidence"><input type="file" accept="image/*" multiple onChange={(event) => uploadEvidence("qualityTestingCheck", event.target.files, "postLoadingAttachments")} /><span>📎{data.postLoadingAttachments?.qualityTestingCheck?.length ? ` ${data.postLoadingAttachments.qualityTestingCheck.length}` : ""}</span></label>
                </article>
              </div>
            </section>
            <label className="preloading-remarks"><span>Final Remarks / Corrective Actions {data.postFinalStatus === "override" ? <em>*</em> : <small>(Optional)</small>}</span><textarea value={data.postLoadingRemarks || ""} onChange={(event) => set("postLoadingRemarks", event.target.value)} rows="3" placeholder="Record dispatch exceptions, corrective actions, or observations..." required={data.postFinalStatus === "override"} /></label>
          </div>
        )}
        {action === "sample" && (
          <div className="sample-quality-form">
            <ReadOnlySummary title="Loading & Sample Details" reference={plan.requestNo || plan.loadingInstructionNo} className="sample-quality-summary">
              <ReadOnlyField label="Loading Plan No." value={plan.loadingInstructionNo} pending={!plan.loadingInstructionNo} />
              <ReadOnlyField label="Customer / Consignee" value={plan.customerName} pending={!plan.customerName} />
              <ReadOnlyField label="Product" value={plan.product} pending={!plan.product} />
              <ReadOnlyField label="Delivery Quantity" value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || "MT"}` : undefined} pending={!planQuantity(plan)} emphasis />
              <ReadOnlyField label="Vehicle" value={plan.vehicle} pending={!plan.vehicle} />
              <ReadOnlyField label="Driver" value={plan.driver} pending={!plan.driver} />
              <ReadOnlyField label="Storage Tank" value={plan.sourceStorage} pending={!plan.sourceStorage} />
              <ReadOnlyField label="Loaded Quantity" value={plan.loadedQuantity ? `${plan.loadedQuantity} ${plan.uom || "MT"}` : undefined} pending={!plan.loadedQuantity} />
            </ReadOnlySummary>
            <section className="sample-quality-section sample-quality-entry">
              <div className="sample-quality-section-heading"><div><h3>Sample Collection</h3><p>Confirm the system-generated sample reference before recording quality.</p></div><span>Required</span></div>
              <ReadOnlyField label="Sample Reference" value={sample} emphasis />
            </section>
            <section className="sample-quality-section sample-quality-entry">
              <div className="sample-quality-section-heading"><div><h3>Quality Parameters</h3><p>Enter the measured values from the laboratory result.</p></div><span className="sample-quality-required">All fields mandatory</span></div>
              <div className="sample-quality-parameter-grid">
                {[["FFA", "ffa"], ["DOBI", "dobi"], ["Moisture", "moisture"], ["Dirt", "dirt"]].map(([label, name]) => (
                  <FormField key={name} label={label} required>
                    <NumberInput name={name} min="0" step="0.001" required value={data[name] || ""} onChange={(event) => set(name, event.target.value)} placeholder="0.000" />
                  </FormField>
                ))}
              </div>
            </section>
            <section className="sample-quality-section sample-quality-entry sample-quality-notes">
              <div className="sample-quality-section-heading"><div><h3>Remarks &amp; Attachments</h3><p>Attach the laboratory report or supporting quality evidence.</p></div></div>
              <FormField label="Remarks" hint="Optional">
                <textarea value={data.qualityRemarks || ""} onChange={(event) => set("qualityRemarks", event.target.value)} rows="4" placeholder="Add quality observations or release notes..." />
              </FormField>
              <FormField label="Attachment" hint="Optional · PDF or image">
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => uploadDocuments(event.target.files, "qualityAttachments")} />
              </FormField>
            </section>
          </div>
        )}
        {action === "seal" && (
          <div className="seal-record-form">
            <ReadOnlySummary title="Loading & Seal Details" reference={plan.requestNo || plan.loadingInstructionNo} className="sample-quality-summary">
              <ReadOnlyField label="Loading Plan No." value={plan.loadingInstructionNo} pending={!plan.loadingInstructionNo} />
              <ReadOnlyField label="Customer / Consignee" value={plan.customerName} pending={!plan.customerName} />
              <ReadOnlyField label="Product" value={plan.product} pending={!plan.product} />
              <ReadOnlyField label="Delivery Quantity" value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || "MT"}` : undefined} pending={!planQuantity(plan)} emphasis />
              <ReadOnlyField label="Vehicle" value={plan.vehicle} pending={!plan.vehicle} />
              <ReadOnlyField label="Driver" value={plan.driver} pending={!plan.driver} />
              <ReadOnlyField label="Storage Tank" value={plan.sourceStorage} pending={!plan.sourceStorage} />
              <ReadOnlyField label="Loaded Quantity" value={plan.loadedQuantity ? `${plan.loadedQuantity} ${plan.uom || "MT"}` : undefined} pending={!plan.loadedQuantity} />
            </ReadOnlySummary>
            <section className="sample-quality-section sample-quality-entry">
              <div className="sample-quality-section-heading">
                <div><h3>Seal Registration</h3><p>Record every seal fitted to the vehicle before dispatch.</p></div>
                <span className="sample-quality-required">At least one required</span>
              </div>
              <div className="seal-record-list">
                {data.seals.map((seal, index) => (
                  <div className="seal-record-row" key={`seal-${index}`}>
                    <FormField label={`Seal Number ${index + 1}`} required>
                      <input value={seal.sealNumber || ""} onChange={(event) => updateSeal(index, event.target.value)} placeholder="Enter seal number" required />
                    </FormField>
                    <button type="button" className="btn btn-secondary" onClick={() => removeSeal(index)} disabled={data.seals.length === 1}>Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-secondary seal-add-button" onClick={addSeal}>+ Add another seal</button>
            </section>
            <section className="sample-quality-section sample-quality-entry sample-quality-notes">
              <div className="sample-quality-section-heading"><div><h3>Seal Remarks</h3><p>Add any seal condition or dispatch observation.</p></div></div>
              <FormField label="Remarks" hint="Optional">
                <textarea value={data.sealRemarks || ""} onChange={(event) => set("sealRemarks", event.target.value)} rows="4" placeholder="Add seal remarks or observations..." />
              </FormField>
            </section>
          </div>
        )}
        <div className="master-form-actions">
          {(action === "pre" || action === "post") && (
            <div className="preloading-final-status">
              <label>
                <span>Final Status <em>*</em></span>
                <select value={data[decisionField] || ""} onChange={(event) => set(decisionField, event.target.value)} required>
                  <option value="">Select status...</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="override">Override</option>
                </select>
              </label>
            </div>
          )}
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function LoadingPlanDetails({ plan, close, act }) {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("overview");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [attachmentViewer, setAttachmentViewer] = useState(null);
  const next = getLoadingPlanNextAction(plan);
  const run = (action, data = {}) => {
    setActionsOpen(false);
    setForm(null);
    act(action, data, plan);
  };
  const openForm = (action) => {
    setActionsOpen(false);
    setForm(action);
  };
  const actionItems = [
    ...(next[0] === "assign"
      ? [{ key: "assign", label: next[1], onClick: () => openForm("assign") }]
      : []),
    ...(next[0] === "arrival"
      ? [{ key: "arrival", label: next[1], onClick: () => openForm("arrival") }]
      : []),
    ...(["pre", "sample", "seal", "post", "exit", "load"].includes(next[0])
      ? [{ key: next[0], label: next[1], onClick: () => openForm(next[0]) }]
      : []),
    ...(next[0] === "start"
      ? [{ key: "start", label: next[1], onClick: () => run("start") }]
      : []),
    ...(!plan.vehicleArrivedAt && status(plan) !== "COMPLETED" && status(plan) !== "CANCELLED"
      ? [{ key: "cancel", label: "Cancel Loading Plan", danger: true, onClick: () => run("cancel") }]
      : []),
  ];
  const activities = (plan.auditEvents?.length ? plan.auditEvents : [
    { action: "created the loading plan", at: plan.createdAt || plan.created_at, actor: "System" },
  ]).map((event) => ({
    date: event.at ? formatDate(event.at) : formatDate(plan.deliveryDate),
    time: event.at ? new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    user: event.actor || "System User",
    role: "Logistics User",
    action: event.action || "updated the loading plan",
    detail: `Loading Plan ${plan.loadingInstructionNo || plan.requestNo} was updated through the workflow.`,
    tone: event.action === "cancel" ? "document" : event.action === "exit" ? "status" : "updated",
  }));
  const openAttachment = (files, index) => setAttachmentViewer({ files, index });
  return (
    <main className="masters-page loading-plans-page loading-plan-details-page">
      <div className="sales-contract-breadcrumb loading-plan-breadcrumb">
        <span>Logistics</span>
        <b>›</b>
        <span>Loading Plans</span>
        <b>›</b>
        <strong>Details</strong>
      </div>
      <div className="sales-contract-details-heading loading-plan-details-heading">
        <div>
          <div className="sales-contract-title-line">
            <h1>{value(plan.loadingInstructionNo, "Loading Plan")}</h1>
            <span className="customer-status">{status(plan)}</span>
          </div>
          <p>
            {value(plan.requestNo)} · {value(plan.customerName)}
          </p>
        </div>
        <div className="loading-plan-detail-actions">
          <button className="btn btn-secondary" onClick={close}>Back to Loading Plans</button>
          {actionItems.length > 0 && (
            <ActionMenu label="Actions" items={actionItems} open={actionsOpen} onToggle={() => setActionsOpen((open) => !open)} />
          )}
        </div>
      </div>
      <div className="loading-plan-detail-page-content">
        {/* Legacy drawer header intentionally removed from the page presentation. */}
        {false && (
          <div>
            <p>
              {value(plan.requestNo)} · {value(plan.customerName)}
            </p>
          <button className="icon-button" onClick={close}>
            ×
          </button>
          </div>
        )}
      <nav className="sales-contract-tabs loading-plan-detail-tabs" aria-label="Loading Plan details">
        {[
          ["overview", "Overview"],
          ["weighment", "Weighment"],
          ["quality", "Quality"],
          ["checklists", "Inspection Checklists"],
          ["dispatch", "Seals & Waybill"],
          ["activities", "Activities"],
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? "selected" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
        <section hidden={tab !== "overview"} className="loading-plan-detail-section">
          <h3>Loading Instruction</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Delivery Request" value={plan.requestNo} />
            <Detail label="Customer" value={plan.customerName} />
            <Detail label="Delivery Date" value={formatDate(plan.deliveryDate)} />
            <Detail label="Product" value={plan.product} />
            <Detail
              label="Quantity"
              value={planQuantity(plan) ? `${planQuantity(plan)} ${plan.uom || ""}`.trim() : undefined}
            />
            <Detail label="Transporter" value={plan.transporter} pending={!plan.transporter} />
            <Detail label="Vehicle" value={plan.vehicle} pending={!plan.transporter || !plan.vehicle} />
            <Detail label="Driver" value={plan.driver} pending={!plan.transporter || !plan.driver} />
            <Detail label="Loading Bay" value={plan.loadingBay} pending={!plan.loadingBay} />
            <Detail label="Tank" value={plan.sourceStorage} pending={!plan.sourceStorage} />
            <Detail label="Instructions" value={plan.loadingInstructions} />
          </div>
        </section>
        <section hidden={tab !== "overview"} className="loading-plan-detail-section">
          <h3>Loading Execution</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Loaded Quantity" value={plan.loadedQuantity !== undefined && plan.loadedQuantity !== null ? `${plan.loadedQuantity} ${plan.uom || ""}`.trim() : undefined} pending={!plan.loadingCompletedAt} />
            <Detail label="Execution Entries" value={plan.loadingExecutions?.length || 0} />
            <Detail label="Quality Release Status" value={plan.qualityReleased ? "Released" : undefined} pending={!plan.qualityReleased} />
          </div>
        </section>
        <section className="loading-plan-detail-section loading-plan-execution-timeline">
          <h3>Execution Record</h3>
          <div className="loading-plan-checklist">
            {getLoadingPlanExecutionSteps(plan).map((step) => (
              <State key={step.key} label={step.label} done={step.done} value={step.value} />
            ))}
          </div>
        </section>
        <section hidden={tab !== "weighment"} className="loading-plan-detail-section">
          <h3>Weighment Details</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Weighbridge Ticket" value={plan.emptyWeighbridgeTicket || plan.weighbridgeTicket} />
            <Detail label="First Tare Weight" value={plan.tareWeight ? `${plan.tareWeight} MT` : undefined} pending={!plan.tareWeight} />
            <Detail label="Loaded Gross Weight" value={plan.grossWeight ? `${plan.grossWeight} MT` : undefined} pending={!plan.grossWeight} />
            <Detail label="Certified Net Weight" value={plan.netWeight ? `${plan.netWeight} MT` : undefined} pending={!plan.netWeight} />
            <Detail label="Second Weighment Remarks" value={plan.secondRemarks} />
          </div>
        </section>
        <section hidden={tab !== "quality"} className="loading-plan-detail-section">
          <h3>Sample &amp; Quality Inputs</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Sample Reference" value={plan.sampleReference} />
            <Detail label="FFA" value={plan.ffa} />
            <Detail label="DOBI" value={plan.dobi} />
            <Detail label="Moisture" value={plan.moisture} />
            <Detail label="Dirt" value={plan.dirt} />
            <Detail label="Quality Remarks" value={plan.qualityRemarks} />
          </div>
          {plan.qualityAttachments?.length ? <div className="loading-plan-document-list">{plan.qualityAttachments.map((file, index) => <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}>{file.name}</a>)}</div> : <p className="muted">No quality attachments uploaded.</p>}
        </section>
        <section hidden={tab !== "weighment"} className="loading-plan-detail-section">
          <h3>Second Weighment Inputs</h3>
          <div className="loading-plan-detail-grid"><Detail label="Gross Weight Entered" value={plan.grossWeight ? `${plan.grossWeight} MT` : undefined} pending={!plan.secondWeighmentAt} /><Detail label="Tare From First Weighment" value={plan.tareWeight ? `${plan.tareWeight} MT` : undefined} pending={!plan.secondWeighmentAt} /><Detail label="Net Weight Calculated" value={plan.netWeight ? `${plan.netWeight} MT` : undefined} pending={!plan.secondWeighmentAt} /><Detail label="Remarks" value={plan.secondRemarks} /></div>
          {plan.secondAttachments?.length ? <div className="loading-plan-document-list">{plan.secondAttachments.map((file, index) => <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}>{file.name}</a>)}</div> : <p className="muted">No second-weighment attachments uploaded.</p>}
        </section>
        {plan.secondWeighmentAt && <section hidden={tab !== "dispatch"} className="loading-plan-detail-section waybill-detail-section">
          <div className="waybill-detail-heading"><div><h3>Waybill</h3><p>Generated from the certified second weighment.</p></div><button className="waybill-download-button" title="Download Waybill PDF" aria-label="Download Waybill PDF" onClick={() => downloadWaybill(plan)}>⇩</button></div>
          <div className="waybill-detail-content"><WaybillQr plan={plan} size={88} /><div><strong>{waybillNumber(plan)}</strong><span>Scan to view the Loading Plan details.</span><button className="btn btn-secondary" onClick={() => downloadWaybill(plan)}>Download Waybill PDF</button></div></div>
        </section>}
        <section hidden={tab !== "checklists"} className="loading-plan-detail-section loading-plan-accordion-section">
          <h3>Inspection Checklists</h3>
          <details className="loading-plan-checklist-accordion" open>
            <summary><span>Pre-Loading Checklist</span><Badge tone={plan.preLoadingChecklistAt ? "success" : "warning"}>{plan.preLoadingChecklistAt ? "Completed" : "Pending"}</Badge></summary>
            <div className="loading-plan-accordion-body">
              <div className="loading-plan-checklist-inputs">{[["Tanker compartment clean", plan.clean],["Tanker compartment dry", plan.dry],["No foreign material/residue", plan.foreignMaterial],["No abnormal odour", plan.odour],["Tanker condition acceptable", plan.bodyCondition],["Outlet valve serviceable", plan.outletClosed]].map(([label, result]) => <div key={label}><span>{label}</span><strong className={result === "yes" ? "check-pass" : result === "no" ? "check-fail" : "check-pending"}>{result ? String(result).toUpperCase() : "NOT RECORDED"}</strong></div>)}</div>
              <div className="loading-plan-detail-grid checklist-remarks-grid"><Detail label="Final Status" value={plan.finalStatus} /><Detail label="Remarks / Corrective Actions" value={plan.preLoadingRemarks} /></div>
              {Object.entries(plan.preLoadingAttachments || {}).some(([, files]) => files?.length) ? <div className="preloading-detail-evidence">{Object.entries(plan.preLoadingAttachments || {}).map(([checkpoint, files]) => files?.length ? <div className="preloading-detail-evidence-group" key={checkpoint}><strong>{checkpoint}</strong><div className="preloading-detail-evidence-grid">{files.map((file, index) => <button type="button" className="preloading-detail-evidence-thumb" key={`${file.name}-${index}`} onClick={() => openAttachment(files, index)}><img src={file.data} alt={file.name} /><span>{file.name}</span></button>)}</div></div> : null)}</div> : <p className="muted">No pre-loading images uploaded.</p>}
            </div>
          </details>
          <details className="loading-plan-checklist-accordion" open>
            <summary><span>Post-Loading Checklist</span><Badge tone={plan.postLoadingChecklistAt ? "success" : "warning"}>{plan.postLoadingChecklistAt ? "Completed" : "Pending"}</Badge></summary>
            <div className="loading-plan-accordion-body">
              <div className="loading-plan-checklist-inputs">{[["Outlet valve fully closed", plan.outletClosed],["Manhole / hatch secured", plan.manholeClosed],["Loading hose / coupling disconnected", plan.hoseDisconnected],["No residual product leakage", plan.noLeakage],["No significant vehicle spillage", plan.noSpillage],["Required dispatch sample collected", plan.sampleCollectedCheck],["Quality testing completed", plan.qualityTestingCheck]].map(([label, result]) => <div key={label}><span>{label}</span><strong className={result === "yes" ? "check-pass" : result === "no" ? "check-fail" : "check-pending"}>{result ? String(result).toUpperCase() : "NOT RECORDED"}</strong></div>)}</div>
              <div className="loading-plan-detail-grid checklist-remarks-grid"><Detail label="Final Status" value={plan.postFinalStatus} /><Detail label="Remarks / Corrective Actions" value={plan.postLoadingRemarks} /></div>
              {Object.entries(plan.postLoadingAttachments || {}).some(([, files]) => files?.length) ? <div className="preloading-detail-evidence">{Object.entries(plan.postLoadingAttachments || {}).map(([checkpoint, files]) => files?.length ? <div className="preloading-detail-evidence-group" key={checkpoint}><strong>{checkpoint}</strong><div className="preloading-detail-evidence-grid">{files.map((file, index) => <button type="button" className="preloading-detail-evidence-thumb" key={`${file.name}-${index}`} onClick={() => openAttachment(files, index)}><img src={file.data} alt={file.name} /><span>{file.name}</span></button>)}</div></div> : null)}</div> : <p className="muted">No post-loading images uploaded.</p>}
            </div>
          </details>
        </section>
        <section hidden={tab !== "checklists"} className="loading-plan-detail-section loading-plan-legacy-checklist">
          <h3>Checklist Inputs</h3>
          <div className="loading-plan-checklist-inputs">
            {[
              ["Pre-loading · Tanker compartment clean", plan.clean],
              ["Pre-loading · Tanker compartment dry", plan.dry],
              ["Pre-loading · No foreign material/residue", plan.foreignMaterial],
              ["Pre-loading · No abnormal odour", plan.odour],
              ["Pre-loading · Tanker condition acceptable", plan.bodyCondition],
              ["Pre-loading · Outlet valve serviceable", plan.outletClosed],
              ["Post-loading · Outlet valve fully closed", plan.outletClosed],
              ["Post-loading · Manhole/hatch secured", plan.manholeClosed],
              ["Post-loading · Hose/coupling disconnected", plan.hoseDisconnected],
              ["Post-loading · No leakage", plan.noLeakage],
              ["Post-loading · No significant spillage", plan.noSpillage],
              ["Post-loading · Dispatch sample check", plan.sampleCollectedCheck],
              ["Post-loading · Quality testing check", plan.qualityTestingCheck],
            ].map(([label, result]) => <div key={label}><span>{label}</span><strong className={result === "yes" ? "check-pass" : result === "no" ? "check-fail" : "check-pending"}>{result ? String(result).toUpperCase() : "NOT RECORDED"}</strong></div>)}
          </div>
          <div className="loading-plan-detail-grid checklist-remarks-grid">
            <Detail label="Pre-Loading Decision" value={plan.finalStatus} />
            <Detail label="Pre-Loading Remarks" value={plan.preLoadingRemarks} />
            <Detail label="Post-Loading Decision" value={plan.postFinalStatus} />
            <Detail label="Post-Loading Remarks" value={plan.postLoadingRemarks} />
          </div>
        </section>
        <section hidden={tab !== "dispatch"} className="loading-plan-detail-section">
          <h3>Seal Records</h3>
          {Array.isArray(plan.seals) && plan.seals.length ? (
            <div className="seal-detail-list">
              {plan.seals.map((seal, index) => <div className="seal-detail-item" key={`${seal.sealNumber}-${index}`}><span>Seal {index + 1}</span><strong>{seal.sealNumber}</strong></div>)}
            </div>
          ) : <p className="muted">No seals recorded.</p>}
          {plan.sealRemarks && <p className="preloading-detail-remarks"><strong>Remarks:</strong> {plan.sealRemarks}</p>}
        </section>
        <section hidden={tab !== "checklists"} className="loading-plan-detail-section loading-plan-legacy-evidence">
          <h3>Pre-Loading Evidence</h3>
          {Object.entries(plan.preLoadingAttachments || {}).some(([, files]) => files?.length) ? (
            <div className="preloading-detail-evidence">
              {Object.entries(plan.preLoadingAttachments || {}).map(([checkpoint, files]) =>
                files?.length ? (
                  <div className="preloading-detail-evidence-group" key={checkpoint}>
                    <strong>{checkpoint}</strong>
                    <div className="preloading-detail-evidence-grid">
                      {files.map((file, index) => (
                        <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}>
                          <img src={file.data} alt={file.name} />
                          <span>{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          ) : <p className="muted">No inspection images uploaded.</p>}
          {plan.preLoadingRemarks && <p className="preloading-detail-remarks"><strong>Remarks:</strong> {plan.preLoadingRemarks}</p>}
        </section>
        <section hidden={tab !== "checklists"} className="loading-plan-detail-section loading-plan-legacy-evidence">
          <h3>Post-Loading Evidence</h3>
          {Object.entries(plan.postLoadingAttachments || {}).some(([, files]) => files?.length) ? (
            <div className="preloading-detail-evidence">
              {Object.entries(plan.postLoadingAttachments || {}).map(([checkpoint, files]) => files?.length ? (
                <div className="preloading-detail-evidence-group" key={checkpoint}>
                  <strong>{checkpoint}</strong>
                  <div className="preloading-detail-evidence-grid">
                    {files.map((file, index) => <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}><img src={file.data} alt={file.name} /><span>{file.name}</span></a>)}
                  </div>
                </div>
              ) : null)}
            </div>
          ) : <p className="muted">No post-loading images uploaded.</p>}
          {plan.postLoadingRemarks && <p className="preloading-detail-remarks"><strong>Remarks:</strong> {plan.postLoadingRemarks}</p>}
        </section>
        <section hidden={tab !== "activities"} className="loading-plan-activities-section">
          <ActivityTimeline
            activities={activities}
            title="Activities"
            reference={plan.loadingInstructionNo || plan.requestNo}
            description={`Audit trail for ${plan.loadingInstructionNo || plan.requestNo}`}
          />
        </section>
        <div className="loading-plan-actions">
          <strong>Next action</strong>
          <div>
            {next[0] === "assign" && (
              <button className="btn btn-primary" onClick={() => setForm("assign")}>
                Assign Transporter &amp; Vehicle
              </button>
            )}
            {["arrival", "pre", "sample", "seal", "post", "exit", "load"].includes(
              next[0],
            ) && (
              <button
                className="btn btn-primary"
                onClick={() => setForm(next[0])}
              >
                {next[1]}
              </button>
            )}
            {next[0] === "start" && (
              <button className="btn btn-primary" onClick={() => run("start")}>
                Start Loading
              </button>
            )}
            {!plan.vehicleArrivedAt &&
              status(plan) !== "COMPLETED" &&
              status(plan) !== "CANCELLED" && (
                <button className="btn btn-danger" onClick={() => run("cancel")}>
                  Cancel Loading Plan
                </button>
              )}
          </div>
        </div>
        {form && (
          <OperationForm
            action={form}
            plan={plan}
            close={() => setForm(null)}
            submit={(data) => run(form, data)}
          />
        )}
        {attachmentViewer && (
          <ImageCarousel
            files={attachmentViewer.files}
            index={attachmentViewer.index}
            onClose={() => setAttachmentViewer(null)}
            onIndexChange={(index) => setAttachmentViewer((current) => ({ ...current, index }))}
          />
        )}
      </div>
    </main>
  );
}

export function LoadingPlansPage() {
  const [rows, setRows] = useState(read);
  const [selected, setSelected] = useState(null);
  const [listAction, setListAction] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const { visibleItems, pagination } = usePaginatedItems(rows);
  useEffect(() => {
    const linkedPlan = new URLSearchParams(window.location.search).get("loadingPlan");
    if (linkedPlan) {
      const match = rows.find((item) => String(item.id) === linkedPlan);
      if (match) setSelected(match);
    }
  }, [rows]);
  const act = (id, action, data, plan) => {
    const current = read();
    const time = new Date().toISOString();
    const next = current.map((item) => {
      if (item.id !== id) return item;
      if (action === "cancel" && item.vehicleArrivedAt) return item;
      let changes =
        action === "arrival"
          ? {
              ...data,
              vehicleArrivedAt: item.vehicleArrivedAt || time,
              emptyWeighmentAt: item.emptyWeighmentAt || time,
              emptyWeighbridgeTicket:
                item.emptyWeighbridgeTicket ||
                `WB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(item.id).slice(-4)}`,
            }
          : action === "start"
              ? { loadingStartedAt: time }
                : action === "pre"
                  ? { ...data, preLoadingChecklistAt: time }
                  : action === "sample"
                    ? {
                        ...data,
                        sampleCollectedAt: time,
                        qualityReleased: true,
                      }
                    : action === "seal"
                      ? { ...data, sealRecordedAt: time }
                      : action === "post"
                        ? { ...data, postLoadingChecklistAt: time }
                        : action === "exit"
                          ? {
                              ...data,
                              secondTareWeight: data.tare,
                              secondGrossWeight: data.grossWeight,
                              netWeight:
                                Number(data.grossWeight) - Number(data.tare),
                              waybillNo: item.waybillNo || `WBILL-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(item.id).slice(-4).toUpperCase()}`,
                              waybillGeneratedAt: item.waybillGeneratedAt || time,
                              secondWeighmentAt: item.secondWeighmentAt || time,
                              vehicleExitAt: time,
                              dispatchAt: time,
                              loadingFulfilled: true,
                              deliveryRequestStatus: "FULFILLED",
                              status: "FULFILLED",
                              loadingPlanStatus: "COMPLETED",
                            }
                          : action === "assign"
                            ? { ...data, status: "ASSIGNED", loadingPlanStatus: "ASSIGNED", logisticsAssignedAt: time }
                            : action === "load"
                              ? {
                                  ...data,
                                  loadingCompletedAt: time,
                                  loadedQuantity: Number(data.actualLoadingQuantity || 0),
                                  loadingExecutions: [
                                    ...(item.loadingExecutions || []),
                                    { id: `LE-${Date.now()}`, quantity: Number(data.actualLoadingQuantity || 0), createdAt: time },
                                  ],
                                }
                          : {
                                status: "CANCELLED",
                                loadingPlanStatus: "CANCELLED",
                              };
      changes.auditEvents = [
        ...(item.auditEvents || []),
        { action, at: time, actor: "Sean Shapiro" },
      ];
      return { ...item, ...changes };
    });
    if (action === "assign") {
      const qcKey = "rockeye.quality.qcRequests";
      let qcRequests = [];
      try {
        const stored = JSON.parse(localStorage.getItem(qcKey) || "[]");
        qcRequests = Array.isArray(stored) ? stored : [];
      } catch {}
      const assignedPlan = next.find((item) => item.id === id);
      if (assignedPlan && !qcRequests.some((request) => request.reference === assignedPlan.loadingInstructionNo && request.requestType === "PRE_DISPATCH")) {
        qcRequests.unshift({
          id: `QC-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-3)}`,
          reference: assignedPlan.loadingInstructionNo || assignedPlan.requestNo,
          product: assignedPlan.product || "Configured product",
          samplePoint: assignedPlan.sourceStorage,
          requestedBy: "System",
          requestedDate: formatDate(new Date()),
          status: "Pending",
          requestType: "PRE_DISPATCH",
          requestTitle: "Pre-Dispatch Quality Inspection",
        });
        localStorage.setItem(qcKey, JSON.stringify(qcRequests));
      }
    }
    if (action === "arrival") {
      const qcKey = "rockeye.quality.qcRequests";
      try {
        const qcRequests = JSON.parse(localStorage.getItem(qcKey) || "[]");
        const updatedQcRequests = (Array.isArray(qcRequests) ? qcRequests : []).map((request) =>
          request.reference === item.loadingInstructionNo && request.requestType === "PRE_DISPATCH"
            ? {
                ...request,
                status: "Ready for Loading",
                vehicleStatus: "Ready for Loading",
                firstWeighmentAt: next.find((entry) => entry.id === id)?.emptyWeighmentAt || time,
                weighbridgeTicket: next.find((entry) => entry.id === id)?.emptyWeighbridgeTicket || "System generated",
                tareWeight: data.tareWeight,
                transporter: item.transporter,
                vehicle: item.vehicle,
                driver: item.driver,
                loadingBay: item.loadingBay,
                sourceStorage: item.sourceStorage,
              }
            : request,
        );
        localStorage.setItem(qcKey, JSON.stringify(updatedQcRequests));
      } catch {}
    }
    localStorage.setItem(KEY, JSON.stringify(next));
    const refreshed = read();
    setRows(refreshed);
    setSelected(refreshed.find((item) => item.id === id) || null);
  };
  const listActionItems = (row) => {
    const [key, label] = getLoadingPlanNextAction(row);
    return [
      {
        key: "view-details",
        label: "View details",
        onClick: () => {
          setOpenActionId(null);
          setSelected(row);
        },
      },
      ...(key ? [{
        key,
        label,
        onClick: () => {
          setOpenActionId(null);
          if (key === "start") {
            act(row.id, key, {}, row);
            return;
          }
          setListAction({ action: key, plan: row });
        },
      }] : []),
    ];
  };
  if (selected) {
    return (
      <LoadingPlanDetails
        plan={selected}
        close={() => setSelected(null)}
        act={(action, data, plan) => act(plan.id, action, data, plan)}
      />
    );
  }
  return (
    <main className="masters-page loading-plans-page">
      <div className="masters-breadcrumb">
        <span>Logistics</span>
        <b>›</b>
        <strong>Loading Plans</strong>
      </div>
      <div className="masters-heading">
        <div>
          <h1>Loading Plans</h1>
          <p>Execute the configured outbound dispatch workflow.</p>
        </div>
      </div>
      <section className="panel masters-panel">
        <div className="masters-toolbar">
          <strong>Loading plan register</strong>
          <div className="loading-plan-toolbar-actions"><div className="loading-plan-view-toggle" role="group" aria-label="Loading Plan view"><button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")} aria-label="Table view">☷</button><button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view">▦</button></div></div>
        </div>
        {viewMode === "table" ? <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loading Instruction No.</th>
                <th>Delivery Request</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Transporter</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Delivery Date</th>
                <th>Waybill</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row)}>
                  <td className="production-reference">
                    {value(row.loadingInstructionNo)}
                  </td>
                  <td>{value(row.requestNo)}</td>
                  <td>{value(row.customerName)}</td>
                  <td>{value(row.product)}</td>
                  <td>
                    <DetailValue value={planQuantity(row)} /> {row.uom || ""}
                  </td>
                  <td><DetailValue value={row.transporter} pending={!row.transporter} /></td>
                  <td><DetailValue value={row.vehicle} pending={!row.transporter || !row.vehicle} /></td>
                  <td><DetailValue value={row.driver} pending={!row.transporter || !row.driver} /></td>
                  <td>{formatDate(row.deliveryDate)}</td>
                  <td>
                    {row.secondWeighmentAt ? <div className="waybill-list-cell"><WaybillQr plan={row} size={38} /><button className="waybill-list-download" title="Download Waybill PDF" aria-label="Download Waybill PDF" onClick={(event) => { event.stopPropagation(); downloadWaybill(row); }}>⇩</button></div> : <span className="muted">Pending</span>}
                  </td>
                  <td>
                    <StatusBadge status={status(row)} />
                  </td>
                  <td>
                    <div className="loading-plan-table-actions">
                      <ActionMenu
                        label="Actions"
                        items={listActionItems(row)}
                        open={openActionId === row.id}
                        onToggle={() => setOpenActionId((current) => current === row.id ? null : row.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> : <div className="loading-plan-card-grid">
          {visibleItems.map((row) => (
            <article className="loading-plan-card" key={row.id}>
              <div className="loading-plan-card-head"><div><span className="loading-plan-card-code">{value(row.loadingInstructionNo)}</span><small>{value(row.requestNo)}</small></div><StatusBadge status={status(row)} /></div>
              <div className="loading-plan-card-rule" />
              <div className="loading-plan-card-primary-row">
                <div className="loading-plan-card-primary"><span>Customer</span><strong>{value(row.customerName)}</strong></div>
                <ActionMenu
                  label="Actions"
                  items={listActionItems(row)}
                  open={openActionId === row.id}
                  onToggle={() => setOpenActionId((current) => current === row.id ? null : row.id)}
                  className="loading-plan-card-action-menu"
                />
              </div>
              <div className="loading-plan-card-grid-details">
                <div><span>Product</span><strong>{value(row.product)}</strong></div>
                <div><span>Delivery Quantity</span><strong><DetailValue value={planQuantity(row)} /> {row.uom || ""}</strong></div>
                <div><span>Delivery Date</span><strong>{formatDate(row.deliveryDate)}</strong></div>
                <div><span>Transporter</span><strong><DetailValue value={row.transporter} pending={!row.transporter} /></strong></div>
                <div><span>Vehicle</span><strong><DetailValue value={row.vehicle} pending={!row.transporter || !row.vehicle} /></strong></div>
                <div><span>Driver</span><strong><DetailValue value={row.driver} pending={!row.transporter || !row.driver} /></strong></div>
              </div>
              <div className="loading-plan-card-waybill">{row.secondWeighmentAt ? <><WaybillQr plan={row} size={42} /><span>{waybillNumber(row)}</span><button className="waybill-list-download" title="Download Waybill PDF" aria-label="Download Waybill PDF" onClick={() => downloadWaybill(row)}>⇩</button></> : <span>Waybill pending second weighment</span>}</div>
              {row.secondWeighmentAt && <div className="loading-plan-card-actions"><button className="waybill-card-download" onClick={() => downloadWaybill(row)}>Download Waybill</button></div>}
              <div className="loading-plan-card-meta"><span>Added by: <DetailValue value={row.createdBy || row.created_by} /></span><span><DetailValue value={row.createdAt || row.created_at ? formatDateTime(row.createdAt || row.created_at) : formatDate(row.requestDate)} /></span></div>
            </article>
          ))}
        </div>}
        {pagination}
        {listAction && <OperationForm
          action={listAction.action}
          plan={listAction.plan}
          close={() => setListAction(null)}
          submit={(data) => {
            const { action, plan } = listAction;
            setListAction(null);
            act(plan.id, action, data, plan);
          }}
        />}
      </section>
    </main>
  );
}
