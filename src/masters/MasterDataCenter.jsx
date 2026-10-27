import React, { useEffect, useMemo, useState } from "react";
import { getMasterDefinition, masterDefinitions } from "../config/masterData.js";
import "./masters.css";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { UnitsOfMeasureMaster } from "./UnitsOfMeasureMaster.jsx";
import { QualityParameterMaster } from "./QualityParameterMaster.jsx";
import { MachineHealthMonitoringMaster } from "./MachineHealthMonitoringMaster.jsx";
import { contextHeaders } from "../services/requestContext.js";

const excludedKeys = new Set(["customers", "suppliers", "materials", "productionLines", "vehicleTypes", "vehicles"]);
const masterKeys = masterDefinitions.filter((definition) => !excludedKeys.has(definition.key));

function loadRecords(definition) {
  try {
    const stored = localStorage.getItem(`rockeye.master.${definition.key}`);
    const seeded = definition.seed.map((record) => ({ ...record }));
    if (!stored) return seeded;
    const records = JSON.parse(stored);
    const existing = Array.isArray(records) ? records : [];
    return [
      ...existing,
      ...seeded.filter((seed) => !existing.some((record) => record.id === seed.id)),
    ];
  } catch {
    return definition.seed.map((record) => ({ ...record }));
  }
}

export function MasterDataCenter({ masterKey, onNavigate }) {
  if (masterKey === "mills") return <MillMasterV2 />;
  if (masterKey === "routingStages") return <RoutingStageMaster />;
  if (masterKey === "shifts") return <ShiftMaster />;
  if (masterKey === "uoms") return <UnitsOfMeasureMaster onNavigate={onNavigate} />;
  if (masterKey === "qualityParameters") return <QualityParameterMaster onNavigate={onNavigate} />;
  if (masterKey === "machineHealthParameters") return <MachineHealthMonitoringMaster onNavigate={onNavigate} />;
  return <GenericMasterDataCenter masterKey={masterKey} onNavigate={onNavigate} />;
}

function MillMaster() {
  const [records, setRecords] = useState([]); const [showForm, setShowForm] = useState(false); const [error, setError] = useState("");
  const load = async () => { const response = await fetch("/api/production-mills", { headers: contextHeaders() }); setRecords(await response.json()); };
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  const save = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch("/api/production-mills", { method: "POST", headers: contextHeaders({}), body: JSON.stringify({ code: form.get("code"), name: form.get("name"), timezone: form.get("timezone") }) }); const payload = await response.json(); if (!response.ok) { setError(payload.message || "Unable to save Mill Master record."); return; } setShowForm(false); setError(""); load(); };
  return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>Mill Master</strong></div><div className="masters-heading"><div><h1>Mill Master</h1><p>Maintain authorized mills and facilities used by Production Order planning.</p></div><button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Add Mill</button></div>{error && <div className="master-error">{error}</div>}<section className="panel masters-panel"><div className="table-wrap"><table><thead><tr><th>Code</th><th>Mill Name</th><th>Time Zone</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.code}</td><td>{record.name}</td><td>{record.timezone}</td><td>{record.status}</td></tr>)}{!records.length && <tr><td className="master-empty" colSpan="4">No mills configured.</td></tr>}</tbody></table></div></section>{showForm && <div className="master-modal-backdrop"><form className="master-form" onSubmit={save}><div className="master-form-head"><div><span>MASTERS / PRODUCTION</span><h2>Add Mill</h2></div><button type="button" onClick={() => setShowForm(false)}>×</button></div><div className="master-form-grid"><label>Mill Code<em>*</em><input name="code" required placeholder="MAIN-MILL" /></label><label>Mill Name<em>*</em><input name="name" required placeholder="Main Mill" /></label><label>Time Zone<em>*</em><input name="timezone" defaultValue="Asia/Kuala_Lumpur" required /></label></div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary">Save Mill</button></div></form></div>}</main>;
}

