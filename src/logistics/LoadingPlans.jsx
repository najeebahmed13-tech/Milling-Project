import React, { useEffect, useState } from "react";
import "../masters/masters.css";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import "./loading-plans.css";
import "./loading-plan-progress.css";
import "./loading-plan-operation.css";
import "./loading-plan-checklists.css";
import { formatDate } from "../shared/formatters.js";

const KEY = "rockeye.commercial.deliveryRequests";
const value = (v, fallback = "—") =>
  v === undefined || v === null || v === "" ? fallback : v;
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
    return JSON.parse(localStorage.getItem(KEY) || "[]");
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
                  : "PENDING LOGISTICS ASSIGNMENT";
const Detail = ({ label, value: v }) => (
  <div>
    <span>{label}</span>
    <strong>{value(v)}</strong>
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
      : action === "load"
        ? { actualLoadingQuantity: plan.actualLoadingQuantity || "" }
        : action === "second"
      ? {
          grossWeight: plan.secondGrossWeight || plan.grossWeight || "",
          tare: plan.tareWeight || plan.emptyTareWeight || "",
          secondRemarks: "",
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
  const save = (e) => {
    e.preventDefault();
    if (action === "assign" && (!data.transporter || !data.vehicle || !data.driver || !data.loadingBay))
      return;
    if (action === "load" && (Number(data.actualLoadingQuantity) <= 0 || Number(data.actualLoadingQuantity) > Number(plan.remainingQuantity || plan.requestedQuantity || 0)))
      return;
    if (action === "second" && (Number(data.grossWeight) <= 0 || Number(data.tare) <= 0 || Number(data.grossWeight) < Number(data.tare)))
      return;
    if (
      action === "sample" &&
      ["ffa", "dobi", "moisture", "dirt"].some(
        (parameter) => data[parameter] === undefined || data[parameter] === "" || Number.isNaN(Number(data[parameter])),
      )
    )
      return;
    if (action === "pre" && checks.some(([, n]) => data[n] !== "yes"))
      return;
    if (action === "pre" && !data.finalStatus)
      return;
    if (
      action === "pre" &&
      data.finalStatus === "override" &&
      !data.preLoadingRemarks?.trim()
    )
      return;
    if (action === "post" && checks.some(([, n]) => data[n] !== "yes"))
      return;
    if (action === "post" && (data.sampleCollectedCheck !== "yes" || data.qualityTestingCheck !== "yes"))
      return;
    if (action === "post" && (!plan.sampleCollectedAt || !plan.qualityReleased))
      return;
    if ((action === "pre" || action === "post") && !data[decisionField])
      return;
    if (action === "post" && data[decisionField] === "override" && !data.postLoadingRemarks?.trim())
      return;
    if (action === "seal" && (!data.seals?.length || data.seals.some((seal) => !seal.sealNumber?.trim())))
      return;
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
    <div className="loading-plan-form-overlay">
      <form className="loading-plan-operation-form" onSubmit={save}>
        <div className="master-form-head">
          <div>
            <span>LOGISTICS / LOADING PLAN</span>
            <h2>
              {action === "assign"
                ? "Logistics Assignment"
                : action === "load"
                  ? "Loading Execution"
                  : action === "empty"
                ? "First Weighment · Empty Vehicle"
                : action === "pre"
                  ? "Pre-Loading Checklist"
                  : action === "sample"
                    ? "Sample Collection & Quality"
                    : action === "seal"
                      ? "Record Seal"
                      : action === "post"
                        ? "Post-Loading Checklist"
                        : "Second Weighment · Loaded Vehicle"}
            </h2>
            <p>{plan.loadingInstructionNo || plan.requestNo}</p>
          </div>
          <button type="button" onClick={close}>
            ×
          </button>
        </div>
        {action === "assign" && (
          <div className="loading-plan-assignment-form">
            <section className="loading-plan-assignment-summary">
              <div className="assignment-summary-heading"><span>Delivery Request</span><strong>{value(plan.requestNo)}</strong></div>
              <div className="assignment-summary-grid">
                <div><span>Customer / Consignee</span><strong>{value(plan.customerName)}</strong></div>
                <div><span>Delivery Destination</span><strong>{value(plan.deliveryLocation || plan.millLocationGate, "Mill Gate")}</strong></div>
                <div><span>Planned Date</span><strong>{value(plan.plannedLoadingDate || plan.deliveryDate)}</strong></div>
                <div><span>Delivery Date</span><strong>{value(plan.deliveryDate)}</strong></div>
                <div className="required-summary"><span>Requested Quantity</span><strong>{value(plan.requestedQuantity)} {value(plan.uom, "MT")}</strong><small>Product: {value(plan.product)}</small></div>
              </div>
            </section>
            <section className="loading-plan-assignment-section">
              <div className="loading-plan-assignment-heading"><h3>Transporter Assignment</h3><span>Logistics controlled fields</span></div>
              <div className="loading-plan-operation-fields">
                <label className="assignment-transporter"><span>Transporter Company<em>*</em></span><select value={data.transporter || ""} onChange={(e) => set("transporter", e.target.value)} required><option value="">Select transporter...</option>{transporters.filter((item) => String(item.status || "Active").toLowerCase() === "active").map((item) => <option key={item.id} value={item.companyName || item.tradingName}>{item.companyName || item.tradingName}</option>)}</select></label>
                <label><span>Vehicle<em>*</em></span><select value={data.vehicle || ""} onChange={(e) => set("vehicle", e.target.value)} required disabled={!data.transporter}><option value="">Select vehicle...</option>{availableVehicles.map((item) => <option key={item.id} value={item.registration_no}>{item.registration_no} · {item.vehicle_type}</option>)}</select></label>
                <label><span>Driver<em>*</em></span><select value={data.driver || ""} onChange={(e) => set("driver", e.target.value)} required disabled={!data.transporter}><option value="">Select driver...</option>{availableDrivers.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.license_no}</option>)}</select></label>
                <label><span>Loading Bay<em>*</em></span><select value={data.loadingBay || ""} onChange={(e) => set("loadingBay", e.target.value)} required><option value="">Select loading bay...</option><option>Loading Bay 01</option><option>Loading Bay 02</option></select></label>
                <label><span>Storage Tank<em>*</em></span><select value={data.sourceStorage || ""} onChange={(e) => set("sourceStorage", e.target.value)} required><option value="">Select tank...</option>{tanks.filter((tank) => tank.active !== false && tank.name !== "Palm Kernel Tank 01").map((tank) => <option key={tank.id} value={tank.name || tank.code}>{tank.name || tank.code} · {tank.compatibleMaterial || "Configured material"}</option>)}</select></label>
              </div>
              {plan.loadingInstructions && <div className="assignment-instructions"><span>Special Loading Instructions</span><p>{plan.loadingInstructions}</p></div>}
            </section>
          </div>
        )}
        {action === "load" && (
          <div className="loading-plan-operation-fields">
            <p className="readonly-operation-field">Planned Quantity: {value(plan.requestedQuantity)} {value(plan.uom, "MT")} · Remaining: {value(plan.remainingQuantity ?? plan.requestedQuantity)} {value(plan.uom, "MT")}</p>
            {field("Actual Loading Quantity (MT)", "actualLoadingQuantity", "number", true)}
            <p className="loading-plan-calculation">Remaining after this execution: {Math.max(0, Number(plan.remainingQuantity ?? plan.requestedQuantity ?? 0) - Number(data.actualLoadingQuantity || 0)).toFixed(3)} MT</p>
          </div>
        )}
        {action === "empty" && (
          <div className="loading-plan-weighment-form">
            <section className="loading-plan-assignment-summary">
              <div className="assignment-summary-heading"><span>Loading Plan Reference</span><strong>{value(plan.loadingInstructionNo || plan.requestNo)}</strong></div>
              <div className="loading-plan-operational-summary">
                <div className="loading-plan-summary-group">
                  <h4>Delivery Context</h4>
                  <div className="assignment-summary-grid">
                    <div><span>Delivery Request</span><strong>{value(plan.requestNo)}</strong></div>
                    <div><span>Customer</span><strong>{value(plan.customerName)}</strong></div>
                    <div><span>Planned Loading Date</span><strong>{value(plan.plannedLoadingDate || plan.deliveryDate)}</strong></div>
                    <div><span>Delivery Date</span><strong>{value(plan.deliveryDate)}</strong></div>
                  </div>
                </div>
                <div className="loading-plan-summary-group">
                  <h4>Loading Plan</h4>
                  <div className="assignment-summary-grid">
                    <div><span>Product</span><strong>{value(plan.product)}</strong></div>
                    <div className="required-summary"><span>Planned Quantity</span><strong>{value(plan.requestedQuantity)} {value(plan.uom, "MT")}</strong></div>
                    <div><span>Loading Bay</span><strong>{value(plan.loadingBay)}</strong></div>
                    <div><span>Storage Tank</span><strong>{value(plan.sourceStorage)}</strong></div>
                  </div>
                </div>
                <div className="loading-plan-summary-group">
                  <h4>Transport Assignment</h4>
                  <div className="assignment-summary-grid">
                    <div><span>Transporter</span><strong>{value(plan.transporter)}</strong></div>
                    <div><span>Vehicle</span><strong>{value(plan.vehicle)}</strong></div>
                    <div><span>Driver</span><strong>{value(plan.driver)}</strong></div>
                  </div>
                </div>
              </div>
            </section>
            <section className="loading-plan-weighment-entry">
              <div className="loading-plan-assignment-heading"><h3>First Weighment · Empty Vehicle</h3><span>Weighbridge entry</span></div>
              <p className="readonly-operation-field">Weighbridge Ticket No.: {ticket} · System generated / readonly</p>
              <div className="loading-plan-operation-fields">{field("Tare Weight (MT)", "tareWeight", "number", true)}</div>
            </section>
          </div>
        )}
        {action === "second" && (
          <div className="second-weighment-form">
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
                <div><span>Planned Qty</span><strong>{value(plan.requestedQuantity)} {value(plan.uom, "MT")}</strong></div>
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
                <div><span>Loaded Qty</span><strong>{value(plan.loadedQuantity || plan.requestedQuantity)} {value(plan.uom, "MT")}</strong></div>
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
            <section className="sample-quality-context">
              <div className="sample-quality-section-heading">
                <div><h3>Loading &amp; Sample Details</h3><p>Confirm the dispatch sample and record the laboratory quality result.</p></div>
                <span>Quality inspection</span>
              </div>
              <div className="sample-quality-context-grid">
                <div><span>Loading Plan</span><strong>{value(plan.loadingInstructionNo || plan.requestNo)}</strong></div>
                <div><span>Product</span><strong>{value(plan.product)}</strong></div>
                <div><span>Vehicle</span><strong>{value(plan.vehicle)}</strong></div>
                <div><span>Storage Tank</span><strong>{value(plan.sourceStorage)}</strong></div>
              </div>
            </section>
            <section className="sample-quality-section">
              <div className="sample-quality-section-heading"><div><h3>Sample Collection</h3><p>Sample reference is generated by the system.</p></div></div>
              <label className="sample-quality-readonly"><span>Sample Reference</span><input value={sample} readOnly /></label>
            </section>
            <section className="sample-quality-section">
              <div className="sample-quality-section-heading"><div><h3>Quality Parameters</h3><p>Enter the measured values from the laboratory result.</p></div><span className="sample-quality-required">All fields mandatory</span></div>
              <div className="sample-quality-parameter-grid">
                {field("FFA", "ffa", "number", true)}
                {field("DOBI", "dobi", "number", true)}
                {field("Moisture", "moisture", "number", true)}
                {field("Dirt", "dirt", "number", true)}
              </div>
            </section>
            <section className="sample-quality-section sample-quality-notes">
              <div className="sample-quality-section-heading"><div><h3>Remarks &amp; Attachments</h3><p>Attach the laboratory report or supporting quality evidence.</p></div></div>
              <label><span>Remarks</span><textarea value={data.qualityRemarks || ""} onChange={(event) => set("qualityRemarks", event.target.value)} rows="3" placeholder="Add quality observations or release notes..." /></label>
              <label><span>Attachment</span><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => uploadDocuments(event.target.files, "qualityAttachments")} /></label>
            </section>
          </div>
        )}
        {action === "seal" && (
          <div className="seal-record-form">
            <section className="sample-quality-section">
              <div className="sample-quality-section-heading">
                <div><h3>Seal Registration</h3><p>Record every seal fitted to the vehicle before dispatch.</p></div>
                <span className="sample-quality-required">At least one required</span>
              </div>
              <div className="seal-record-list">
                {data.seals.map((seal, index) => (
                  <div className="seal-record-row" key={`seal-${index}`}>
                    <label><span>Seal Number {index + 1} <em>*</em></span><input value={seal.sealNumber || ""} onChange={(event) => updateSeal(index, event.target.value)} placeholder="Enter seal number" required /></label>
                    <button type="button" className="btn btn-secondary" onClick={() => removeSeal(index)} disabled={data.seals.length === 1}>Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-secondary seal-add-button" onClick={addSeal}>+ Add another seal</button>
            </section>
            <section className="sample-quality-section sample-quality-notes">
              <div className="sample-quality-section-heading"><div><h3>Seal Remarks</h3><p>Add any seal condition or dispatch observation.</p></div></div>
              <label><span>Remarks</span><textarea value={data.sealRemarks || ""} onChange={(event) => set("sealRemarks", event.target.value)} rows="3" placeholder="Add seal remarks or observations..." /></label>
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

function Drawer({ plan, close, act }) {
  const [form, setForm] = useState(null);
  const next = !plan.transporter
    ? ["assign", "Assign Logistics"]
    : !plan.vehicleArrivedAt
    ? ["arrival", "Confirm Vehicle Arrival"]
    : !plan.emptyWeighmentAt
      ? ["empty", "First Weighment · Empty Vehicle"]
      : !plan.preLoadingChecklistAt
        ? ["pre", "Pre-Loading Checklist"]
        : !plan.atLoadingBayAt
          ? ["bay", "Proceed to Loading Bay"]
            : !plan.loadingStartedAt
            ? ["start", "Start Loading"]
            : !plan.loadingCompletedAt || Number(plan.remainingQuantity ?? plan.requestedQuantity ?? 0) > 0
            ? ["load", "Record Loading Complete"]
            : !plan.sampleCollectedAt
              ? ["sample", "Sample Collection / Quality"]
              : !plan.qualityReleased
                ? ["sample", "Sample Collection / Quality"]
                : !plan.sealRecordedAt
                  ? ["seal", "Record Seal Number"]
                  : !plan.postLoadingChecklistAt
                    ? ["post", "Post-Loading Checklist"]
                    : !plan.secondWeighmentAt
                      ? ["second", "Second Weighment · Tare"]
                      : !plan.vehicleExitAt
                        ? ["exit", "Vehicle Exit"]
                        : [null, "Completed"];
  const run = (action, data = {}) => {
    setForm(null);
    act(action, data, plan);
  };
  return (
    <div className="drawer-backdrop" onClick={close}>
      <aside
        className="drawer loading-plan-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">LOGISTICS / LOADING PLAN</div>
            <h2>{value(plan.loadingInstructionNo, "Loading Plan")}</h2>
            <p>
              {value(plan.requestNo)} · {value(plan.customerName)}
            </p>
          </div>
          <button className="icon-button" onClick={close}>
            ×
          </button>
        </div>
        <div className="loading-plan-status">
          <span className="customer-status">{next[1]}</span>
          <span>{value(plan.plannedLoadingDate || plan.deliveryDate)}</span>
        </div>
        <section className="loading-plan-detail-section">
          <h3>Loading Instruction</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Delivery Request" value={plan.requestNo} />
            <Detail label="Customer" value={plan.customerName} />
            <Detail label="Product" value={plan.product} />
            <Detail
              label="Quantity"
              value={`${value(plan.requestedQuantity)} ${value(plan.uom, "")}`}
            />
            <Detail
              label="Remaining Quantity"
              value={`${value(plan.remainingQuantity ?? plan.requestedQuantity)} ${value(plan.uom, "")}`}
            />
            <Detail label="Transporter" value={plan.transporter} />
            <Detail
              label="Vehicle / Driver"
              value={`${value(plan.vehicle)} / ${value(plan.driver)}`}
            />
            <Detail label="Source Tank / Silo" value={plan.sourceStorage} />
            <Detail label="Loading Bay" value={plan.loadingBay} />
            <Detail label="Tank" value={plan.sourceStorage} />
            <Detail label="Instructions" value={plan.loadingInstructions} />
          </div>
        </section>
        <section className="loading-plan-detail-section">
          <h3>Loading Execution</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Loaded Quantity" value={`${value(plan.loadedQuantity, "0")} ${value(plan.uom, "")}`} />
            <Detail label="Execution Entries" value={plan.loadingExecutions?.length || 0} />
            <Detail label="Source Quality" value={plan.qualityReleased ? "Released" : "Pending"} />
          </div>
          {plan.loadingExecutions?.length ? <div className="loading-plan-input-record-list">{plan.loadingExecutions.map((entry) => <div key={entry.id}><span>{entry.id}</span><strong>{entry.quantity} {value(plan.uom, "MT")}</strong><small>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}</small></div>)}</div> : null}
        </section>
        <section className="loading-plan-detail-section">
          <h3>Execution Record</h3>
          <div className="loading-plan-checklist">
            <State
              label="Vehicle arrival"
              done={Boolean(plan.vehicleArrivedAt)}
              value={value(
                plan.vehicleArrivedAt
                  ? new Date(plan.vehicleArrivedAt).toLocaleString()
                  : "Pending",
              )}
            />
            <State
              label="First weighment"
              done={Boolean(plan.emptyWeighmentAt)}
              value={
                plan.emptyWeighmentAt
                  ? `${value(plan.emptyWeighbridgeTicket)} · ${value(plan.tareWeight)} MT tare`
                  : "Pending"
              }
            />
            <State
              label="Pre-loading checklist"
              done={Boolean(plan.preLoadingChecklistAt)}
              value={plan.preLoadingChecklistAt ? `${String(plan.finalStatus || "Completed").toUpperCase()}${plan.finalStatusRemarks ? ` · ${plan.finalStatusRemarks}` : ""}` : "Pending"}
            />
            <State
              label="Loading / sample / seal"
              done={Boolean(plan.sealRecordedAt || plan.sealNumbers)}
              value={plan.sealRecordedAt ? (plan.seals || []).map((seal) => seal.sealNumber).join(", ") || value(plan.sealNumbers, "Recorded") : "Pending"}
            />
            <State
              label="Post-loading checklist"
              done={Boolean(plan.postLoadingChecklistAt)}
              value={plan.postLoadingChecklistAt ? "Completed" : "Pending"}
            />
            <State
              label="Second weighment"
              done={Boolean(plan.secondWeighmentAt)}
              value={
                plan.secondWeighmentAt
                  ? `${value(plan.grossWeight)} gross · ${value(plan.secondTareWeight)} tare · ${value(plan.netWeight)} net`
                  : "Pending"
              }
            />
            <State
              label="Vehicle exit"
              done={Boolean(plan.vehicleExitAt)}
              value={plan.vehicleExitAt ? "Completed" : "Pending"}
            />
          </div>
        </section>
        <section className="loading-plan-detail-section">
          <h3>Weighment Details</h3>
          <div className="loading-plan-detail-grid">
            <Detail label="Weighbridge Ticket" value={plan.emptyWeighbridgeTicket || plan.weighbridgeTicket} />
            <Detail label="First Tare Weight" value={plan.tareWeight ? `${plan.tareWeight} MT` : "Pending"} />
            <Detail label="Loaded Gross Weight" value={plan.grossWeight ? `${plan.grossWeight} MT` : "Pending"} />
            <Detail label="Certified Net Weight" value={plan.netWeight ? `${plan.netWeight} MT` : "Pending"} />
            <Detail label="Second Weighment Remarks" value={plan.secondRemarks} />
          </div>
        </section>
        <section className="loading-plan-detail-section">
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
        <section className="loading-plan-detail-section">
          <h3>Second Weighment Inputs</h3>
          <div className="loading-plan-detail-grid"><Detail label="Gross Weight Entered" value={plan.grossWeight ? `${plan.grossWeight} MT` : "Pending"} /><Detail label="Tare From First Weighment" value={plan.tareWeight ? `${plan.tareWeight} MT` : "Pending"} /><Detail label="Net Weight Calculated" value={plan.netWeight ? `${plan.netWeight} MT` : "Pending"} /><Detail label="Remarks" value={plan.secondRemarks} /></div>
          {plan.secondAttachments?.length ? <div className="loading-plan-document-list">{plan.secondAttachments.map((file, index) => <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}>{file.name}</a>)}</div> : <p className="muted">No second-weighment attachments uploaded.</p>}
        </section>
        {plan.secondWeighmentAt && <section className="loading-plan-detail-section waybill-detail-section">
          <div className="waybill-detail-heading"><div><h3>Waybill</h3><p>Generated from the certified second weighment.</p></div><button className="waybill-download-button" title="Download Waybill PDF" aria-label="Download Waybill PDF" onClick={() => downloadWaybill(plan)}>⇩</button></div>
          <div className="waybill-detail-content"><WaybillQr plan={plan} size={88} /><div><strong>{waybillNumber(plan)}</strong><span>Scan to view the Loading Plan details.</span><button className="btn btn-secondary" onClick={() => downloadWaybill(plan)}>Download Waybill PDF</button></div></div>
        </section>}
        <section className="loading-plan-detail-section loading-plan-accordion-section">
          <h3>Inspection Checklists</h3>
          <details className="loading-plan-checklist-accordion" open>
            <summary><span>Pre-Loading Checklist</span><strong>{plan.preLoadingChecklistAt ? "Completed" : "Pending"}</strong></summary>
            <div className="loading-plan-accordion-body">
              <div className="loading-plan-checklist-inputs">{[["Tanker compartment clean", plan.clean],["Tanker compartment dry", plan.dry],["No foreign material/residue", plan.foreignMaterial],["No abnormal odour", plan.odour],["Tanker condition acceptable", plan.bodyCondition],["Outlet valve serviceable", plan.outletClosed]].map(([label, result]) => <div key={label}><span>{label}</span><strong className={result === "yes" ? "check-pass" : result === "no" ? "check-fail" : "check-pending"}>{result ? String(result).toUpperCase() : "NOT RECORDED"}</strong></div>)}</div>
              <div className="loading-plan-detail-grid checklist-remarks-grid"><Detail label="Final Status" value={plan.finalStatus} /><Detail label="Remarks / Corrective Actions" value={plan.preLoadingRemarks} /></div>
              {Object.entries(plan.preLoadingAttachments || {}).some(([, files]) => files?.length) ? <div className="preloading-detail-evidence">{Object.entries(plan.preLoadingAttachments || {}).map(([checkpoint, files]) => files?.length ? <div className="preloading-detail-evidence-group" key={checkpoint}><strong>{checkpoint}</strong><div className="preloading-detail-evidence-grid">{files.map((file, index) => <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}><img src={file.data} alt={file.name} /><span>{file.name}</span></a>)}</div></div> : null)}</div> : <p className="muted">No pre-loading images uploaded.</p>}
            </div>
          </details>
          <details className="loading-plan-checklist-accordion" open>
            <summary><span>Post-Loading Checklist</span><strong>{plan.postLoadingChecklistAt ? "Completed" : "Pending"}</strong></summary>
            <div className="loading-plan-accordion-body">
              <div className="loading-plan-checklist-inputs">{[["Outlet valve fully closed", plan.outletClosed],["Manhole / hatch secured", plan.manholeClosed],["Loading hose / coupling disconnected", plan.hoseDisconnected],["No residual product leakage", plan.noLeakage],["No significant vehicle spillage", plan.noSpillage],["Required dispatch sample collected", plan.sampleCollectedCheck],["Quality testing completed", plan.qualityTestingCheck]].map(([label, result]) => <div key={label}><span>{label}</span><strong className={result === "yes" ? "check-pass" : result === "no" ? "check-fail" : "check-pending"}>{result ? String(result).toUpperCase() : "NOT RECORDED"}</strong></div>)}</div>
              <div className="loading-plan-detail-grid checklist-remarks-grid"><Detail label="Final Status" value={plan.postFinalStatus} /><Detail label="Remarks / Corrective Actions" value={plan.postLoadingRemarks} /></div>
              {Object.entries(plan.postLoadingAttachments || {}).some(([, files]) => files?.length) ? <div className="preloading-detail-evidence">{Object.entries(plan.postLoadingAttachments || {}).map(([checkpoint, files]) => files?.length ? <div className="preloading-detail-evidence-group" key={checkpoint}><strong>{checkpoint}</strong><div className="preloading-detail-evidence-grid">{files.map((file, index) => <a href={file.data} target="_blank" rel="noreferrer" download={file.name} key={`${file.name}-${index}`}><img src={file.data} alt={file.name} /><span>{file.name}</span></a>)}</div></div> : null)}</div> : <p className="muted">No post-loading images uploaded.</p>}
            </div>
          </details>
        </section>
        <section className="loading-plan-detail-section loading-plan-legacy-checklist">
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
        <section className="loading-plan-detail-section">
          <h3>Seal Records</h3>
          {Array.isArray(plan.seals) && plan.seals.length ? (
            <div className="seal-detail-list">
              {plan.seals.map((seal, index) => <div className="seal-detail-item" key={`${seal.sealNumber}-${index}`}><span>Seal {index + 1}</span><strong>{seal.sealNumber}</strong></div>)}
            </div>
          ) : <p className="muted">No seals recorded.</p>}
          {plan.sealRemarks && <p className="preloading-detail-remarks"><strong>Remarks:</strong> {plan.sealRemarks}</p>}
        </section>
        <section className="loading-plan-detail-section loading-plan-legacy-evidence">
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
        <section className="loading-plan-detail-section loading-plan-legacy-evidence">
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
        <div className="loading-plan-actions">
          <strong>Next action</strong>
          <div>
            {next[0] === "assign" && (
              <button className="btn btn-primary" onClick={() => setForm("assign")}>
                Assign Transporter &amp; Vehicle
              </button>
            )}
            {next[0] === "arrival" && (
              <button
                className="btn btn-primary"
                onClick={() => run("arrival")}
              >
                Confirm Vehicle Arrival
              </button>
            )}
            {["empty", "pre", "sample", "seal", "post", "second", "load"].includes(
              next[0],
            ) && (
              <button
                className="btn btn-primary"
                onClick={() => setForm(next[0])}
              >
                {next[1]}
              </button>
            )}
            {next[0] === "bay" && (
              <button className="btn btn-primary" onClick={() => run("bay")}>
                Proceed to Loading Bay
              </button>
            )}
            {next[0] === "start" && (
              <button className="btn btn-primary" onClick={() => run("start")}>
                Start Loading
              </button>
            )}
            {next[0] === "exit" && (
              <button className="btn btn-primary" onClick={() => run("exit")}>
                Vehicle Exit
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
      </aside>
    </div>
  );
}

export function LoadingPlansPage() {
  const [rows, setRows] = useState(read);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("table");
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
          ? { vehicleArrivedAt: time }
          : action === "bay"
            ? { atLoadingBayAt: time }
            : action === "start"
              ? { loadingStartedAt: time }
              : action === "empty"
                ? {
                    ...data,
                    emptyWeighbridgeTicket:
                      item.emptyWeighbridgeTicket ||
                      `WB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(item.id).slice(-4)}`,
                    emptyWeighmentAt: time,
                  }
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
                        : action === "second"
                          ? {
                              ...data,
                              secondTareWeight: data.tare,
                              netWeight:
                                Number(data.grossWeight) - Number(data.tare),
                              waybillNo: item.waybillNo || `WBILL-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(item.id).slice(-4).toUpperCase()}`,
                              waybillGeneratedAt: item.waybillGeneratedAt || time,
                              secondWeighmentAt: time,
                            }
                          : action === "assign"
                            ? { ...data, status: "ASSIGNED", loadingPlanStatus: "ASSIGNED", logisticsAssignedAt: time }
                            : action === "load"
                              ? {
                                  ...data,
                                  loadingCompletedAt: time,
                                  loadedQuantity:
                                    Number(item.loadedQuantity || 0) + Number(data.actualLoadingQuantity || 0),
                                  remainingQuantity: Math.max(
                                    0,
                                    Number(item.remainingQuantity ?? item.requestedQuantity ?? 0) - Number(data.actualLoadingQuantity || 0),
                                  ),
                                  loadingExecutions: [
                                    ...(item.loadingExecutions || []),
                                    { id: `LE-${Date.now()}`, quantity: Number(data.actualLoadingQuantity || 0), createdAt: time },
                                  ],
                                }
                          : action === "exit"
                            ? {
                                vehicleExitAt: time,
                                dispatchAt: time,
                                loadingFulfilled: true,
                                deliveryRequestStatus: "FULFILLED",
                                status: "FULFILLED",
                                loadingPlanStatus: "COMPLETED",
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
    if (action === "empty") {
      const qcKey = "rockeye.quality.qcRequests";
      try {
        const qcRequests = JSON.parse(localStorage.getItem(qcKey) || "[]");
        const updatedQcRequests = (Array.isArray(qcRequests) ? qcRequests : []).map((request) =>
          request.reference === item.loadingInstructionNo && request.requestType === "PRE_DISPATCH"
            ? {
                ...request,
                status: "Ready for Loading",
                vehicleStatus: "Ready for Loading",
                firstWeighmentAt: time,
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
          <div className="loading-plan-toolbar-actions"><span>{rows.length} records</span><div className="loading-plan-view-toggle" role="group" aria-label="Loading Plan view"><button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")} aria-label="Table view">☷</button><button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view">▦</button></div></div>
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
                <th>Planned Date</th>
                <th>Waybill</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row)}>
                  <td className="production-reference">
                    {value(row.loadingInstructionNo)}
                  </td>
                  <td>{value(row.requestNo)}</td>
                  <td>{value(row.customerName)}</td>
                  <td>{value(row.product)}</td>
                  <td>
                    {value(row.requestedQuantity)} {value(row.uom, "")}
                  </td>
                  <td>{value(row.transporter)}</td>
                  <td>{value(row.vehicle)}</td>
                  <td>{value(row.driver)}</td>
                  <td>{value(row.plannedLoadingDate || row.deliveryDate)}</td>
                  <td>
                    {row.secondWeighmentAt ? <div className="waybill-list-cell"><WaybillQr plan={row} size={38} /><button className="waybill-list-download" title="Download Waybill PDF" aria-label="Download Waybill PDF" onClick={(event) => { event.stopPropagation(); downloadWaybill(row); }}>⇩</button></div> : <span className="muted">Pending</span>}
                  </td>
                  <td>
                    <span className="customer-status">{status(row)}</span>
                  </td>
                  <td>
                    <button
                      className="master-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(row);
                      }}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> : <div className="loading-plan-card-grid">
          {rows.map((row) => (
            <article className="loading-plan-card" key={row.id}>
              <div className="loading-plan-card-head"><div><span className="loading-plan-card-code">{value(row.loadingInstructionNo)}</span><small>{value(row.requestNo)}</small></div><span className="customer-status">{status(row)}</span></div>
              <div className="loading-plan-card-rule" />
              <div className="loading-plan-card-primary"><span>Customer</span><strong>{value(row.customerName)}</strong></div>
              <div className="loading-plan-card-grid-details">
                <div><span>Product</span><strong>{value(row.product)}</strong></div>
                <div><span>Quantity</span><strong>{value(row.requestedQuantity)} {value(row.uom, "")}</strong></div>
                <div><span>Planned Date</span><strong>{value(row.plannedLoadingDate || row.deliveryDate)}</strong></div>
                <div><span>Transporter</span><strong>{value(row.transporter)}</strong></div>
                <div><span>Vehicle</span><strong>{value(row.vehicle)}</strong></div>
                <div><span>Driver</span><strong>{value(row.driver)}</strong></div>
              </div>
              <div className="loading-plan-card-waybill">{row.secondWeighmentAt ? <><WaybillQr plan={row} size={42} /><span>{waybillNumber(row)}</span><button className="waybill-list-download" title="Download Waybill PDF" aria-label="Download Waybill PDF" onClick={() => downloadWaybill(row)}>⇩</button></> : <span>Waybill pending second weighment</span>}</div>
              <div className="loading-plan-card-actions"><button className="master-edit" onClick={() => setSelected(row)}>View details</button>{row.secondWeighmentAt && <button className="waybill-card-download" onClick={() => downloadWaybill(row)}>Download Waybill</button>}</div>
            </article>
          ))}
        </div>}
      </section>
      {selected && (
        <Drawer
          plan={selected}
          close={() => setSelected(null)}
          act={(action, data, plan) => act(plan.id, action, data, plan)}
        />
      )}
    </main>
  );
}
