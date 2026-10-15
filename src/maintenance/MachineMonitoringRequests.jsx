import React, { useMemo, useState } from "react";
import { Eye, Pencil, Plus, ClipboardList } from "lucide-react";
import { BreadcrumbSeparator, Button, Card, DrawerCloseButton, EmptyState, FormField, PageHeader } from "../design-system/index.js";
import { StatusBadge } from "../design-system/badges.jsx";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { getMasterDefinition } from "../config/masterData.js";
import { MACHINE_HEALTH_STANDARDS } from "../../packages/masters/machineHealthStandards.js";
import { createMonitoringRequest, MONITORING_REQUEST_SOURCES, MONITORING_REQUEST_STATUSES, summarizeRequest, validateMonitoringRequest } from "../../packages/maintenance/machineMonitoringDomain.js";
import "./machine-monitoring-requests.css";

const STORAGE_KEY = "rockeye.maintenance.machineMonitoringRequests";
const PARAMETER_KEY = "rockeye.master.machineHealthParameters";
const definition = getMasterDefinition("machineHealthParameters");
const today = () => new Date().toISOString().slice(0, 10);

function loadParameters() {
  try {
    const stored = JSON.parse(localStorage.getItem(PARAMETER_KEY) || "null");
    const existing = Array.isArray(stored) ? stored : [];
    return [...existing, ...definition.seed.filter((seed) => !existing.some((item) => item.id === seed.id))];
  } catch { return definition.seed; }
}

function loadRequests(parameters) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(stored)) return stored;
  } catch {}
  return MACHINE_HEALTH_STANDARDS.map((station) => createMonitoringRequest({ stationCode: station.stationCode, stationName: station.stationName, productionDate: today(), shift: "DAY", source: "ROUTINE" }, parameters, []));
}

function persist(requests) { localStorage.setItem(STORAGE_KEY, JSON.stringify(requests)); }

