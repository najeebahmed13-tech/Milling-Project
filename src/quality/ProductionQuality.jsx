import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Pencil, Plus, X } from "lucide-react";
import { BreadcrumbSeparator, Button, Card, EmptyState, PageHeader, StatusBadge } from "../design-system/index.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { getMasterDefinition } from "../config/masterData.js";
import { activeStationOptions } from "../../packages/quality/productionQualityDomain.js";
import { QualityCheckpointForm } from "./QualityCheckpointForm.jsx";
import { StationQualityObservationPage as ObservationPage } from "./StationQualityObservationDrawer.jsx";
import "./production-quality.css";

const frequencyLabels = { CYCLE: "Cycle Wise", DAY: "Day Wise", SHIFT: "Shift Wise", BATCH: "Batch Wise", HOURLY: "Hourly", EVENT: "Event Based", AD_HOC: "Ad hoc" };
const emptyCheckpoint = { code: "", name: "", process: "", operationStage: "", frequency: "CYCLE", sequence: 1, parameter: "", dataType: "DECIMAL", uom: "", targetValue: "", minLimit: "", maxLimit: "", warningMin: "", warningMax: "", mandatory: true, sampleCount: 1, aggregationMethod: "NONE", passFailRule: "IN_RANGE", remarksRequiredOnFailure: false, correctiveActionRequired: false, effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "", status: "ACTIVE" };
const qualityParameterDefinition = getMasterDefinition("qualityParameters");
const QUALITY_PARAMETER_STORAGE_KEY = "rockeye.master.qualityParameters";

function loadQualityParameters() {
  const seeded = qualityParameterDefinition.seed.map((record) => ({ ...record }));
  try {
    const stored = localStorage.getItem(QUALITY_PARAMETER_STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : [];
    const existing = Array.isArray(records) ? records : [];
    return [...existing, ...seeded.filter((seed) => !existing.some((record) => record.id === seed.id))].filter((record) => record.active !== false);
  } catch {
    return seeded;
  }
}

async function request(url, options) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Request could not be completed.");
  return payload;
}

