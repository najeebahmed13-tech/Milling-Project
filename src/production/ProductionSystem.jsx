import React, { useEffect, useMemo, useState } from "react";
import "./production.css";
import "./production-overrides.css";
import "../commercial/sales-contract-details.css";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { BreadcrumbSeparator, Button, Card, DrawerCloseButton, FormField, PageHeader } from "../design-system/components.jsx";
import { DetailSection } from "../design-system/detail-sections.jsx";
import { StatusBadge } from "../design-system/badges.jsx";
import { FileInput } from "../design-system/form-fields.jsx";
import { ImageThumbnail } from "../design-system/image-thumbnail.jsx";
import { Plus } from "lucide-react";
import { EMPTY_VALUE, formatDate } from "../shared/formatters.js";

const jsonRequest = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const responseText = await response.text();
  let payload = {};
  try { payload = responseText ? JSON.parse(responseText) : {}; } catch { payload = {}; }
  if (!response.ok) throw new Error(payload.message || responseText || "The production request could not be completed.");
  return payload;
};

const statusLabel = (value) => String(value || "").replaceAll("_", " ");

export function ProductionSystem({ mode = "runs", onApplicationRefresh, onNavigate, machineId }) {
  const [data, setData] = useState({ availableFfb: 0, lines: [], shifts: [], stations: [], machines: [], items: [], routings: [], runs: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRoutingId, setSelectedRoutingId] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const load = async () => { setLoading(true); try { setData(await jsonRequest("/api/production/overview")); setError(""); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const selectedRun = useMemo(() => data.runs.find((run) => run.id === selectedRunId), [data.runs, selectedRunId]);
  const selectedRouting = useMemo(() => data.routings.find((routing) => routing.id === selectedRoutingId) || data.routings[0], [data.routings, selectedRoutingId]);
  const selectedStation = useMemo(() => data.stations.find((station) => station.id === selectedStationId), [data.stations, selectedStationId]);
  const runsPage = usePaginatedItems(data.runs);
  const routingsPage = usePaginatedItems(data.routings);
  const stationsPage = usePaginatedItems(data.stations);
  const linesPage = usePaginatedItems(data.lines);
  const shiftsPage = usePaginatedItems(data.shifts);
  const machinesPage = usePaginatedItems(data.machines);
  const activeRuns = data.runs.filter((run) => run.status !== "COMPLETED" && run.status !== "CANCELLED").length;
  const cpoBalance = data.inventory.find((item) => item.material === "CPO")?.balance || 0;
  const availableCapacity = data.lines.reduce((sum, line) => sum + Number(line.available_capacity || 0), 0);
  const isLineMaster = mode === "lineMaster";
  const isMachineMaster = mode === "machineMaster";
  const isMachineDetails = mode === "machineDetails";
  const isStationMaster = mode === "stationMaster";
  const isProductionMaster = mode === "config" || isLineMaster || isMachineMaster;
  const selectedMachine = useMemo(() => data.machines.find((machine) => String(machine.id) === String(machineId)), [data.machines, machineId]);
  const submit = async (event, url, close = true) => {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries());
    try { await jsonRequest(url, { method: "POST", body: JSON.stringify(body) }); if (close) setModal(null); await load(); if (modal?.type === "completeRun") await onApplicationRefresh?.(); }
    catch (err) { setError(err.message); }
  };
  const submitStation = async (event, stationId = null) => {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries());
    body.stationImage = body.stationImage?.name || "";
    try { await jsonRequest(stationId ? `/api/production/stations/${stationId}` : "/api/production/stations", { method: stationId ? "PATCH" : "POST", body: JSON.stringify(body) }); setModal(null); await load(); }
    catch (err) { setError(err.message); }
  };
  const submitMachine = async (event) => {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.lineId = modal?.machine?.line_id || "";
    body.machineImage = form.get("machineImage")?.name || "";
    const selectedAttachments = Array.from(form.getAll("attachments")).filter((file) => file?.name).map((file) => file.name);
    body.attachments = selectedAttachments.length ? selectedAttachments : parseJsonList(modal?.machine?.attachments_json);
    const machineIdForUpdate = modal?.machine?.id;
    try { await jsonRequest(machineIdForUpdate ? `/api/production/machines/${machineIdForUpdate}` : "/api/production/machines", { method: machineIdForUpdate ? "PATCH" : "POST", body: JSON.stringify(body) }); setModal(null); await load(); }
    catch (err) { setError(err.message); }
  };
  if (loading) return <div className="production-loading">Loading production routing and capacity…</div>;
  if (isMachineDetails && modal?.type === "machine") return <MachineFormPage data={data} machine={modal.machine} error={error} onClose={() => { setModal(null); setError(""); }} onSubmit={submitMachine} />;
  if (isMachineDetails) return <MachineDetailsPage machine={selectedMachine} lines={data.lines} onBack={() => onNavigate?.("masterMachines")} onEdit={() => setModal({ type: "machine", machine: selectedMachine })} />;
  if (isMachineMaster && modal?.type === "machine") return <MachineFormPage data={data} error={error} onClose={() => { setModal(null); setError(""); }} onSubmit={submitMachine} />;
  if (mode === "routing" && modal?.type === "routing") return <RoutingFormPage data={data} error={error} onClose={() => { setModal(null); setError(""); }} onSaved={async () => { setModal(null); setError(""); await load(); }} setError={setError} />;
  if (mode === "routing") return <RoutingPage data={data} routingsPage={routingsPage} selectedRouting={selectedRouting} setSelectedRoutingId={setSelectedRoutingId} setModal={setModal} />;
  return <main className={`production-page ${isMachineMaster ? "machine-master-page" : ""}`}>
    <div className="production-breadcrumb"><span>{isProductionMaster || isStationMaster ? "Masters" : "Production"}</span><b>›</b><strong>{mode === "routing" ? "Routing" : isLineMaster ? "Production Line Master" : isMachineMaster ? "Machine Master" : isStationMaster ? "Station Master" : mode === "config" ? "Production Masters" : "Production Runs"}</strong></div>
    {error && <div className="production-error">{error}<button onClick={() => setError("")}>×</button></div>}
    {mode === "runs" && <>
      <div className="production-heading"><div><h1>Production Runs</h1><p>Plan, start and execute FFB manufacturing according to an approved routing.</p></div><button className="btn btn-primary" onClick={() => setModal({ type: "startRun" })}>＋ Start Production Run</button></div>
      <section className="production-kpis"><article><span>Available Received FFB</span><strong>{Number(data.availableFfb).toFixed(3)} MT</strong><small>Eligible inbound quantity</small></article><article><span>Available Mill Capacity</span><strong>{availableCapacity.toFixed(3)} MT</strong><small>Across active lines</small></article><article><span>Active Runs</span><strong>{activeRuns}</strong><small>Planned or in progress</small></article><article><span>CPO Inventory</span><strong>{Number(cpoBalance).toFixed(3)} MT</strong><small>CPO Tank 01</small></article></section>
      <section className="production-readiness"><h2>Production readiness</h2><div><span className={data.availableFfb > 0 ? "ready" : "blocked"}>{data.availableFfb > 0 ? "✓" : "!"} FFB inventory</span><span className={availableCapacity > 0 ? "ready" : "blocked"}>{availableCapacity > 0 ? "✓" : "!"} Mill capacity</span><span className={data.routings.some((item) => item.status === "ACTIVE") ? "ready" : "blocked"}>✓ Active routing</span><span className={data.lines.some((item) => item.status === "ACTIVE") ? "ready" : "blocked"}>✓ Production line</span></div></section>
      <section className="panel production-panel"><div className="production-panel-head"><h2>Production run register</h2></div><div className="table-wrap"><table><thead><tr><th>Run Number</th><th>Routing</th><th>Line</th><th>Planned FFB</th><th>Current Stage</th><th>CPO Output</th><th>Status</th><th>Action</th></tr></thead><tbody>{runsPage.visibleItems.map((run) => <tr key={run.id}><td className="production-reference">{run.run_no}</td><td>{run.routing?.name}</td><td>{run.line?.name}</td><td>{Number(run.planned_ffb_qty).toFixed(3)} MT</td><td>{run.stages.find((stage) => stage.sequence === run.current_step_sequence)?.stage_name || "Complete"}</td><td>{Number(run.cpo_output || 0).toFixed(3)} MT</td><td><span className={`production-status ${run.status.toLowerCase()}`}>{statusLabel(run.status)}</span></td><td><button className="production-link" onClick={() => setSelectedRunId(run.id)}>Open execution</button></td></tr>)}{!data.runs.length && <tr><td colSpan="8" className="production-empty">No production runs have been created.</td></tr>}</tbody></table></div>{runsPage.pagination}</section>
    </>}
    {mode === "routing" && <>
      <div className="production-heading"><div><h1>Production Routing</h1><p>Define and review the manufacturing sequence from received FFB to CPO and Palm Kernel, including configurable quality checkpoints.</p></div><button className="btn btn-primary" onClick={() => setModal({ type: "routing" })}>＋ New Routing</button></div>
      <div className="routing-layout"><aside className="routing-list">{routingsPage.visibleItems.map((routing) => <button className={selectedRouting?.id === routing.id ? "active" : ""} key={routing.id} onClick={() => setSelectedRoutingId(routing.id)}><strong>{routing.name}</strong><span>{routing.code} · Version {routing.version}</span><small>{routing.steps.length} stages · {routing.status}</small></button>)}{routingsPage.pagination}</aside>{selectedRouting && <section className="routing-view"><div className="routing-title"><div><span>ACTIVE ROUTING</span><h2>{selectedRouting.name}</h2><p>{selectedRouting.code} · Version {selectedRouting.version} · Input {selectedRouting.input_material}</p></div><div>{selectedRouting.outputs.map((output) => <b key={output}>{output}</b>)}</div></div><div className="route-sequence">{selectedRouting.steps.map((step, index) => <article key={step.id}><div className="route-number">{step.sequence}</div><div className="route-card"><div><span>{step.code}</span><h3>{step.name}</h3><p>{step.station}{step.machine ? ` · ${step.machine}` : ""}</p></div><div className="route-meta"><small>{step.input_material || "–"} → {step.output_material || "–"}</small><small>{step.planned_duration_minutes} min</small>{step.qualityChecks?.length ? <b>{step.qualityChecks.map((check) => `${check.parameter} · ${check.timing === "BEFORE_PROCESS" ? "Before" : "After"}`).join(" | ")}</b> : <small>No quality checkpoint configured</small>}</div></div>{index < selectedRouting.steps.length - 1 && <div className="route-arrow">↓</div>}</article>)}</div></section>}</div>
    </>}
    {isStationMaster && <>
      <div className="production-heading"><div><h1>Station Master</h1><p>Maintain the physical and functional sections of the palm oil mill used by machines, routings and quality checkpoints.</p></div><button className="btn btn-primary" onClick={() => setModal({ type: "station" })}>＋ Add Station</button></div>
      <section className="panel production-panel"><div className="production-panel-head"><h2>Mill Stations</h2></div><div className="table-wrap"><table><thead><tr><th>Station Image</th><th>Station Name</th><th>Station Code</th><th>Description</th><th>Status</th></tr></thead><tbody>{stationsPage.visibleItems.map((station) => <tr key={station.id}><td><ImageThumbnail src={station.station_image} alt={`${station.name} station`} /></td><td><button className="station-name-link" onClick={() => setSelectedStationId(station.id)}>{station.name}</button></td><td className="production-reference">{station.code}</td><td>{station.description || EMPTY_VALUE}</td><td><StatusBadge status={station.status}>{statusLabel(station.status)}</StatusBadge></td></tr>)}{!data.stations.length && <tr><td colSpan="5" className="production-empty">No stations have been created.</td></tr>}</tbody></table></div>{stationsPage.pagination}</section>
      {selectedStation && <StationDetailsDrawer station={selectedStation} onClose={() => setSelectedStationId(null)} onEdit={() => { setSelectedStationId(null); setModal({ type: "editStation", station: selectedStation }); }} />}
    </>}
    {isProductionMaster && <>
      <div className="production-heading"><div><h1>{isLineMaster ? "Production Line Master" : isMachineMaster ? "Machine Master" : "Production Masters"}</h1><p>{isLineMaster ? "Maintain mill production lines and review their configured shifts and capacity." : isMachineMaster ? "Maintain machines, process stations, line assignments and rated capacities." : "Maintain mill lines, machines and the capacity masters required before production starts."}</p></div><div className="production-heading-actions">{isLineMaster && <button className="btn btn-secondary" onClick={() => onNavigate?.("master:shifts")}>Manage Shifts</button>}{!isLineMaster && <button className="btn btn-secondary" onClick={() => setModal({ type: "machine" })}>＋ Machine</button>}{!isMachineMaster && <button className="btn btn-primary" onClick={() => setModal({ type: "line" })}>＋ Production Line</button>}</div></div>
      <section className={`config-grid ${isLineMaster || isMachineMaster ? "single" : ""}`}>{!isMachineMaster && <article className="panel"><div className="production-panel-head"><h2>Production Lines</h2></div>{linesPage.visibleItems.map((line) => <div className="config-row" key={line.id}><div><strong>{line.name}</strong><span>{line.code} · {line.shift_hours} hour default shift</span></div><div><strong>{Number(line.capacity_per_shift).toFixed(3)} {line.capacity_uom}</strong><span>{Number(line.available_capacity).toFixed(3)} available</span></div></div>)}{linesPage.pagination}</article>}{isLineMaster && <article className="panel"><div className="production-panel-head"><h2>Configured Shifts</h2><span>Read-only mill-level view</span></div>{shiftsPage.visibleItems.map((shift) => <div className="config-row" key={shift.id}><div><strong>{shift.name}</strong><span>{shift.code} · {shift.start_time}—{shift.end_time}</span></div><div><strong>{shift.capacity_mt ? `${Number(shift.capacity_mt).toFixed(3)} ${shift.capacity_uom || "MT"}` : "Mill capacity"}</strong><span>{shift.line_id ? data.lines.find((line) => line.id === shift.line_id)?.name || "—" : "Available to production lines"}</span></div></div>)}{shiftsPage.pagination}</article>}{!isLineMaster && <article className="panel"><div className="production-panel-head"><h2>Machines & Stations</h2></div>{machinesPage.visibleItems.map((machine) => <div className="config-row" key={machine.id}><div><strong>{machine.name}</strong><span>{machine.code} · {machine.station}</span></div><div><strong>{machine.rated_capacity || "–"}</strong><span>{machine.capacity_uom}</span></div></div>)}{machinesPage.pagination}</article>}</section>
      {mode === "config" && <section className="panel production-master-map"><div className="production-panel-head"><h2>Required manufacturing masters</h2><span>Core architecture</span></div><div>{["Materials & UOM","Production lines","Machines & stations","Routing versions","Routing stages","Quality parameters","Sampling frequency","Storage locations","Shift calendar","Loss reasons"].map((item) => <span key={item}>✓ {item}</span>)}</div></section>}
    </>}
    {isMachineMaster && <MachineMasterListing machinesPage={machinesPage} onNavigate={onNavigate} />}
    {selectedRun && <RunExecution run={selectedRun} onClose={() => setSelectedRunId(null)} onAction={setModal} />}
    {modal && modal.type !== "machine" && (modal.type === "station" || modal.type === "editStation"
      ? <StationFormDrawer station={modal.station} title={modal.type === "editStation" ? "Edit Station" : "Add Station"} submitLabel={modal.type === "editStation" ? "Update Station" : "Save Station"} error={error} onClose={() => { setModal(null); setError(""); }} onSubmit={(event) => submitStation(event, modal.station?.id)} />
      : <ProductionModal modal={modal} data={data} error={error} onClose={() => { setModal(null); setError(""); }} onSubmit={submit} reload={load} setError={setError} />)}
  </main>;
}

function RoutingPage({ data, routingsPage, selectedRouting, setSelectedRoutingId, setModal }) {
  return (
    <main className="production-page routing-page">
      <div className="production-breadcrumb">
        <span>Production</span>
        <BreadcrumbSeparator />
        <strong>Routing</strong>
      </div>
      <PageHeader
        className="production-system-page-header"
        title="Production Routing"
        description="Define and review the manufacturing sequence from received FFB to CPO and Palm Kernel, including configurable quality checkpoints."
        actions={<Button onClick={() => setModal({ type: "routing" })}><Plus size={15} aria-hidden="true" /> New Routing</Button>}
      />
      <div className="routing-layout">
        <aside className="routing-list">
          {routingsPage.visibleItems.map((routing) => (
            <button className={selectedRouting?.id === routing.id ? "active" : ""} key={routing.id} onClick={() => setSelectedRoutingId(routing.id)}>
              <strong>{routing.name}</strong>
              <span>{routing.code} · Version {routing.version}</span>
              <small>{routing.steps.length} stages · {routing.status}</small>
            </button>
          ))}
          {routingsPage.pagination}
        </aside>
        {selectedRouting && (
          <Card className="routing-view">
            <div className="routing-title">
              <div>
                <span>ACTIVE ROUTING</span>
                <h2>{selectedRouting.name}</h2>
                <p>{selectedRouting.code} · Version {selectedRouting.version} · Input {selectedRouting.input_material}</p>
              </div>
              <div className="routing-output-list">
                {selectedRouting.outputs.map((output) => <span className="ds-status ds-status-info" key={output}>{output}</span>)}
              </div>
            </div>
            <div className="route-sequence">
              {selectedRouting.steps.map((step, index) => (
                <article key={step.id}>
                  <div className="route-number">{step.sequence}</div>
                  <div className="route-card">
                    <div>
                      <span>{step.code}</span>
                      <h3>{step.name}</h3>
                      <p>{step.station}{step.machine ? ` · ${step.machine}` : ""}</p>
                    </div>
                    <div className="route-meta">
                      <small>{step.input_material || "—"} → {step.output_material || "—"}</small>
                      <small>{step.planned_duration_minutes} min</small>
                      {step.qualityChecks?.length ? <b>{step.qualityChecks.map((check) => `${check.parameter} · ${check.timing === "BEFORE_PROCESS" ? "Before" : "After"}`).join(" | ")}</b> : <small>No quality checkpoint configured</small>}
                    </div>
                  </div>
                  {index < selectedRouting.steps.length - 1 && <div className="route-arrow" aria-hidden="true">↓</div>}
                </article>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

function RoutingFormPage({ data, error, onClose, onSaved, setError }) {
  const [steps, setSteps] = useState([{ name: "", code: "STEP-01", station: "", machine: "", inputMaterial: "FFB", outputMaterial: "", durationMinutes: 60, qualityRequired: true, qualityParameter: "", qualityTiming: "AFTER_PROCESS", qualityFrequencyMinutes: 120 }]);
  const [outputItemIds, setOutputItemIds] = useState([]);
  const routingSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await jsonRequest("/api/production/routings", {
        method: "POST",
        body: JSON.stringify({ code: form.get("code"), name: form.get("name"), version: form.get("version"), inputMaterial: "FFB", outputItemIds, steps }),
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    }
  };
  const updateStep = (index, key, value) => setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, [key]: value } : step));
  return (
    <main className="production-page routing-form-page">
      <div className="production-breadcrumb"><button type="button" className="production-breadcrumb-button" onClick={onClose}>Production Routing</button><BreadcrumbSeparator /><strong>New Routing</strong></div>
      <div className="production-heading routing-form-heading"><div><span className="routing-form-eyebrow">PRODUCTION / MANUFACTURING</span><h1>Create Production Routing</h1><p>Define the manufacturing sequence, outputs, and quality checkpoints for a routing version.</p></div></div>
      {error && <div className="production-error" role="alert">{error}<button type="button" onClick={() => setError("")}>×</button></div>}
      <form className="routing-form-surface" onSubmit={routingSubmit}>
        <section className="routing-form-section"><div className="routing-form-section-heading"><h2>Routing details</h2><span>Required master definition</span></div><div className="production-form-grid"><label>Routing Code<input name="code" required autoComplete="off" /></label><label>Routing Name<input name="name" required /></label><label>Version<input name="version" type="number" min="1" defaultValue="1" required /></label><label>Input Material<input value="FFB" readOnly /></label><label className="routing-form-wide">Outputs from Item Master<select multiple required value={outputItemIds.map(String)} onChange={(event) => setOutputItemIds([...event.target.selectedOptions].map((option) => Number(option.value)))}>{data.items.filter((item) => item.status === "Active" || item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.item_code} · {item.name} ({item.unit || "MT"})</option>)}</select><small className="routing-form-help">Select one or more active output Items. Use Ctrl/Cmd-click to select multiple items.</small></label></div></section>
        <section className="routing-form-section"><div className="routing-builder-head"><div><h2>Routing stages and quality checkpoints</h2><p>Add each process stage in execution order.</p></div><button type="button" onClick={() => setSteps((current) => [...current, { name: "", code: `STEP-${String(current.length + 1).padStart(2, "0")}`, station: "", machine: "", inputMaterial: "", outputMaterial: "", durationMinutes: 60, qualityRequired: false, qualityParameter: "", qualityTiming: "AFTER_PROCESS", qualityFrequencyMinutes: 120 }])}>＋ Add Stage</button></div><div className="routing-builder routing-form-builder"><div className="routing-form-builder-labels"><span>#</span><span>Stage code</span><span>Stage name</span><span>Station</span><span>Machine</span><span>Output material</span><span>Quality parameter</span><span>Timing</span><span /></div>{steps.map((step, index) => <div className="routing-builder-row" key={index}><b>{index + 1}</b><input value={step.code} onChange={(event) => updateStep(index, "code", event.target.value)} placeholder="Code" required /><input value={step.name} onChange={(event) => updateStep(index, "name", event.target.value)} placeholder="Stage name" required /><input value={step.station} onChange={(event) => updateStep(index, "station", event.target.value)} placeholder="Station" required /><select value={step.machine} onChange={(event) => updateStep(index, "machine", event.target.value)}><option value="">Machine...</option>{data.machines.map((machine) => <option key={machine.id} value={machine.name}>{machine.name}</option>)}</select><input value={step.outputMaterial} onChange={(event) => updateStep(index, "outputMaterial", event.target.value)} placeholder="Output" /><input value={step.qualityParameter} onChange={(event) => updateStep(index, "qualityParameter", event.target.value)} placeholder="Parameter" /><select value={step.qualityTiming} onChange={(event) => updateStep(index, "qualityTiming", event.target.value)}><option value="BEFORE_PROCESS">Before process</option><option value="AFTER_PROCESS">After process</option></select><button type="button" disabled={steps.length === 1} aria-label={`Remove stage ${index + 1}`} onClick={() => setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index))}>×</button></div>)}</div></section>
        <div className="routing-form-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save Routing</button></div>
      </form>
    </main>
  );
}

function MachineMasterListing({ machinesPage, onNavigate }) {
  return <section className="panel production-panel machine-master-listing">
    <div className="production-panel-head"><div><h2>Machine register</h2><span>Configured equipment and service tracking</span></div></div>
    <div className="table-wrap"><table><thead><tr><th>Machine Image</th><th>Machine Name</th><th>Machine Code</th><th>Station</th><th>Vendor</th><th>Capacity</th><th>Service Type</th><th>Last Service</th><th>Status</th></tr></thead><tbody>
      {machinesPage.visibleItems.map((machine) => <tr key={machine.id}><td><ImageThumbnail src={machine.machine_image} alt={`${machine.name} machine`} /></td><td><button type="button" className="machine-name-link" onClick={() => onNavigate?.(`machineDetails:${machine.id}`)}>{machine.name}</button></td><td className="production-reference">{machine.code}</td><td>{machine.station || EMPTY_VALUE}</td><td>{machine.vendor || EMPTY_VALUE}</td><td>{machine.rated_capacity == null ? EMPTY_VALUE : `${machine.rated_capacity} ${machine.capacity_uom || ""}`}</td><td>{machine.service_type || EMPTY_VALUE}</td><td>{machine.last_service_date ? formatDate(machine.last_service_date) : EMPTY_VALUE}</td><td><StatusBadge status={machine.status} /></td></tr>)}
      {!machinesPage.visibleItems.length && <tr><td colSpan="9" className="production-empty">No machines have been created.</td></tr>}
    </tbody></table></div>{machinesPage.pagination}
  </section>;
}

function MachineDetailsPage({ machine, lines = [], onBack, onEdit }) {
  const attachments = parseJsonList(machine?.attachments_json);
  const productionLine = lines.find((line) => String(line.id) === String(machine?.line_id))?.name || EMPTY_VALUE;
  if (!machine) return <main className="sales-contract-details-page machine-details-page"><div className="sales-contract-breadcrumb"><button type="button" className="machine-details-back-link" onClick={onBack}>Machine Master</button><BreadcrumbSeparator /><strong>Details</strong></div><section className="sales-contract-tab-panel machine-details-empty"><strong>Machine not found</strong><span>The machine record may have been removed or is unavailable.</span><Button variant="secondary" onClick={onBack}>Back to Machine Master</Button></section></main>;
  return <main className="sales-contract-details-page machine-details-page">
    <div className="sales-contract-breadcrumb"><button type="button" className="machine-details-back-link" onClick={onBack}>Machine Master</button><BreadcrumbSeparator /><strong>Details</strong></div>
    <div className="sales-contract-details-heading"><div><div className="sales-contract-title-line"><h1>{machine.name}</h1><span className="sales-contract-code">{machine.code}</span><StatusBadge status={machine.status} /></div><p>{machine.station || EMPTY_VALUE} · Machine Master · {machine.vendor || "Vendor not recorded"}</p></div><div className="sales-contract-detail-actions"><Button variant="secondary" onClick={onBack}>Back to Listing</Button><Button onClick={onEdit}>Edit Machine</Button></div></div>
    <div className="sales-contract-detail-layout machine-details-layout"><div className="sales-contract-main">
      <section className="sales-contract-card"><h2>1. Machine Identification & Assignment</h2><div className="sales-contract-grid">{[["Machine Name", machine.name], ["Machine Code", machine.code], ["Station", machine.station], ["Production Line", productionLine], ["Status", machine.status]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || EMPTY_VALUE}</strong></div>)}</div></section>
      <section className="sales-contract-card"><h2>2. Installation & OEM Information</h2><div className="sales-contract-grid">{[["Installation Date", machine.installation_date ? formatDate(machine.installation_date) : EMPTY_VALUE], ["Vendor", machine.vendor], ["Model No.", machine.model_no], ["OEM Serial No.", machine.oem_serial_no], ["Machine Image", machine.machine_image ? "Available" : EMPTY_VALUE]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || EMPTY_VALUE}</strong></div>)}</div></section>
      <section className="sales-contract-card"><h2>3. Capacity & Service Configuration</h2><div className="sales-contract-grid">{[["Capacity", machine.rated_capacity == null ? EMPTY_VALUE : machine.rated_capacity], ["Calibrated Unit", machine.capacity_uom], ["Service Type", machine.service_type], ["Last Service Date", machine.last_service_date ? formatDate(machine.last_service_date) : EMPTY_VALUE], ["Service Threshold", machine.service_threshold]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || EMPTY_VALUE}</strong></div>)}</div></section>
      <section className="sales-contract-card"><h2>4. Description & Attachments</h2><p className="sales-contract-terms">{machine.description || "No description recorded."}</p>{attachments.length ? <div className="machine-details-attachments">{attachments.map((attachment) => <span key={attachment}>{attachment}</span>)}</div> : <p className="muted">No attachments recorded.</p>}</section>
    </div><aside className="sales-contract-side"><section className="sales-contract-card"><h2>Quick Machine Snapshot</h2>{[["Machine Code", machine.code], ["Station", machine.station], ["Capacity", machine.rated_capacity == null ? EMPTY_VALUE : `${machine.rated_capacity} ${machine.capacity_uom || ""}`], ["Service Type", machine.service_type], ["Last Service", machine.last_service_date ? formatDate(machine.last_service_date) : EMPTY_VALUE]].map(([label, value]) => <div className="sales-contract-snapshot" key={label}><span>{label}</span><strong>{value || EMPTY_VALUE}</strong></div>)}</section><section className="sales-contract-card"><h2>Machine Status</h2><p className="sales-contract-status-copy">This machine is currently <StatusBadge status={machine.status} />.</p><p className="muted">Machine master data is used by routing and production execution.</p></section></aside></div>
  </main>;
}

function parseJsonList(value) {
  try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function MachineFormPage({ data, machine, error, onClose, onSubmit }) {
  const isEditing = Boolean(machine);
  return <main className="production-page machine-form-page">
    <div className="production-breadcrumb"><button type="button" className="machine-form-back" onClick={onClose}>Machine Master</button><BreadcrumbSeparator /><strong>{isEditing ? "Edit Machine" : "Add Machine"}</strong></div>
    <PageHeader eyebrow="MASTERS / EQUIPMENT MANAGEMENT" title={isEditing ? "Edit Machine" : "Add Machine"} description={isEditing ? "Update machine master data and service information." : "Register a machine and its service information for mill operations."} actions={<Button variant="secondary" onClick={onClose}>Back</Button>} className="machine-form-heading" />
    {error && <div className="production-error" role="alert">{error}</div>}
    <form className="machine-form-surface" onSubmit={onSubmit}>
      <section className="machine-form-section"><div className="machine-form-section-heading"><h2>Machine information</h2><span>Required fields marked *</span></div><div className="machine-form-grid">
        <FormField label="Machine Name" required><input className="ds-input" name="name" defaultValue={machine?.name || ""} required /></FormField>
        <FormField label="Machine Code" required><input className="ds-input" name="code" defaultValue={machine?.code || ""} required spellCheck={false} /></FormField>
        <FormField label="Machine Image"><FileInput name="machineImage" accept="image/*" /></FormField>
        <FormField label="Station Selection" required><select className="ds-input" name="station" defaultValue={machine?.station || ""} required><option value="">Select station…</option>{data.stations.map((station) => <option key={station.id} value={station.name}>{station.code} · {station.name}</option>)}</select></FormField>
        <FormField label="Installation Date"><input className="ds-input" name="installationDate" type="date" defaultValue={machine?.installation_date || ""} /></FormField>
        <FormField label="Vendor"><input className="ds-input" name="vendor" defaultValue={machine?.vendor || ""} /></FormField>
        <FormField label="Model No."><input className="ds-input" name="modelNo" defaultValue={machine?.model_no || ""} /></FormField>
        <FormField label="OEM Serial No."><input className="ds-input" name="oemSerialNo" defaultValue={machine?.oem_serial_no || ""} spellCheck={false} /></FormField>
      </div></section>
      <section className="machine-form-section"><div className="machine-form-section-heading"><h2>Capacity & service</h2><span>Configure service tracking for this machine.</span></div><div className="machine-form-grid">
        <FormField label="Capacity"><input className="ds-input" name="ratedCapacity" type="number" defaultValue={machine?.rated_capacity ?? ""} min="0" step="0.001" inputMode="decimal" /></FormField>
        <FormField label="Calibrated Unit"><select className="ds-input" name="capacityUom" defaultValue={machine?.capacity_uom || "Mt/hr"}><option>hr</option><option>MT</option><option>Mt/hr</option></select></FormField>
        <FormField label="Service Type" required><select className="ds-input" name="serviceType" defaultValue={machine?.service_type || ""} required><option value="">Select service type…</option><option>Inhouse</option><option>Outside</option></select></FormField>
        <FormField label="Last Service Date" required><input className="ds-input" name="lastServiceDate" type="date" defaultValue={machine?.last_service_date || ""} required /></FormField>
        <FormField label="Service Threshold" required><input className="ds-input" name="serviceThreshold" defaultValue={machine?.service_threshold || ""} required placeholder="e.g. 500 hr" /></FormField>
        <FormField label="Status" required><select className="ds-input" name="status" defaultValue={machine?.status || "ACTIVE"} required><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></FormField>
      </div></section>
      <section className="machine-form-section"><div className="machine-form-section-heading"><h2>Additional details</h2><span>Optional supporting information.</span></div><div className="machine-form-grid">
        <FormField label="Description" className="machine-form-wide"><textarea className="ds-input" name="description" defaultValue={machine?.description || ""} rows="4" /></FormField>
        <FormField label="Attachment" className="machine-form-wide"><FileInput name="attachments" multiple /></FormField>
      </div></section>
      <div className="machine-form-actions"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit">{isEditing ? "Update Machine" : "Save Machine"}</Button></div>
    </form>
  </main>;
}

function StationDetailsDrawer({ station, onClose, onEdit }) {
  const status = String(station.status || "").toUpperCase();
  return <div className="drawer-backdrop station-details-backdrop" onClick={onClose}>
    <aside className="drawer station-details-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="station-details-title">
      <div className="drawer-head">
        <div>
          <div className="eyebrow">MASTERS / STATION MASTER</div>
          <h2 id="station-details-title">{station.name}</h2>
        </div>
        <DrawerCloseButton onClick={onClose} label="Close station details" />
      </div>
      <div className="station-details-body">
        <DetailSection title="Station overview" description="Saved station master information." status={<StatusBadge status={status}>{statusLabel(status)}</StatusBadge>}>
          <div className="station-detail-image"><ImageThumbnail src={station.station_image} alt={`${station.name} station`} size="md" /></div>
          <div className="station-detail-grid">
            <div><span>Station Name</span><strong>{station.name || EMPTY_VALUE}</strong></div>
            <div><span>Station Code</span><strong>{station.code || EMPTY_VALUE}</strong></div>
            <div className="station-detail-wide"><span>Description</span><strong>{station.description || EMPTY_VALUE}</strong></div>
          </div>
        </DetailSection>
      </div>
      <div className="drawer-action-strip station-details-actions"><button className="btn btn-primary" onClick={onEdit}>Edit Station</button></div>
    </aside>
  </div>;
}

function StationFormDrawer({ station, title, submitLabel, error, onClose, onSubmit }) {
  return <div className="drawer-backdrop station-drawer-backdrop" onClick={onClose}>
    <aside
      className="drawer station-drawer drawer-form-surface"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-form-title"
    >
      <div className="drawer-head">
        <div>
          <div className="eyebrow">MASTERS / STATION MASTER</div>
          <h2 id="station-form-title">{title}</h2>
        </div>
        <DrawerCloseButton onClick={onClose} label="Close station form" />
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={onSubmit}>
        <section className="station-form-section station-form-intro">
          <h3>Station details</h3>
          <p>Capture the station identity, supporting image, and current availability for master-data use.</p>
        </section>
        <section className="station-form-section">
          <div className="drawer-section-heading"><h3>Station information</h3><span>Required fields marked *</span></div>
          <div className="station-form-grid">
            <label>Station Name *<input name="name" placeholder="e.g. Pressing" defaultValue={station?.name || ""} required /></label>
            <label>Station Code *<input name="code" placeholder="e.g. ST-PRESS" defaultValue={station?.code || ""} required /></label>
            <label className="station-form-wide">Description<textarea name="description" rows="4" placeholder="Add a station description…" defaultValue={station?.description || ""} /></label>
            <label>Station Image<FileInput name="stationImage" accept="image/*" /></label>
            <label>Status *<select name="status" defaultValue={station?.status || "ACTIVE"} required><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          </div>
        </section>
        <div className="drawer-action-strip station-drawer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{submitLabel}</button>
        </div>
      </form>
    </aside>
  </div>;
}

function RunExecution({ run, onClose, onAction }) {
  const completed = run.stages.filter((stage) => stage.status === "COMPLETED").length;
  return <div className="production-execution"><div className="execution-head"><div><span>PRODUCTION EXECUTION</span><h2>{run.run_no}</h2><p>{run.routing?.name} · {run.line?.name} · {Number(run.planned_ffb_qty).toFixed(3)} MT FFB</p></div><button onClick={onClose}>×</button></div><div className="execution-progress"><div><span>Routing progress</span><strong>{completed} / {run.stages.length} stages</strong></div><i><b style={{ width: `${run.stages.length ? completed / run.stages.length * 100 : 0}%` }} /></i></div><div className="execution-stages">{run.stages.map((stage) => <article key={stage.id} className={stage.status.toLowerCase()}><div className="execution-sequence">{stage.sequence}</div><div className="execution-stage-main"><div><span>{stage.station}</span><h3>{stage.stage_name}</h3><p>{stage.machine || "No machine assigned"}</p></div><div className="execution-quantities"><span>Input <b>{stage.input_qty ?? "–"}</b></span><span>Output <b>{stage.output_qty ?? "–"}</b></span><span>Loss <b>{stage.loss_qty ?? "–"}</b></span></div><div className="execution-quality"><span>{stage.quality_required ? `Quality: ${stage.quality_frequency_minutes || "configured"} min` : "Quality: as required"}</span><b>{stage.qualityResults.length} results</b></div></div><div className="execution-actions"><span className={`production-status ${stage.status.toLowerCase()}`}>{statusLabel(stage.status)}</span><button disabled={stage.status !== "PENDING"} onClick={() => onAction({ type: "startStage", run, stage })}>Start</button><button disabled={stage.status !== "IN_PROGRESS"} onClick={() => onAction({ type: "completeStage", run, stage })}>Record output</button><button disabled={stage.status === "PENDING"} onClick={() => onAction({ type: "quality", run, stage })}>Quality test</button></div></article>)}</div><div className="execution-footer"><div><span>Total recorded loss</span><strong>{Number(run.total_loss || 0).toFixed(3)} MT</strong></div><button className="btn btn-primary" disabled={completed !== run.stages.length || run.status === "COMPLETED"} onClick={() => onAction({ type: "completeRun", run })}>{run.status === "COMPLETED" ? "Production Completed" : "Complete Production Run"}</button></div></div>;
}

function ProductionModal({ modal, data, error, onClose, onSubmit, reload, setError }) {
  const [steps, setSteps] = useState([{ name: "", code: "STEP-01", station: "", machine: "", inputMaterial: "FFB", outputMaterial: "", durationMinutes: 60, qualityRequired: true, qualityParameter: "", qualityTiming: "AFTER_PROCESS", qualityFrequencyMinutes: 120 }]);
  const act = async (url) => { setError(""); try { await jsonRequest(url, { method: "POST", body: "{}" }); onClose(); await reload(); } catch (err) { setError(err.message); } };
  const routingSubmit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await jsonRequest('/api/production/routings', { method: 'POST', body: JSON.stringify({ code: form.get('code'), name: form.get('name'), version: form.get('version'), inputMaterial: 'FFB', outputs: ['CPO','PK'], steps }) }); onClose(); await reload(); } catch (err) { setError(err.message); } };
  const updateStep = (index, key, value) => setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, [key]: value } : step));
  return <div className="production-modal-backdrop"><form className="production-modal" onSubmit={modal.type === "routing" ? routingSubmit : modal.type === "startRun" ? (event) => onSubmit(event, "/api/production/runs") : modal.type === "line" ? (event) => onSubmit(event, "/api/production/lines") : modal.type === "shift" ? (event) => onSubmit(event, "/api/production/shifts") : modal.type === "machine" ? (event) => onSubmit(event, "/api/production/machines") : modal.type === "station" ? (event) => onSubmit(event, "/api/production/stations") : modal.type === "completeStage" ? (event) => onSubmit(event, `/api/production/runs/${modal.run.id}/stages/${modal.stage.id}/complete`) : modal.type === "quality" ? (event) => onSubmit(event, `/api/production/runs/${modal.run.id}/stages/${modal.stage.id}/quality`) : modal.type === "completeRun" ? (event) => onSubmit(event, `/api/production/runs/${modal.run.id}/complete`) : (event) => { event.preventDefault(); act(`/api/production/runs/${modal.run.id}/stages/${modal.stage.id}/start`); }}><div className="production-modal-head"><div><span>PRODUCTION / MANUFACTURING</span><h2>{({ startRun:"Start Production Run", routing:"Create Production Routing", line:"Add Production Line", shift:"Add Production Shift", machine:"Add Machine", station:"Add Mill Station", startStage:"Start Routing Stage", completeStage:"Record Stage Quantities", quality:"Capture Periodic Quality Test", completeRun:"Complete Production Run" })[modal.type]}</h2></div><button type="button" onClick={onClose}>×</button></div>{error && <div className="production-error">{error}</div>}
    {modal.type === "startRun" && <div className="production-form-grid"><label>Available FFB<input disabled value={`${Number(data.availableFfb).toFixed(3)} MT`} /></label><label>Routing<select name="routingId" required><option value="">Select active routing…</option>{data.routings.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label>Production Line<select name="lineId" required><option value="">Select line…</option>{data.lines.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name} · {Number(item.available_capacity).toFixed(3)} MT available</option>)}</select></label><label>Shift<select name="shiftId" required><option value="">Select shift…</option>{data.shifts.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} ({item.start_time}—{item.end_time})</option>)}</select></label><label>Planned FFB Quantity (MT)<input name="plannedFfbQty" type="number" min="0.001" step="0.001" required /></label></div>}
    {modal.type === "line" && <div className="production-form-grid"><label>Line Code<input name="code" required /></label><label>Line Name<input name="name" required /></label><label>Capacity per Shift (MT)<input name="capacityPerShift" type="number" min="0.001" step="0.001" required /></label><label>Default Shift Hours<input name="shiftHours" type="number" min="1" defaultValue="8" required /></label><input type="hidden" name="capacityUom" value="MT" /></div>}
    {modal.type === "shift" && <div className="production-form-grid"><label>Production Line<select name="lineId" required><option value="">Select line…</option>{data.lines.filter((line) => line.status === "ACTIVE").map((line) => <option key={line.id} value={line.id}>{line.code} · {line.name}</option>)}</select></label><label>Shift Code<input name="code" placeholder="SHIFT-A" required /></label><label>Shift Name<input name="name" placeholder="Morning Shift" required /></label><label>Start Time<input name="startTime" type="time" required /></label><label>End Time<input name="endTime" type="time" required /></label><label>Capacity (MT)<input name="capacityMt" type="number" min="0" step="0.001" placeholder="Optional" /></label></div>}
    {modal.type === "machine" && <div className="production-form-grid"><label>Machine Code<input name="code" required /></label><label>Machine Name<input name="name" required /></label><label>Station<select name="station" required><option value="">Select mill station…</option>{data.stations.map((station) => <option key={station.id} value={station.name}>{station.code} · {station.name}</option>)}</select></label><label>Production Line<select name="lineId"><option value="">Unassigned</option>{data.lines.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}</select></label><label>Rated Capacity<input name="ratedCapacity" type="number" min="0" step="0.001" /></label><label>Capacity UOM<input name="capacityUom" defaultValue="MT/HOUR" /></label></div>}
    {modal.type === "station" && <div className="production-form-grid"><label>Station Code<input name="code" placeholder="e.g. ST-PRESS" required /></label><label>Station Name<input name="name" placeholder="e.g. Pressing" required /></label><label>Mill<input name="mill" defaultValue="Main Mill" required /></label><label>Section Type<select name="sectionType" required><option value="">Select section type…</option><option>Receiving</option><option>Processing</option><option>Oil Recovery</option><option>Kernel Plant</option><option>Storage</option><option>Utilities</option><option>Quality Laboratory</option><option>Dispatch</option></select></label><label>Routing Sequence<input name="sequence" type="number" min="1" defaultValue="1" required /></label><label className="wide">Description<textarea name="description" rows="3" placeholder="Purpose and operational boundary of this mill station" /></label></div>}
    {modal.type === "routing" && <><div className="production-form-grid"><label>Routing Code<input name="code" required /></label><label>Routing Name<input name="name" required /></label><label>Version<input name="version" type="number" min="1" defaultValue="1" required /></label><label>Outputs<input disabled value="CPO, Palm Kernel" /></label></div><div className="routing-builder"><div className="routing-builder-head"><h3>Routing Stages & Quality Checkpoints</h3><button type="button" onClick={() => setSteps((current) => [...current, { name:"", code:`STEP-${String(current.length + 1).padStart(2,"0")}`, station:"", machine:"", inputMaterial:"", outputMaterial:"", durationMinutes:60, qualityRequired:false, qualityParameter:"", qualityTiming:"AFTER_PROCESS", qualityFrequencyMinutes:120 }])}>＋ Add Stage</button></div>{steps.map((step, index) => <div className="routing-builder-row" key={index}><b>{index + 1}</b><input value={step.code} onChange={(e) => updateStep(index,"code",e.target.value)} placeholder="Code" required /><input value={step.name} onChange={(e) => updateStep(index,"name",e.target.value)} placeholder="Stage name" required /><input value={step.station} onChange={(e) => updateStep(index,"station",e.target.value)} placeholder="Station" required /><select value={step.machine} onChange={(e) => updateStep(index,"machine",e.target.value)}><option value="">Machine…</option>{data.machines.map((machine) => <option key={machine.id}>{machine.name}</option>)}</select><input value={step.outputMaterial} onChange={(e) => updateStep(index,"outputMaterial",e.target.value)} placeholder="Output material" /><input value={step.qualityParameter} onChange={(e) => updateStep(index,"qualityParameter",e.target.value)} placeholder="Quality parameter" /><select value={step.qualityTiming} onChange={(e) => updateStep(index,"qualityTiming",e.target.value)}><option value="BEFORE_PROCESS">Before process</option><option value="AFTER_PROCESS">After process</option></select><button type="button" disabled={steps.length === 1} onClick={() => setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index))}>×</button></div>)}</div></>}
    {modal.type === "startStage" && <div className="production-confirm"><strong>{modal.stage.sequence}. {modal.stage.stage_name}</strong><p>Starting this stage records the actual start time and changes the production run to In Progress.</p></div>}
    {modal.type === "completeStage" && <div className="production-form-grid"><label>Input Quantity (MT)<input name="inputQty" type="number" min="0" step="0.001" required /></label><label>Output Quantity (MT)<input name="outputQty" type="number" min="0" step="0.001" required /></label><label>Loss Quantity (MT)<input name="lossQty" type="number" min="0" step="0.001" defaultValue="0" required /></label><label className="wide">Remarks<textarea name="remarks" rows="3" /></label></div>}
    {modal.type === "quality" && <div className="production-form-grid"><label>Process Station<input disabled value={modal.stage.station} /></label><label>Checkpoint Timing<select name="timing" defaultValue={modal.stage.qualityChecks?.[0]?.timing || "AFTER_PROCESS"}><option value="BEFORE_PROCESS">Before process</option><option value="AFTER_PROCESS">After process</option></select></label><label>Quality Parameter{modal.stage.qualityChecks?.length ? <select name="parameter" required><option value="">Select configured parameter…</option>{modal.stage.qualityChecks.map((check) => <option key={check.id} value={check.parameter}>{check.parameter}{check.uom ? ` (${check.uom})` : ""}</option>)}</select> : <input name="parameter" placeholder="e.g. FFA, Moisture, Temperature" required />}</label><label>Result<input name="resultValue" required /></label><label>UOM<input name="uom" placeholder="%, °C, ppm" /></label><label>Test Status<select name="status" required><option>PASS</option><option>REVIEW</option><option>OUT_OF_SPEC</option></select></label><label>Tested By<input name="testedBy" defaultValue="Sean Shapiro" required /></label><label className="wide">Remarks<textarea name="remarks" rows="3" /></label></div>}
    {modal.type === "completeRun" && <div className="production-form-grid"><label>CPO Output to CPO Tank 01 (MT)<input name="cpoOutput" type="number" min="0.001" step="0.001" required /></label><label>Palm Kernel Output to Kernel Silo (MT)<input name="pkOutput" type="number" min="0" step="0.001" defaultValue="0" required /></label></div>}
    <div className="production-modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary">{modal.type === "startStage" ? "Start Stage" : modal.type === "quality" ? "Save Quality Result" : modal.type === "completeStage" ? "Complete Stage" : modal.type === "completeRun" ? "Post Production Outputs" : "Save"}</button></div></form></div>;
}