export function MachineMonitoringRequests({ onNavigate }) {
  const parameters = useMemo(loadParameters, []);
  const [requests, setRequests] = useState(() => loadRequests(parameters));
  const [search, setSearch] = useState("");
  const [station, setStation] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [drawer, setDrawer] = useState(null);

  const stations = useMemo(() => MACHINE_HEALTH_STANDARDS.map((item) => ({ code: item.stationCode, name: item.stationName })), []);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((item) => (!query || [item.requestNo, item.stationName, item.source, item.shift].some((value) => String(value || "").toLowerCase().includes(query))) && (station === "all" || item.stationCode === station) && (source === "all" || item.source === source) && (status === "all" || item.status === status));
  }, [requests, search, station, source, status]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, `${search}|${station}|${source}|${status}`);
  const saveRequest = (request) => { const next = requests.some((item) => item.id === request.id) ? requests.map((item) => item.id === request.id ? request : item) : [request, ...requests]; setRequests(next); persist(next); setDrawer(null); };
  const openCreate = () => setDrawer({ mode: "create", request: createMonitoringRequest({ stationCode: stations[0]?.code, stationName: stations[0]?.name, productionDate: today() }, parameters, requests) });

  return <main className="monitoring-requests-page">
    <div className="monitoring-requests-breadcrumb"><button type="button" onClick={() => onNavigate?.("maintenance")}>Maintenance</button><BreadcrumbSeparator /><strong>Machine Records</strong></div>
    <PageHeader eyebrow="MAINTENANCE / MACHINE RECORDS" title="Machine Records" description="Record daily machine running and health data by station from routine monitoring or Production Quality findings." actions={<Button onClick={openCreate}><Plus size={16} aria-hidden="true" /> New Machine Record</Button>} />
    <div className="monitoring-summary-grid"><Card><span>Open records</span><strong>{requests.filter((item) => item.status === "OPEN").length}</strong><small>Awaiting station monitoring</small></Card><Card><span>In progress</span><strong>{requests.filter((item) => item.status === "IN_PROGRESS").length}</strong><small>Being recorded</small></Card><Card><span>Completed today</span><strong>{requests.filter((item) => item.status === "COMPLETED" && item.productionDate === today()).length}</strong><small>Machine records captured</small></Card><Card><span>Stations</span><strong>{new Set(requests.map((item) => item.stationCode)).size}</strong><small>With machine records</small></Card></div>
    <Card className="monitoring-request-list-card"><div className="monitoring-request-heading"><div><h2>Daily machine running and health records</h2><p>Each record contains the active health parameters configured for its station.</p></div><span>{filtered.length} records</span></div><div className="monitoring-request-toolbar"><label className="monitoring-request-search"><span className="sr-only">Search machine records</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search record, station, shift..." /></label><label><span className="sr-only">Filter station</span><select value={station} onChange={(event) => setStation(event.target.value)}><option value="all">All stations</option>{stations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label><span className="sr-only">Filter source</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All sources</option>{MONITORING_REQUEST_SOURCES.map((item) => <option key={item} value={item}>{sourceLabel(item)}</option>)}</select></label><label><span className="sr-only">Filter status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{MONITORING_REQUEST_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label></div><div className="monitoring-request-table-wrap"><table className="monitoring-request-table"><thead><tr><th>Record</th><th>Station</th><th>Source</th><th>Date / Shift</th><th>Parameters</th><th>Progress</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleItems.map((item) => { const summary = summarizeRequest(item); return <tr key={item.id}><td><button type="button" className="monitoring-request-code" onClick={() => setDrawer({ mode: "detail", request: item })}>{item.requestNo}</button></td><td><strong>{item.stationName}</strong></td><td>{sourceLabel(item.source)}</td><td>{item.productionDate}<br /><small>{item.shift} shift</small></td><td>{summary.total}</td><td>{summary.completed} / {summary.total}</td><td><StatusBadge status={item.status}>{item.status.replaceAll("_", " ")}</StatusBadge></td><td><div className="monitoring-request-actions"><Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "detail", request: item })}><Eye size={15} aria-hidden="true" /> View</Button><Button variant="secondary" size="sm" onClick={() => setDrawer({ mode: "edit", request: item })}><Pencil size={14} aria-hidden="true" /> Record</Button></div></td></tr>; })}</tbody></table>{!filtered.length ? <EmptyState title="No machine records found" description="Create a machine record or adjust the filters above." /> : null}</div>{pagination}</Card>{drawer ? <MonitoringRequestDrawer mode={drawer.mode} request={drawer.request} parameters={parameters} stations={stations} onClose={() => setDrawer(null)} onSave={saveRequest} /> : null}</main>;
}

