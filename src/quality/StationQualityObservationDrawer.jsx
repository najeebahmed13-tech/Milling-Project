import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../design-system/index.js";

async function request(url, options) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Request could not be completed.");
  return payload;
}

export function StationQualityObservationDrawer({ checkpoints, stations = [], onClose, onSaved }) {
  const availableStations = stations.length ? stations : [...new Set(checkpoints.map((item) => item.process).filter(Boolean))].map((name) => ({ id: name, code: "", name }));
  const initialStation = availableStations[0]?.name || "";
  const initialCheckpoint = checkpoints.find((item) => item.process === initialStation) || checkpoints[0];
  const [form, setForm] = useState({ station: initialStation, checkpointId: initialCheckpoint?.id || "", productionDate: new Date().toISOString().slice(0, 10), cycleNumber: "", observedValue: "", remarks: "", correctiveAction: "" });
  const [error, setError] = useState("");
  const stationCheckpoints = useMemo(() => checkpoints.filter((item) => !form.station || item.process === form.station), [checkpoints, form.station]);
  const selected = checkpoints.find((item) => Number(item.id) === Number(form.checkpointId));
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeStation = (value) => {
    const first = checkpoints.find((item) => item.process === value);
    setForm((current) => ({ ...current, station: value, checkpointId: first?.id || "", observedValue: "" }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await request("/api/production-quality/observations", { method: "POST", body: JSON.stringify(form) });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return <div className="drawer-backdrop" onClick={onClose}>
    <aside className="drawer quality-observation-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="quality-observation-title">
      <div className="drawer-head"><div><div className="eyebrow">QUALITY / PRODUCTION</div><h2 id="quality-observation-title">Record Station Quality</h2><p className="drawer-subtitle">Enter one periodic laboratory result against the selected station checkpoint.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close quality record form"><X aria-hidden="true" /></button></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={submit}>
        <label>Station *<select value={form.station} onChange={(event) => changeStation(event.target.value)} required><option value="">Select station…</option>{availableStations.map((station) => <option key={station.id} value={station.name}>{station.code ? `${station.code} · ` : ""}{station.name}</option>)}</select></label>
        <label>Checkpoint *<select value={form.checkpointId} onChange={(event) => update("checkpointId", event.target.value)} required>{stationCheckpoints.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.parameter}</option>)}</select></label>
        <label>Production Date *<input type="date" value={form.productionDate} onChange={(event) => update("productionDate", event.target.value)} required /></label>
        {selected?.frequency === "CYCLE" && <label>Cycle Number *<input value={form.cycleNumber} onChange={(event) => update("cycleNumber", event.target.value)} required /></label>}
        <label>Observed Value *<input value={form.observedValue} onChange={(event) => update("observedValue", event.target.value)} required /></label>
        <label>Remarks<textarea rows="3" value={form.remarks} onChange={(event) => update("remarks", event.target.value)} /></label>
        <label>Corrective Action<textarea rows="3" value={form.correctiveAction} onChange={(event) => update("correctiveAction", event.target.value)} /></label>
        <div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save Quality Record</Button></div>
      </form>
    </aside>
  </div>;
}