function MillMasterV2() {
  const [records, setRecords] = useState([]); const [showForm, setShowForm] = useState(false); const [selected, setSelected] = useState(null); const [error, setError] = useState("");
  const load = async () => { const response = await fetch("/api/production-mills", { headers: contextHeaders() }); if (!response.ok) throw new Error("Unable to load Mill Master records."); setRecords(await response.json()); };
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  const save = async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget).entries()); const response = await fetch("/api/production-mills", { method: "POST", headers: contextHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) { setError(payload.message || "Unable to save Mill Master record."); return; } setShowForm(false); setError(""); await load(); };
  return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>Mill Master</strong></div><div className="masters-heading"><div><h1>Mill Master</h1><p>Maintain authorized mills and facilities used by Production Order planning.</p></div><button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Add Mill</button></div>{error && <div className="master-error">{error}</div>}<section className="panel masters-panel"><div className="table-wrap"><table><thead><tr><th>Mill Code</th><th>Mill Name</th><th>Legal Company</th><th>City</th><th>Capacity</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} onClick={() => setSelected(record)}><td>{record.code}</td><td>{record.name}</td><td>{record.legal_company || "—"}</td><td>{record.city || "—"}</td><td>{record.capacity == null ? "—" : `${record.capacity} ${record.capacity_uom}`}</td><td>{record.status}</td></tr>)}{!records.length && <tr><td className="master-empty" colSpan="6">No mills configured.</td></tr>}</tbody></table></div></section>{selected && <div className="master-modal-backdrop"><aside className="master-form"><div className="master-form-head"><div><span>MASTERS / PRODUCTION</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)}>×</button></div><div className="master-form-grid"><p><strong>Mill Code</strong><br />{selected.code}</p><p><strong>Legal Company / Operating Company</strong><br />{selected.legal_company || "—"}</p><p><strong>Address</strong><br />{selected.address || "—"}</p><p><strong>Country / State / City</strong><br />{[selected.country, selected.state, selected.city].filter(Boolean).join(" / ") || "—"}</p><p><strong>Capacity</strong><br />{selected.capacity == null ? "—" : `${selected.capacity} ${selected.capacity_uom}`}</p><p><strong>Status</strong><br />{selected.status}</p><p className="wide"><strong>Remarks</strong><br />{selected.remarks || "—"}</p></div><h3>Audit Information</h3><div className="master-audit-list">{(selected.audit || []).map((event) => <div key={event.id}><strong>{event.action}</strong><span>{event.created_at} · {event.actor_id}</span></div>)}{!selected.audit?.length && <p>No audit events recorded.</p>}</div></aside></div>}{showForm && <div className="master-modal-backdrop"><form className="master-form" onSubmit={save}><div className="master-form-head"><div><span>MASTERS / PRODUCTION</span><h2>Add Mill</h2></div><button type="button" onClick={() => setShowForm(false)}>×</button></div><div className="master-form-grid"><label>Mill Name<em>*</em><input name="name" required placeholder="Main Mill" /></label><label>Mill Code<em>*</em><input name="code" required placeholder="MAIN-MILL" /></label><label>Legal Company / Operating Company<em>*</em><input name="legalCompany" required /></label><label>Address<em>*</em><input name="address" required /></label><label>Country<em>*</em><input name="country" required /></label><label>State<em>*</em><input name="state" required /></label><label>City<em>*</em><input name="city" required /></label><label className="wide">Remarks<textarea name="remarks" rows="3" /></label><label>Mill Status<em>*</em><select name="status" defaultValue="ACTIVE"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary">Save Mill</button></div></form></div>}</main>;
}

