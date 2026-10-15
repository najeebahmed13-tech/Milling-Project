import React, { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Pencil, Plus } from "lucide-react";
import { getMasterDefinition } from "../config/masterData.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { BreadcrumbSeparator, Button, Card, DrawerCloseButton, EmptyState, FormField, PageHeader } from "../design-system/index.js";
import { StatusBadge } from "../design-system/badges.jsx";
import { MACHINE_HEALTH_DATA_TYPES, MACHINE_HEALTH_FREQUENCIES, normalizeMachineHealthParameter, validateMachineHealthParameter } from "../../packages/masters/machineHealthDomain.js";
import { MACHINE_HEALTH_STANDARDS } from "../../packages/masters/machineHealthStandards.js";
import "./machine-health-monitoring.css";

const STORAGE_KEY = "rockeye.master.machineHealthParameters";
const definition = getMasterDefinition("machineHealthParameters");

const emptyForm = () => ({ code: "", name: "", stationCode: "", stationName: "", machineCode: "", machineName: "", frequency: "PERIODIC", intervalMinutes: 60, dataType: "DECIMAL", uom: "", warningMin: "", warningMax: "", criticalMin: "", criticalMax: "", required: false, notes: "", active: true });

function loadRecords() {
  const seeded = definition.seed.map((record) => normalizeMachineHealthParameter(record));
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(existing)) return seeded;
    return [...existing.map(normalizeMachineHealthParameter), ...seeded.filter((seed) => !existing.some((record) => record.id === seed.id))];
  } catch { return seeded; }
}

