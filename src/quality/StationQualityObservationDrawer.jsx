import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BreadcrumbSeparator, Button, Card, FormField, PageHeader } from "../design-system/index.js";
import { masterName } from "../shared/masterDisplay.js";

async function request(url, options) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Request could not be completed.");
  return payload;
}

const parameterKey = (parameter) => String(parameter.id || parameter.parameter);
const parameterLabel = (parameter) => parameter.parameter || parameter.name || "Parameter";
const inputType = (parameter) => ["INTEGER", "DECIMAL"].includes(parameter.dataType) ? "number" : "text";
const ruleLabel = (rule) => rule === "EXACT_MATCH" ? "Exact match" : "Within range";
const targetLabel = (parameter) => parameter.targetValue ? parameter.targetValue : "Not specified";
const allowedLabel = (parameter) => parameter.passFailRule === "EXACT_MATCH" ? (parameter.allowedVariancePercent == null ? "Exact value" : `±${parameter.allowedVariancePercent}%`) : parameter.minLimit != null || parameter.maxLimit != null ? `${parameter.minLimit ?? "—"}–${parameter.maxLimit ?? "—"}` : "Not specified";

export function StationQualityObservationPage({ checkpoints, stations = [], onBack, onSaved }) {
  const availableStations = stations.length ? stations : [...new Set(checkpoints.map((item) => item.process).filter(Boolean))].map((name) => ({ id: name, code: "", name }));
  const initialStation = availableStations[0]?.name || "";
  const initialCheckpoint = checkpoints.find((item) => item.process === initialStation) || checkpoints[0];
  const [form, setForm] = useState({ station: initialStation, checkpointId: initialCheckpoint?.id || "", productionDate: new Date().toISOString().slice(0, 10), shift: "A", cycleNumber: "", remarks: "", correctiveAction: "" });
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const stationCheckpoints = useMemo(() => checkpoints.filter((item) => !form.station || item.process === form.station), [checkpoints, form.station]);
  const selected = checkpoints.find((item) => Number(item.id) === Number(form.checkpointId));
  const configuredParameters = selected?.parameters?.length ? selected.parameters : selected ? [selected] : [];
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeStation = (value) => { const first = checkpoints.find((item) => item.process === value); setForm((current) => ({ ...current, station: value, checkpointId: first?.id || "", cycleNumber: "" })); setValues({}); };
  const changeCheckpoint = (value) => { setForm((current) => ({ ...current, checkpointId: value, cycleNumber: "" })); setValues({}); };
  const updateValue = (parameter, value) => setValues((current) => ({ ...current, [parameterKey(parameter)]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError("");
    const missing = configuredParameters.some((parameter) => values[parameterKey(parameter)] === undefined || values[parameterKey(parameter)] === "");
    if (missing) { setError("Enter a result for every configured quality parameter."); return; }
    try { await request("/api/production-quality/observations", { method: "POST", body: JSON.stringify({ ...form, parameters: configuredParameters.map((parameter) => ({ parameterId: parameter.id, parameter: parameter.parameter, observedValue: values[parameterKey(parameter)] })) }) }); onSaved(); } catch (err) { setError(err.message); }
  };

  return <main className="production-quality-page quality-observation-page"><div className="production-quality-breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Production QC</button><BreadcrumbSeparator /><strong>Record Production Quality</strong></div><PageHeader eyebrow="QUALITY CAPTURE" title={selected?.name || "Record Production Quality"} description="Capture actual values against the configured target and allowed range." /><form className="quality-observation-form" onSubmit={submit}>{error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}<Card><div className="quality-observation-grid"><FormField label="Station" required><select value={form.station} onChange={(event) => changeStation(event.target.value)}><option value="">Select station...</option>{availableStations.map((station) => <option key={station.id} value={station.name}>{masterName(station)}</option>)}</select></FormField><FormField label="Checkpoint" required><select value={form.checkpointId} onChange={(event) => changeCheckpoint(event.target.value)}><option value="">Select checkpoint...</option>{stationCheckpoints.map((item) => <option key={item.id} value={item.id}>{masterName(item)}</option>)}</select></FormField><FormField label="Equipment"><input value={selected?.machine || "All equipment"} readOnly /></FormField><FormField label="Production Date" required><input type="date" value={form.productionDate} onChange={(event) => update("productionDate", event.target.value)} /></FormField><FormField label="Shift" required><select value={form.shift} onChange={(event) => update("shift", event.target.value)}><option value="A">Shift A</option><option value="B">Shift B</option><option value="C">Shift C</option></select></FormField>{selected?.frequency === "CYCLE" && <FormField label="Cycle Number" required><input value={form.cycleNumber} onChange={(event) => update("cycleNumber", event.target.value)} /></FormField>}</div></Card><Card><div className="quality-observation-context"><span><small>Process</small><strong>{selected?.process || "—"}</strong></span><span><small>Station</small><strong>{selected?.process || "—"}</strong></span><span><small>Equipment</small><strong>{selected?.machine || "All equipment"}</strong></span><span><small>Parameters</small><strong>{configuredParameters.length}</strong></span></div><div className="quality-observation-parameter-list"><h2>Actual measurements</h2>{configuredParameters.map((parameter) => <section className="quality-observation-parameter" key={parameterKey(parameter)}><div><strong>{parameterLabel(parameter)}</strong><span>Target: {targetLabel(parameter)} {parameter.uom || ""}</span><span>Allowed: {allowedLabel(parameter)} {parameter.uom || ""}</span></div><FormField label={`Actual ${parameterLabel(parameter)}${parameter.uom ? ` (${parameter.uom})` : ""}`} required><input type={inputType(parameter)} step={parameter.dataType === "DECIMAL" ? "any" : undefined} value={values[parameterKey(parameter)] || ""} onChange={(event) => updateValue(parameter, event.target.value)} /></FormField></section>)}</div></Card><Card><div className="quality-observation-notes"><FormField label="Remarks"><textarea rows="4" value={form.remarks} onChange={(event) => update("remarks", event.target.value)} /></FormField><FormField label="Corrective Action"><textarea rows="4" value={form.correctiveAction} onChange={(event) => update("correctiveAction", event.target.value)} /></FormField></div></Card><div className="quality-form-actions"><Button type="button" variant="secondary" onClick={onBack}>Cancel</Button><Button type="submit">Save Quality Record</Button></div></form></main>;
}

export const StationQualityObservationDrawer = StationQualityObservationPage;