function MonitoringRequestDrawer({ mode, request, parameters, stations, onClose, onSave }) {
  const [draft, setDraft] = useState(request);
  const [editing, setEditing] = useState(mode === "edit" || mode === "create");
  const [errors, setErrors] = useState({});
  const detail = mode === "detail" && !editing;
  const stationParameters = parameters.filter((item) => item.active !== false && item.stationCode === draft.stationCode);
  const update = (key, value) => { if (key === "stationCode") { const selected = stations.find((item) => item.code === value); const next = createMonitoringRequest({ ...draft, stationCode: value, stationName: selected?.name || "", productionDate: draft.productionDate }, parameters, []); setDraft({ ...draft, stationCode: value, stationName: selected?.name || "", values: next.values }); } else setDraft((current) => ({ ...current, [key]: value })); };
  const updateValue = (code, key, value) => setDraft((current) => ({ ...current, status: "IN_PROGRESS", values: current.values.map((item) => item.parameterCode === code ? { ...item, [key]: value, status: key === "value" && value !== "" ? "RECORDED" : item.status } : item) }));
  const save = (event) => { event.preventDefault(); const result = validateMonitoringRequest(draft); if (!result.valid) { setErrors(result.errors); return; } const next = { ...draft, status: summarizeRequest(draft).complete ? "COMPLETED" : draft.status === "OPEN" ? "IN_PROGRESS" : draft.status }; onSave(next); };
  return <div className="drawer-backdrop monitoring-request-drawer-backdrop" onClick={onClose}><aside className="drawer monitoring-request-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="monitoring-request-title"><div className="drawer-head monitoring-request-drawer-head"><div><div className="eyebrow">MAINTENANCE / MACHINE RECORDS</div><h2 id="monitoring-request-title">{detail ? draft.requestNo : mode === "edit" ? "Record Machine Data" : "New Machine Record"}</h2><p>{detail ? `${draft.stationName} · ${sourceLabel(draft.source)}` : "Record daily machine running and health values."}</p></div><DrawerCloseButton onClick={onClose} /></div>{detail ? <RequestDetail request={draft} onEdit={() => setEditing(true)} /> : <form className="monitoring-request-form" onSubmit={save} noValidate>{errors.values || errors.station ? <div className="monitoring-request-error" role="alert">{errors.values || errors.station}</div> : null}<div className="monitoring-request-form-grid"><FormField label="Station" required error={errors.station}><select value={draft.stationCode} onChange={(event) => update("stationCode", event.target.value)}><option value="">Select station...</option>{stations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></FormField><FormField label="Record source" required error={errors.source}><select value={draft.source} onChange={(event) => update("source", event.target.value)}>{MONITORING_REQUEST_SOURCES.map((item) => <option key={item} value={item}>{sourceLabel(item)}</option>)}</select></FormField><FormField label="Record date" required error={errors.productionDate}><input type="date" value={draft.productionDate} onChange={(event) => update("productionDate", event.target.value)} /></FormField><FormField label="Shift"><select value={draft.shift} onChange={(event) => update("shift", event.target.value)}><option>DAY</option><option>NIGHT</option><option>GENERAL</option></select></FormField></div><div className="monitoring-values-heading"><div><h3>Station parameters</h3><p>{stationParameters.length} active parameters from Monitoring Setup.</p></div></div><div className="monitoring-values-list">{draft.values.map((item) => <div className="monitoring-value-row" key={item.parameterCode}><div><strong>{item.parameterName}</strong><small>{item.parameterCode} {item.uom ? `· ${item.uom}` : ""}</small></div><input value={item.value} onChange={(event) => updateValue(item.parameterCode, "value", event.target.value)} placeholder="Enter value" aria-label={`${item.parameterName} value`} /><input value={item.remarks} onChange={(event) => updateValue(item.parameterCode, "remarks", event.target.value)} placeholder="Remarks" aria-label={`${item.parameterName} remarks`} /></div>)}</div><FormField label="Record notes"><textarea rows="3" value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Add running condition, issue reference, or handover note." /></FormField><div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{mode === "edit" ? "Save Machine Record" : "Create Machine Record"}</Button></div></form>}</aside></div>;
}

function RequestDetail({ request, onEdit }) { const summary = summarizeRequest(request); return <><div className="monitoring-request-detail-status"><StatusBadge status={request.status}>{request.status.replaceAll("_", " ")}</StatusBadge><span>{summary.completed} of {summary.total} recorded</span></div><div className="monitoring-request-detail-list"><Detail label="Station" value={request.stationName} /><Detail label="Source" value={sourceLabel(request.source)} /><Detail label="Date / shift" value={`${request.productionDate} · ${request.shift}`} /></div><div className="monitoring-request-records">{request.values.map((item) => <div key={item.parameterCode}><span>{item.parameterName}<small>{item.uom || "No unit"}</small></span><strong>{item.value || "Pending"}</strong></div>)}</div><div className="drawer-actions"><Button variant="secondary" onClick={onEdit}>Record values</Button><Button onClick={onEdit}><Pencil size={15} aria-hidden="true" /> Edit Request</Button></div></>; }
function Detail({ label, value }) { return <div className="monitoring-request-detail-row"><span>{label}</span><strong>{value}</strong></div>; }
function sourceLabel(source) { return source === "PRODUCTION_QUALITY" ? "Production Quality" : "Routine Monitoring"; }
