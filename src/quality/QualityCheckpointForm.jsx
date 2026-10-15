import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BreadcrumbSeparator, Button, Card, PageHeader } from "../design-system/index.js";

const frequencyLabels = { CYCLE: "Cycle Wise", DAY: "Day Wise", SHIFT: "Shift Wise", BATCH: "Batch Wise", HOURLY: "Hourly", EVENT: "Event Based" };
const dataTypes = ["INTEGER", "DECIMAL", "TEXT", "BOOLEAN", "SELECTION"];
const emptyCheckpoint = { code: "", name: "", process: "", operationStage: "", frequency: "CYCLE", sequence: 1, parameter: "", dataType: "DECIMAL", uom: "", targetValue: "", minLimit: "", maxLimit: "", warningMin: "", warningMax: "", mandatory: true, sampleCount: 1, aggregationMethod: "NONE", passFailRule: "IN_RANGE", remarksRequiredOnFailure: false, correctiveActionRequired: false, effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "", status: "ACTIVE" };

async function request(url, options) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Request could not be completed.");
  return payload;
}

export function QualityCheckpointForm({ checkpoint, stations, parameters, onBack, onSaved }) {
  const [form, setForm] = useState(checkpoint || emptyCheckpoint);
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectParameter = (value) => {
    const selected = parameters.find((item) => item.name === value);
    setForm((current) => ({ ...current, parameter: value, dataType: selected?.dataType || current.dataType, uom: current.uom || selected?.uom || "" }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = { ...form, sequence: Number(form.sequence), sampleCount: Number(form.sampleCount), mandatory: Boolean(form.mandatory), remarksRequiredOnFailure: Boolean(form.remarksRequiredOnFailure), correctiveActionRequired: Boolean(form.correctiveActionRequired) };
      await request(checkpoint ? `/api/production-quality/checkpoints/${checkpoint.id}` : "/api/production-quality/checkpoints", { method: checkpoint ? "PATCH" : "POST", body: JSON.stringify(payload) });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };
  const currentParameterIsLegacy = form.parameter && !parameters.some((item) => item.name === form.parameter);

  return <main className="production-quality-page">
    <div className="production-quality-breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Quality</button><BreadcrumbSeparator /><strong>Quality Checkpoints</strong></div>
    <PageHeader eyebrow="QUALITY / CONFIGURATION" title={checkpoint ? "Edit Quality Checkpoint" : "Add Quality Checkpoint"} description="Configure a reusable checkpoint, parameter rule, and effective period for production quality capture." />
    <form className="quality-checkpoint-form" onSubmit={submit}>
      {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
      <Card><h2>Checkpoint identity</h2><div className="quality-form-grid">
        <label>Checkpoint Code *<input value={form.code} onChange={(event) => update("code", event.target.value)} required placeholder="e.g. STER-TEMP" /></label>
        <label>Checkpoint Name *<input value={form.name} onChange={(event) => update("name", event.target.value)} required placeholder="e.g. Sterilizer temperature" /></label>
        <label>Station *<select value={form.process} onChange={(event) => update("process", event.target.value)} required><option value="">Select a station…</option>{stations.map((station) => <option key={station.id} value={station.name}>{station.code ? `${station.code} · ` : ""}{station.name}</option>)}</select></label>
        <label>Operation / Stage *<input value={form.operationStage} onChange={(event) => update("operationStage", event.target.value)} required placeholder="e.g. Sterilizer cycle" /></label>
      </div></Card>
      <Card><h2>Parameter and recording rule</h2><div className="quality-form-grid">
        <label>Recording Frequency *<select value={form.frequency} onChange={(event) => update("frequency", event.target.value)}>{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Sequence *<input type="number" min="1" value={form.sequence} onChange={(event) => update("sequence", event.target.value)} required /></label>
        <label>Quality Parameter *<select value={form.parameter} onChange={(event) => selectParameter(event.target.value)} required><option value="">Select a quality parameter…</option>{parameters.map((parameter) => <option key={parameter.id} value={parameter.name}>{parameter.code} · {parameter.name}{parameter.material ? ` · ${parameter.material === "BOTH" ? "CPO & PK" : parameter.material}` : ""}</option>)}{currentParameterIsLegacy ? <option value={form.parameter}>{form.parameter} · Existing value</option> : null}</select></label>
        <label>Data Type *<select value={form.dataType} onChange={(event) => update("dataType", event.target.value)}>{dataTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Unit of Measure<input value={form.uom} onChange={(event) => update("uom", event.target.value)} placeholder="e.g. °C, %" /></label>
        <label>Sample Count<input type="number" min="1" value={form.sampleCount} onChange={(event) => update("sampleCount", event.target.value)} /></label>
        <label>Aggregation Method<select value={form.aggregationMethod} onChange={(event) => update("aggregationMethod", event.target.value)}><option>NONE</option><option>AVERAGE</option><option>MINIMUM</option><option>MAXIMUM</option></select></label>
        <label>Pass / Fail Rule<select value={form.passFailRule} onChange={(event) => update("passFailRule", event.target.value)}><option>IN_RANGE</option><option>EXACT_MATCH</option><option>BOOLEAN_TRUE</option></select></label>
      </div></Card>
      <Card><h2>Limits and control</h2><div className="quality-form-grid">
        <label>Target Value<input value={form.targetValue} onChange={(event) => update("targetValue", event.target.value)} /></label>
        <label>Minimum Limit<input type="number" step="any" value={form.minLimit} onChange={(event) => update("minLimit", event.target.value)} /></label>
        <label>Maximum Limit<input type="number" step="any" value={form.maxLimit} onChange={(event) => update("maxLimit", event.target.value)} /></label>
        <label>Warning Minimum<input type="number" step="any" value={form.warningMin} onChange={(event) => update("warningMin", event.target.value)} /></label>
        <label>Warning Maximum<input type="number" step="any" value={form.warningMax} onChange={(event) => update("warningMax", event.target.value)} /></label>
        <label>Effective From *<input type="date" value={form.effectiveFrom} onChange={(event) => update("effectiveFrom", event.target.value)} required /></label>
        <label>Effective To<input type="date" value={form.effectiveTo} onChange={(event) => update("effectiveTo", event.target.value)} /></label>
        <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      </div><div className="quality-checkbox-row"><label><input type="checkbox" checked={form.mandatory} onChange={(event) => update("mandatory", event.target.checked)} /> Mandatory checkpoint</label><label><input type="checkbox" checked={form.remarksRequiredOnFailure} onChange={(event) => update("remarksRequiredOnFailure", event.target.checked)} /> Remarks required on failure</label><label><input type="checkbox" checked={form.correctiveActionRequired} onChange={(event) => update("correctiveActionRequired", event.target.checked)} /> Corrective action required</label></div></Card>
      <div className="quality-form-actions"><Button variant="secondary" onClick={onBack}>Cancel</Button><Button type="submit">{checkpoint ? "Update Checkpoint" : "Save Checkpoint"}</Button></div>
    </form>
  </main>;
}