function RoutingStageMaster() {
  const definition = getMasterDefinition("routingStages");
  const [records, setRecords] = useState(() => loadRecords(definition));
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { setRecords(loadRecords(definition)); setDrawer(null); setError(""); }, [definition]);
  const filtered = useMemo(() => records.filter((record) => [record.code, record.name, record.description, record.status].some((value) => String(value ?? "").toLowerCase().includes(search.toLowerCase()))), [records, search]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, search);
  const closeDrawer = () => { setDrawer(null); setError(""); };
  const save = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") || "").trim();
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    const status = String(form.get("status") || "");
    const file = form.get("attachment");
    if (!code || !name || !status) { setError("Stage code, stage name, and status are required."); return; }
    if (records.some((record) => record.id !== drawer?.record?.id && String(record.code).toLowerCase() === code.toLowerCase())) { setError("Stage code must be unique."); return; }
    const attachment = file?.name ? { name: file.name, size: file.size, type: file.type } : drawer?.record?.attachment || null;
    const next = { code, name, description, attachment, status, active: status === "ACTIVE" };
    const updated = drawer.mode === "edit" ? records.map((record) => record.id === drawer.record.id ? { ...record, ...next } : record) : [{ id: `ROUTE-STAGE-${Date.now()}`, ...next }, ...records];
    setRecords(updated); localStorage.setItem("rockeye.master.routingStages", JSON.stringify(updated)); closeDrawer();
  };
  return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>Routing Stages</strong></div><div className="masters-heading"><div><h1>Routing Stages</h1><p>Define the controlled production stages used in routing versions.</p></div><button className="btn btn-primary" onClick={() => { setError(""); setDrawer({ mode: "create", record: null }); }}>＋ Add Routing Stage</button></div><section className="panel masters-panel"><div className="masters-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routing stages…" /></div><div className="table-wrap"><table><thead><tr><th>Stage Code</th><th>Stage Name</th><th>Description</th><th>Status</th><th>Action</th></tr></thead><tbody>{visibleItems.map((record) => <tr key={record.id}><td>{record.code}</td><td>{record.name}</td><td>{record.description || "—"}</td><td>{record.status || (record.active ? "ACTIVE" : "INACTIVE")}</td><td><button className="master-edit" onClick={() => { setError(""); setDrawer({ mode: "edit", record }); }}>Edit</button></td></tr>)}{!filtered.length && <tr><td className="master-empty" colSpan="5">No routing stages found.</td></tr>}</tbody></table></div>{pagination}</section>{drawer && <div className="master-modal-backdrop routing-stage-drawer-backdrop" onClick={closeDrawer}><aside className="master-form routing-stage-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="routing-stage-drawer-title"><div className="master-form-head"><div><span>MASTERS / PRODUCTION</span><h2 id="routing-stage-drawer-title">{drawer.mode === "edit" ? "Edit Routing Stage" : "Add Routing Stage"}</h2><p>Maintain a reusable production operation.</p></div><button type="button" onClick={closeDrawer} aria-label="Close">×</button></div>{error && <div className="master-error" role="alert">{error}</div>}<form onSubmit={save}><div className="master-form-grid"><label>Stage Code<em>*</em><input name="code" required defaultValue={drawer.record?.code || ""} autoComplete="off" /></label><label>Stage Name<em>*</em><input name="name" required defaultValue={drawer.record?.name || ""} autoComplete="off" /></label><label className="wide">Description<textarea name="description" rows="4" defaultValue={drawer.record?.description || ""} placeholder="Describe the production stage" /></label><label className="wide">Attachment<input name="attachment" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />{drawer.record?.attachment?.name && <small className="master-attachment">Current attachment: {drawer.record.attachment.name}</small>}</label><label>Status<em>*</em><select name="status" required defaultValue={drawer.record?.status || (drawer.record?.active === false ? "INACTIVE" : "ACTIVE")}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={closeDrawer}>Cancel</button><button className="btn btn-primary">{drawer.mode === "edit" ? "Update Stage" : "Save Stage"}</button></div></form></aside></div>}</main>;
}