function LegacyCheckpointForm({ checkpoint, stations, parameters, onBack, onSaved }) {
  const [form, setForm] = useState(checkpoint || emptyCheckpoint);
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError("");
    try {
      const payload = { ...form, sequence: Number(form.sequence), sampleCount: Number(form.sampleCount), mandatory: Boolean(form.mandatory), remarksRequiredOnFailure: Boolean(form.remarksRequiredOnFailure), correctiveActionRequired: Boolean(form.correctiveActionRequired) };
      await request(checkpoint ? `/api/production-quality/checkpoints/${checkpoint.id}` : "/api/production-quality/checkpoints", { method: checkpoint ? "PATCH" : "POST", body: JSON.stringify(payload) });
      onSaved();
    } catch (err) { setError(err.message); }
  };
  return <main className="production-quality-page">
    <div className="production-quality-breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Quality</button><BreadcrumbSeparator /><strong>Quality Checkpoints</strong></div>
    <PageHeader eyebrow="QUALITY / CONFIGURATION" title={checkpoint ? "Edit Quality Checkpoint" : "Add Quality Checkpoint"} description="Configure a reusable checkpoint, parameter rule, and effective period for production quality capture." />
    <form className="quality-checkpoint-form" onSubmit={submit}>
      {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
      <Card><h2>Checkpoint identity</h2><div className="quality-form-grid"><label>Checkpoint Code *<input value={form.code} onChange={(e) => update("code", e.target.value)} required placeholder="e.g. STER-TEMP" /></label><label>Checkpoint Name *<input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. Sterilizer temperature" /></label><label>Station *<select value={form.process} onChange={(e) => update("process", e.target.value)} required><option value="">Select a station…</option>{stations.map((item) => <option key={item.id} value={item.name}>{item.code ? `${item.code} · ` : ""}{item.name}</option>)}</select></label></div></Card>
      <Card><h2>Parameter and recording rule</h2><div className="quality-form-grid"><label>Recording Frequency *<select value={form.frequency} onChange={(e) => update("frequency", e.target.value)}>{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Sequence *<input type="number" min="1" value={form.sequence} onChange={(e) => update("sequence", e.target.value)} required /></label><label>Quality Parameter *<input value={form.parameter} onChange={(e) => update("parameter", e.target.value)} required placeholder="e.g. Temperature" /></label><label>Data Type *<select value={form.dataType} onChange={(e) => update("dataType", e.target.value)}>{["INTEGER", "DECIMAL", "TEXT", "BOOLEAN", "SELECTION"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Unit of Measure<input value={form.uom} onChange={(e) => update("uom", e.target.value)} placeholder="e.g. °C, %" /></label><label>Sample Count<input type="number" min="1" value={form.sampleCount} onChange={(e) => update("sampleCount", e.target.value)} /></label><label>Aggregation Method<select value={form.aggregationMethod} onChange={(e) => update("aggregationMethod", e.target.value)}><option>NONE</option><option>AVERAGE</option><option>MINIMUM</option><option>MAXIMUM</option></select></label><label>Pass / Fail Rule<select value={form.passFailRule} onChange={(e) => update("passFailRule", e.target.value)}><option>IN_RANGE</option><option>EXACT_MATCH</option><option>BOOLEAN_TRUE</option></select></label></div></Card>
      <Card><h2>Limits and control</h2><div className="quality-form-grid"><label>Target Value<input value={form.targetValue} onChange={(e) => update("targetValue", e.target.value)} /></label><label>Minimum Limit<input type="number" step="any" value={form.minLimit} onChange={(e) => update("minLimit", e.target.value)} /></label><label>Maximum Limit<input type="number" step="any" value={form.maxLimit} onChange={(e) => update("maxLimit", e.target.value)} /></label><label>Warning Minimum<input type="number" step="any" value={form.warningMin} onChange={(e) => update("warningMin", e.target.value)} /></label><label>Warning Maximum<input type="number" step="any" value={form.warningMax} onChange={(e) => update("warningMax", e.target.value)} /></label><label>Effective From *<input type="date" value={form.effectiveFrom} onChange={(e) => update("effectiveFrom", e.target.value)} required /></label><label>Effective To<input type="date" value={form.effectiveTo} onChange={(e) => update("effectiveTo", e.target.value)} /></label><label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="quality-checkbox-row"><label><input type="checkbox" checked={form.mandatory} onChange={(e) => update("mandatory", e.target.checked)} /> Mandatory checkpoint</label><label><input type="checkbox" checked={form.remarksRequiredOnFailure} onChange={(e) => update("remarksRequiredOnFailure", e.target.checked)} /> Remarks required on failure</label><label><input type="checkbox" checked={form.correctiveActionRequired} onChange={(e) => update("correctiveActionRequired", e.target.checked)} /> Corrective action required</label></div></Card>
      <div className="quality-form-actions"><Button variant="secondary" onClick={onBack}>Cancel</Button><Button type="submit">{checkpoint ? "Update Checkpoint" : "Save Checkpoint"}</Button></div>
    </form>
  </main>;
}

function LegacyObservationDrawer({ checkpoints, onClose, onSaved }) {
  const [form, setForm] = useState({ checkpointId: checkpoints[0]?.id || "", productionDate: new Date().toISOString().slice(0, 10), cycleNumber: "", observedValue: "", remarks: "", correctiveAction: "" });
  const [error, setError] = useState("");
  const selected = checkpoints.find((item) => Number(item.id) === Number(form.checkpointId));
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => { event.preventDefault(); setError(""); try { await request("/api/production-quality/observations", { method: "POST", body: JSON.stringify(form) }); onSaved(); } catch (err) { setError(err.message); } };
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer quality-observation-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="quality-observation-title"><div className="drawer-head"><div><div className="eyebrow">QUALITY / PRODUCTION</div><h2 id="quality-observation-title">Record Production Quality</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close quality record form"><X aria-hidden="true" /></button></div>{error && <div className="form-error" role="alert">{error}</div>}<form onSubmit={submit}><label>Checkpoint *<select value={form.checkpointId} onChange={(e) => update("checkpointId", e.target.value)} required>{checkpoints.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label>Production Date *<input type="date" value={form.productionDate} onChange={(e) => update("productionDate", e.target.value)} required /></label>{selected?.frequency === "CYCLE" && <label>Cycle Number *<input value={form.cycleNumber} onChange={(e) => update("cycleNumber", e.target.value)} required /></label>}<label>Observed Value *<input value={form.observedValue} onChange={(e) => update("observedValue", e.target.value)} required /></label><label>Remarks<textarea rows="3" value={form.remarks} onChange={(e) => update("remarks", e.target.value)} /></label><label>Corrective Action<textarea rows="3" value={form.correctiveAction} onChange={(e) => update("correctiveAction", e.target.value)} /></label><div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save Quality Record</Button></div></form></aside></div>;
}

export function ProductionQualityPage({ mode = "checkpoints", onNavigate }) {
  const [checkpoints, setCheckpoints] = useState([]); const [observations, setObservations] = useState([]); const [stations, setStations] = useState([]); const [parameters, setParameters] = useState(loadQualityParameters); const [view, setView] = useState("list"); const [selected, setSelected] = useState(null); const [error, setError] = useState("");
  const load = async () => { try { const [checkpointData, productionData, observationData] = await Promise.all([request("/api/production-quality/checkpoints"), request("/api/production/overview"), request("/api/production-quality/observations")]); setCheckpoints(checkpointData); setStations(activeStationOptions(productionData.stations)); setParameters(loadQualityParameters()); setObservations(observationData); } catch (err) { setError(err.message); } };
  useEffect(() => { load(); }, []);
  const isRecords = mode === "records";
  const rows = isRecords ? observations : checkpoints;
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, `${mode}:${search}`);
  if (!isRecords && view === "form") return <QualityCheckpointForm checkpoint={selected} stations={stations} parameters={parameters} onBack={() => setView("list")} onSaved={async () => { setView("list"); setSelected(null); await load(); }} />;
  if (isRecords && view === "observationForm") return <ObservationPage checkpoints={checkpoints} stations={stations} onBack={() => setView("list")} onSaved={async () => { setView("list"); await load(); }} />;
  if (!isRecords && view === "details" && selected) return <main className="production-quality-page"><div className="production-quality-breadcrumb"><button type="button" onClick={() => setView("list")}><ArrowLeft size={14} aria-hidden="true" /> Quality Checkpoints</button><BreadcrumbSeparator /><strong>Details</strong></div><PageHeader eyebrow="QUALITY / CONFIGURATION" title={selected.name} description={`${selected.code} · Version ${selected.version}`} actions={<Button onClick={() => setView("form")}><Pencil size={15} aria-hidden="true" /> Edit</Button>} /><Card className="quality-detail-card"><div className="quality-detail-grid">{[["Station", selected.process], ["Operation / Stage", selected.operationStage], ["Frequency", frequencyLabels[selected.frequency] || selected.frequency], ["Parameters", selected.parameters?.length > 1 ? selected.parameters.map((parameter) => parameter.parameter).join(", ") : selected.parameter], ["Data Type", selected.parameters?.length > 1 ? "Configured per parameter" : selected.dataType], ["Unit", selected.parameters?.length > 1 ? "Configured per parameter" : selected.uom || "—"], ["Target", selected.parameters?.length > 1 ? "Configured per parameter" : selected.targetValue || "—"], ["Limits", selected.parameters?.length > 1 ? "Configured per parameter" : `${selected.minLimit ?? "—"} to ${selected.maxLimit ?? "—"}`], ["Effective Period", `${selected.effectiveFrom} to ${selected.effectiveTo || "Open"}`], ["Version", selected.version], ["Status", <StatusBadge key="status" status={selected.status}>{selected.status}</StatusBadge>]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></Card></main>;
  return <main className="production-quality-page"><div className="production-quality-breadcrumb"><button type="button" onClick={() => onNavigate?.("qcRequests")}>Quality</button><BreadcrumbSeparator /><strong>{isRecords ? "Production QC" : "Quality Checkpoints"}</strong></div><PageHeader eyebrow={isRecords ? "QUALITY / PRODUCTION" : "QUALITY / CONFIGURATION"} title={isRecords ? "Production QC" : "Quality Checkpoints"} description={isRecords ? "Record and review production quality observations against effective checkpoints." : "Configure reusable checkpoints and recording rules for production stations."} actions={!isRecords ? <Button onClick={() => { setSelected(null); setView("form"); }}><Plus size={15} aria-hidden="true" /> Add Checkpoint</Button> : <Button onClick={() => setView("observationForm")}><Plus size={15} aria-hidden="true" /> Record Quality</Button>} />{error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}<Card className="quality-list-card"><div className="quality-list-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRecords ? "Search production quality records…" : "Search code, name, station or parameter…"} aria-label={isRecords ? "Search production quality records" : "Search quality checkpoints"} /></div>{visibleItems.length ? <div className="table-wrap"><table><thead><tr>{isRecords ? <><th>Record</th><th>Date</th><th>Process</th><th>Checkpoint</th><th>Observed</th><th>Result</th><th>Recorded By</th><th>Recorded At</th></> : <><th>Code</th><th>Checkpoint</th><th>Station</th><th>Frequency</th><th>Parameter</th><th>Version</th><th>Status</th><th>Actions</th></>}</tr></thead><tbody>{visibleItems.map((row) => isRecords ? <tr key={row.id}><td><strong>{row.observationNo}</strong></td><td>{row.productionDate}</td><td>{row.process}</td><td>{row.checkpoint_name || row.checkpointName || row.checkpointId}</td><td>{row.observedValue} {row.uom}</td><td><StatusBadge status={row.resultStatus}>{row.resultStatus}</StatusBadge></td><td>{row.recordedBy}</td><td>{row.recordedAt}</td></tr> : <tr key={row.id}><td><strong>{row.code}</strong></td><td>{row.name}</td><td>{row.process}</td><td>{frequencyLabels[row.frequency] || row.frequency}</td><td>{row.parameter}</td><td>v{row.version}</td><td><StatusBadge status={row.status}>{row.status}</StatusBadge></td><td><span className="quality-row-actions"><button type="button" onClick={() => { setSelected(row); setView("details"); }} aria-label={`View ${row.code}`}><Eye size={15} aria-hidden="true" /></button><button type="button" onClick={() => { setSelected(row); setView("form"); }} aria-label={`Edit ${row.code}`}><Pencil size={15} aria-hidden="true" /></button></span></td></tr>)}</tbody></table></div> : <EmptyState title={isRecords ? "No production quality records" : "No quality checkpoints"} description={isRecords ? "Record an observation against an effective checkpoint to begin." : "Create the first configurable checkpoint for a production station."} />}{pagination}</Card></main>;
}

export function QualityCheckpointsPage({ onNavigate }) {
  return <ProductionQualityPage mode="checkpoints" onNavigate={onNavigate} />;
}

export function ProductionQCPage({ onNavigate }) {
  return <ProductionQualityPage mode="records" onNavigate={onNavigate} />;
}