function persist(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function fallbackStations() { return MACHINE_HEALTH_STANDARDS.map((item) => ({ id: item.stationCode, code: item.stationCode, name: item.stationName, status: "ACTIVE" })); }

function assetOptions(data, key) {
  const records = Array.isArray(data?.[key]) ? data[key] : [];
  return records.filter((item) => String(item.status || "ACTIVE").toUpperCase() === "ACTIVE").map((item) => ({ id: item.id, code: item.code || item.machineCode, name: item.name || item.machineName, stationCode: item.stationCode || item.station || "" }));
}

export function MachineHealthMonitoringMaster({ onNavigate }) {
  const [records, setRecords] = useState(loadRecords);
  const [stations, setStations] = useState(fallbackStations);
  const [machines, setMachines] = useState([]);
  const [search, setSearch] = useState("");
  const [station, setStation] = useState("all");
  const [frequency, setFrequency] = useState("all");
  const [status, setStatus] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/production/overview").then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load production assets"))).then((data) => {
      if (cancelled) return;
      const nextStations = assetOptions(data, "stations");
      setStations(nextStations.length ? nextStations : fallbackStations());
      setMachines(assetOptions(data, "machines"));
    }).catch(() => {}).finally(() => {});
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || [record.code, record.name, record.stationName, record.machineName, record.uom].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesSearch && (station === "all" || record.stationCode === station) && (frequency === "all" || record.frequency === frequency) && (status === "all" || (status === "active" ? record.active : !record.active));
    });
  }, [records, search, station, frequency, status]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, `${search}|${station}|${frequency}|${status}`);

  const openCreate = () => { setForm(emptyForm()); setErrors({}); setDrawer("create"); };
  const openEdit = (record) => { setForm(normalizeMachineHealthParameter(record)); setErrors({}); setDrawer("edit"); };
  const closeDrawer = () => { setDrawer(null); setErrors({}); };
  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "frequency" && !requiresInterval(value)) next.intervalMinutes = "";
      if (key === "stationCode") {
        const selected = stations.find((item) => item.code === value);
        next.stationName = selected?.name || "";
        if (next.machineCode && machines.some((item) => item.code === next.machineCode && item.stationCode && item.stationCode !== value)) { next.machineCode = ""; next.machineName = ""; }
      }
      if (key === "machineCode") next.machineName = machines.find((item) => item.code === value)?.name || "";
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined, station: undefined, form: undefined }));
  };
  const save = (event) => {
    event.preventDefault();
    const result = validateMachineHealthParameter(form, records, drawer === "edit" ? form.id : null);
    if (!result.valid) { setErrors(result.errors); return; }
    const next = drawer === "edit" ? records.map((record) => record.id === form.id ? { ...record, ...result.value } : record) : [{ id: `MHC-${Date.now()}`, ...result.value }, ...records];
    setRecords(next); persist(next); closeDrawer();
  };

  return <main className="machine-health-master-page">
    <div className="machine-health-breadcrumb" aria-label="Breadcrumb"><button type="button" onClick={() => onNavigate?.("masters")}>Masters</button><BreadcrumbSeparator /><strong>Machine Health Monitoring</strong></div>
    <PageHeader eyebrow="MASTERS / PRODUCTION" title="Machine Health Monitoring" description="Configure periodic machine-health metrics, recording cadence, units, and operating limits by station." actions={<Button onClick={openCreate}><Plus size={16} aria-hidden="true" /> Add Monitoring Metric</Button>} />
    <div className="machine-health-summary-grid"><Card><span>Total metrics</span><strong>{records.length}</strong><small>Configured monitoring definitions</small></Card><Card><span>Active metrics</span><strong>{records.filter((item) => item.active).length}</strong><small>Available for future recording</small></Card><Card><span>Stations covered</span><strong>{new Set(records.map((item) => item.stationCode)).size}</strong><small>Station-scoped configuration</small></Card><Card><span>Periodic metrics</span><strong>{records.filter((item) => item.frequency === "PERIODIC").length}</strong><small>Scheduled interval definitions</small></Card></div>
    <Card className="machine-health-list-card">
      <div className="machine-health-list-heading"><div><h2>Machine health metric register</h2><p>Configuration only. Actual readings remain a separate operational record.</p></div><span>{filtered.length} {filtered.length === 1 ? "metric" : "metrics"}</span></div>
      <div className="machine-health-toolbar"><label className="machine-health-search"><span className="sr-only">Search monitoring metrics</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, metric, station, or unit..." /></label><label><span className="sr-only">Filter station</span><select value={station} onChange={(event) => setStation(event.target.value)}><option value="all">All stations</option>{stations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label><span className="sr-only">Filter frequency</span><select value={frequency} onChange={(event) => setFrequency(event.target.value)}><option value="all">All frequencies</option>{MACHINE_HEALTH_FREQUENCIES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label><span className="sr-only">Filter status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
      <div className="machine-health-table-wrap"><table className="machine-health-table"><thead><tr><th>Code</th><th>Metric</th><th>Station</th><th>Machine</th><th>Frequency</th><th>Interval</th><th>Type</th><th>UOM</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleItems.map((record) => <tr key={record.id}><td><button type="button" className="machine-health-code" onClick={() => setDrawer({ mode: "detail", record })}>{record.code}</button></td><td><strong>{record.name}</strong></td><td>{record.stationName}</td><td>{record.machineName || "All machines"}</td><td>{record.frequency.replaceAll("_", " ")}</td><td>{requiresInterval(record.frequency) && record.intervalMinutes ? `${record.intervalMinutes} min` : "Not applicable"}</td><td>{record.dataType}</td><td>{record.uom || "—"}</td><td><StatusBadge status={record.active ? "ACTIVE" : "INACTIVE"} /></td><td><div className="machine-health-row-actions"><Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "detail", record })}><Eye size={15} aria-hidden="true" /> View</Button><Button variant="secondary" size="sm" onClick={() => openEdit(record)}><Pencil size={14} aria-hidden="true" /> Edit</Button></div></td></tr>)}</tbody></table>{!filtered.length ? <EmptyState title="No machine-health metrics found" description="Adjust the filters or add a monitoring metric above." /> : null}</div>{pagination}
    </Card>
    {drawer ? <MonitoringDrawer drawer={drawer} form={form} errors={errors} stations={stations} machines={machines} onClose={closeDrawer} onEdit={openEdit} onSave={save} onChange={update} /> : null}
  </main>;
}