function ShiftMaster() {
  const [records, setRecords] = useState([]); const [search, setSearch] = useState(""); const [drawer, setDrawer] = useState(null); const [error, setError] = useState("");
  const load = async () => { const shiftResponse = await fetch("/api/production/shifts", { headers: contextHeaders() }); const responseText = await shiftResponse.text(); let payload = null; try { payload = responseText ? JSON.parse(responseText) : null; } catch { payload = null; } if (!shiftResponse.ok) throw new Error(payload?.message || `Shift Master request failed (${shiftResponse.status}).`); if (!Array.isArray(payload)) throw new Error("Shift Master returned an invalid response."); setRecords(payload); };
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  const filtered = useMemo(() => records.filter((record) => [record.mill_name, record.code, record.name, record.status].some((value) => String(value ?? "").toLowerCase().includes(search.toLowerCase()))), [records, search]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, search);
  const closeDrawer = () => { setDrawer(null); setError(""); };
  const save = async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget).entries()); const method = drawer.mode === "edit" ? "PATCH" : "POST"; const url = drawer.mode === "edit" ? `/api/production/shifts/${drawer.record.id}` : "/api/production/shifts"; const response = await fetch(url, { method, headers: contextHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) { setError(payload.message || "Unable to save shift."); return; } closeDrawer(); await load(); };
  return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>Shift Master</strong></div><div className="masters-heading"><div><h1>Shift Master</h1><p>Maintain mill/facility operating shifts used by production planning.</p></div><button className="btn btn-primary" onClick={() => { setError(""); setDrawer({ mode: "create", record: null }); }}>＋ Add Shift</button></div>{error && !drawer && <div className="master-error">{error}</div>}<section className="panel masters-panel"><div className="masters-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shifts…" /></div><div className="table-wrap"><table><thead><tr><th>Mill / Facility</th><th>Shift Code</th><th>Shift Name</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>{visibleItems.map((record) => <tr key={record.id}><td>{record.mill_name || "—"}</td><td>{record.code}</td><td>{record.name}</td><td>{record.start_time} – {record.end_time}</td><td>{record.status}</td><td><button className="master-edit" onClick={() => { setError(""); setDrawer({ mode: "edit", record }); }}>Edit</button></td></tr>)}{!filtered.length && <tr><td className="master-empty" colSpan="6">No shifts found.</td></tr>}</tbody></table></div>{pagination}</section>{drawer && <div className="master-modal-backdrop routing-stage-drawer-backdrop" onClick={closeDrawer}><aside className="master-form routing-stage-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="shift-drawer-title"><div className="master-form-head"><div><span>MASTERS / PRODUCTION</span><h2 id="shift-drawer-title">{drawer.mode === "edit" ? "Edit Shift" : "Add Shift"}</h2><p>Configure a mill/facility operating window.</p></div><button type="button" onClick={closeDrawer} aria-label="Close">×</button></div>{error && <div className="master-error" role="alert">{error}</div>}<form onSubmit={save}><div className="master-form-grid"><label>Mill / Facility<em>*</em><input name="millName" required defaultValue={drawer.record?.mill_name || ""} placeholder="Enter mill or facility name" /></label><label>Shift Code<em>*</em><input name="code" required defaultValue={drawer.record?.code || ""} autoComplete="off" /></label><label>Shift Name<em>*</em><input name="name" required defaultValue={drawer.record?.name || ""} /></label><label>Start Time<em>*</em><input name="startTime" type="time" required defaultValue={drawer.record?.start_time || ""} /></label><label>End Time<em>*</em><input name="endTime" type="time" required defaultValue={drawer.record?.end_time || ""} /></label><label className="wide">Description / Remarks<textarea name="description" rows="4" defaultValue={drawer.record?.description || ""} /></label><label>Status<em>*</em><select name="status" required defaultValue={drawer.record?.status || "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={closeDrawer}>Cancel</button><button className="btn btn-primary">{drawer.mode === "edit" ? "Update Shift" : "Save Shift"}</button></div></form></aside></div>}</main>;
}