function MonitoringDrawer({ drawer, form, errors, stations, machines, onClose, onEdit, onSave, onChange }) {
  const isDetail = drawer.mode === "detail";
  const record = isDetail ? drawer.record : form;
  const stationMachines = machines.filter((item) => !form.stationCode || !item.stationCode || item.stationCode === form.stationCode);
  const showInterval = requiresInterval(form.frequency);
  return <div className="drawer-backdrop machine-health-drawer-backdrop" onClick={onClose}><aside className="drawer machine-health-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="machine-health-drawer-title"><div className="drawer-head machine-health-drawer-head"><div><div className="eyebrow">MASTERS / PRODUCTION</div><h2 id="machine-health-drawer-title">{isDetail ? record.name : drawer === "edit" ? "Edit Monitoring Metric" : "Add Monitoring Metric"}</h2><p>{isDetail ? `${record.code} · ${record.stationName}` : "Define one reusable machine-health monitoring rule."}</p></div><DrawerCloseButton onClick={onClose} /></div>{isDetail ? <><StatusBadge status={record.active ? "ACTIVE" : "INACTIVE"} className="machine-health-detail-status" /><div className="machine-health-detail-list"><Detail label="Code" value={record.code} /><Detail label="Station" value={record.stationName} /><Detail label="Machine" value={record.machineName || "All machines"} /><Detail label="Frequency" value={record.frequency.replaceAll("_", " ")} /><Detail label="Interval" value={requiresInterval(record.frequency) && record.intervalMinutes ? `${record.intervalMinutes} minutes` : "Not applicable"} /><Detail label="Data type" value={record.dataType} /><Detail label="Unit of measure" value={record.uom || "Not specified"} /><Detail label="Warning range" value={range(record.warningMin, record.warningMax)} /><Detail label="Critical range" value={range(record.criticalMin, record.criticalMax)} /><Detail label="Required" value={record.required ? "Yes" : "No"} /><Detail label="Notes" value={record.notes || "Not specified"} /></div><div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit(record)}><Pencil size={15} aria-hidden="true" /> Edit Metric</Button></div></> : <form className="machine-health-form" onSubmit={onSave} noValidate>{errors.form || errors.warningLimits || errors.criticalLimits ? <div className="machine-health-form-error" role="alert">{errors.form || errors.warningLimits || errors.criticalLimits}</div> : null}<div className="machine-health-form-grid"><FormField label="Monitoring code" required error={errors.code}><input value={form.code} onChange={(event) => onChange("code", event.target.value)} placeholder="e.g. THR-DRUM-RPM" /></FormField><FormField label="Metric name" required error={errors.name}><input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="e.g. Drum Rotation Speed" /></FormField><FormField label="Station" required error={errors.station}><select value={form.stationCode} onChange={(event) => onChange("stationCode", event.target.value)}><option value="">Select station...</option>{stations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></FormField><FormField label="Machine" hint="Leave blank to apply to all machines in the station."><select value={form.machineCode} onChange={(event) => onChange("machineCode", event.target.value)}><option value="">All machines</option>{stationMachines.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}</select></FormField><FormField label="Frequency" required error={errors.frequency}><select value={form.frequency} onChange={(event) => onChange("frequency", event.target.value)}>{MACHINE_HEALTH_FREQUENCIES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></FormField>{showInterval ? <FormField label="Interval in minutes" required error={errors.intervalMinutes}><input type="number" min="1" step="1" value={form.intervalMinutes} onChange={(event) => onChange("intervalMinutes", event.target.value)} /></FormField> : null}<FormField label="Data type" required error={errors.dataType}><select value={form.dataType} onChange={(event) => onChange("dataType", event.target.value)}>{MACHINE_HEALTH_DATA_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></FormField><FormField label="Unit of measure"><input value={form.uom} onChange={(event) => onChange("uom", event.target.value)} placeholder="e.g. RPM, °C, MT" /></FormField></div><div className="machine-health-range"><strong>Operating limits</strong><div className="machine-health-range-grid"><FormField label="Warning minimum" error={errors.warningMin}><input type="number" value={form.warningMin} onChange={(event) => onChange("warningMin", event.target.value)} /></FormField><FormField label="Warning maximum" error={errors.warningMax}><input type="number" value={form.warningMax} onChange={(event) => onChange("warningMax", event.target.value)} /></FormField><FormField label="Critical minimum" error={errors.criticalMin}><input type="number" value={form.criticalMin} onChange={(event) => onChange("criticalMin", event.target.value)} /></FormField><FormField label="Critical maximum" error={errors.criticalMax}><input type="number" value={form.criticalMax} onChange={(event) => onChange("criticalMax", event.target.value)} /></FormField></div></div><FormField label="Notes"><textarea rows="3" value={form.notes} onChange={(event) => onChange("notes", event.target.value)} placeholder="Describe the monitoring intent or source." /></FormField><div className="machine-health-checks"><label className="machine-health-check"><input type="checkbox" checked={form.required} onChange={(event) => onChange("required", event.target.checked)} /><span>Required during monitoring</span></label><label className="machine-health-check"><input type="checkbox" checked={form.active} onChange={(event) => onChange("active", event.target.checked)} /><span>Active configuration</span></label></div><div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{drawer === "edit" ? "Update Metric" : "Save Metric"}</Button></div></form>}</aside></div>;
}

function range(min, max) { return min === "" && max === "" ? "Not specified" : `${min === "" ? "—" : min} to ${max === "" ? "—" : max}`; }
function requiresInterval(frequency) { return frequency === "PERIODIC" || frequency === "HOURLY"; }
function Detail({ label, value }) { return <div className="machine-health-detail-row"><span>{label}</span><strong>{value}</strong></div>; }