function GenericMasterDataCenter({ masterKey, onNavigate }) {
  const definition = masterKey ? getMasterDefinition(masterKey) : null;
  const [records, setRecords] = useState(() => definition ? loadRecords(definition) : []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (definition) { setRecords(loadRecords(definition)); setShowForm(false); setEditing(null); setError(""); }
  }, [masterKey]);

  const filtered = useMemo(() => records.filter((record) => Object.values(record).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))), [records, search]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, search);
  if (!definition) return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>Master Data</strong></div><div className="masters-heading"><div><h1>Master Data</h1><p>Create and maintain controlled reference data used throughout milling operations.</p></div></div><div className="master-category-grid"><MasterCategory title="Inventory & Logistics" definitions={masterKeys.filter((item) => ["Material foundation", "Logistics", "Storage"].includes(item.category))} onNavigate={onNavigate} /><MasterCategory title="Commercial" definitions={masterKeys.filter((item) => item.category === "Commercial")} onNavigate={onNavigate} /><MasterCategory title="Production & Quality" definitions={masterKeys.filter((item) => ["Production", "Quality"].includes(item.category))} onNavigate={onNavigate} /><MasterCategory title="System" definitions={masterKeys.filter((item) => item.category === "System")} onNavigate={onNavigate} /><section className="master-category"><h2>Server-backed Operational Masters</h2><button onClick={() => onNavigate("items")}><strong>Item Master</strong><span>Materials, products, by-products and MRO items</span></button><button onClick={() => onNavigate("master:vehicleTypes")}><strong>Vehicle Type Master</strong><span>Vehicle classifications and weighbridge behavior</span></button><button onClick={() => onNavigate("master:vehicles")}><strong>Vehicle Master</strong><span>Vehicles linked to type, supplier and transporter</span></button><button onClick={() => onNavigate("masterStations")}><strong>Station Master</strong><span>Physical and functional sections of the palm oil mill</span></button><button onClick={() => onNavigate("masterMachines")}><strong>Machine Master</strong><span>Machines, station assignments and rated capacities</span></button></section></div></main>;

  const openNew = () => { setEditing(null); setError(""); setShowForm(true); };
  const openEdit = (record) => { setEditing(record); setError(""); setShowForm(true); };
  const save = (event) => {
    event.preventDefault(); const formData = new FormData(event.currentTarget); const next = {};
    definition.fields.forEach((field) => { next[field.key] = field.type === "checkbox" ? formData.get(field.key) === "on" : field.type === "number" ? Number(formData.get(field.key)) : formData.get(field.key); });
    const identityKey = definition.fields.find((field) => ["code", "registrationNo"].includes(field.key))?.key;
    if (identityKey && records.some((record) => record.id !== editing?.id && String(record[identityKey]).toLowerCase() === String(next[identityKey]).toLowerCase())) { setError(`${definition.fields.find((field) => field.key === identityKey).label} must be unique.`); return; }
    const updated = editing ? records.map((record) => record.id === editing.id ? { ...record, ...next } : record) : [{ id: `${definition.key.toUpperCase()}-${Date.now()}`, ...next }, ...records];
    setRecords(updated); localStorage.setItem(`rockeye.master.${definition.key}`, JSON.stringify(updated)); setShowForm(false); setEditing(null);
  };

  return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>{definition.title}</strong></div><div className="masters-heading"><div><h1>{definition.title}</h1><p>{definition.description}</p></div><button className="btn btn-primary" onClick={openNew}>＋ Add {definition.title.replace(/s$/, "")}</button></div><section className="panel masters-panel"><div className="masters-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${definition.title.toLowerCase()}…`} /></div><div className="table-wrap"><table><thead><tr>{definition.columns.map((column) => <th key={column}>{definition.fields.find((field) => field.key === column)?.label || column}</th>)}<th>Action</th></tr></thead><tbody>{visibleItems.map((record) => <tr key={record.id}>{definition.columns.map((column) => <td key={column}>{typeof record[column] === "boolean" ? (record[column] ? "Active" : "Inactive") : String(record[column] ?? "—")}</td>)}<td><button className="master-edit" onClick={() => openEdit(record)}>Edit</button></td></tr>)}{!filtered.length && <tr><td className="master-empty" colSpan={definition.columns.length + 1}>No records found.</td></tr>}</tbody></table></div>{pagination}</section>{showForm && <div className="master-modal-backdrop"><form className="master-form" onSubmit={save}><div className="master-form-head"><div><span>MASTERS / {definition.category.toUpperCase()}</span><h2>{editing ? `Edit ${definition.title}` : `Add ${definition.title}`}</h2></div><button type="button" onClick={() => setShowForm(false)}>×</button></div>{error && <div className="master-error">{error}</div>}<div className="master-form-grid">{definition.fields.map((field) => <MasterField key={field.key} field={field} value={editing?.[field.key]} />)}</div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary">{editing ? "Update Master" : "Save Master"}</button></div></form></div>}</main>;
}

function MasterCategory({ title, definitions, onNavigate }) {
  if (!definitions.length) return null;
  return <section className="master-category"><h2>{title}</h2>{definitions.map((definition) => <button key={definition.key} onClick={() => onNavigate(`master:${definition.key}`)}><strong>{definition.title}</strong><span>{definition.description}</span></button>)}</section>;
}

function MasterField({ field, value }) {
  if (field.type === "checkbox") return <label className="master-checkbox"><input name={field.key} type="checkbox" defaultChecked={value ?? field.key === "active"} /><span>{field.label}</span></label>;
  return <label>{field.label}{field.required && <em>*</em>}{field.type === "select" ? <select name={field.key} defaultValue={value ?? ""} required={field.required}><option value="">Select…</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea name={field.key} rows="3" defaultValue={value ?? ""} required={field.required} /> : <input name={field.key} type={field.type || "text"} defaultValue={value ?? ""} required={field.required} />}</label>;
}
