import React, { useEffect, useMemo, useState } from "react";
import { getMasterDefinition, masterDefinitions } from "../config/masterData.js";
import "./masters.css";

const excludedKeys = new Set(["customers", "suppliers", "materials", "productionLines", "vehicleTypes", "vehicles"]);
const masterKeys = masterDefinitions.filter((definition) => !excludedKeys.has(definition.key));

function loadRecords(definition) {
  try {
    const stored = localStorage.getItem(`rockeye.master.${definition.key}`);
    return stored ? JSON.parse(stored) : definition.seed.map((record) => ({ ...record }));
  } catch {
    return definition.seed.map((record) => ({ ...record }));
  }
}

export function MasterDataCenter({ masterKey, onNavigate }) {
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

  return <main className="masters-page"><div className="masters-breadcrumb"><span>Masters</span><b>›</b><strong>{definition.title}</strong></div><div className="masters-heading"><div><h1>{definition.title}</h1><p>{definition.description}</p></div><button className="btn btn-primary" onClick={openNew}>＋ Add {definition.title.replace(/s$/, "")}</button></div><section className="panel masters-panel"><div className="masters-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${definition.title.toLowerCase()}…`} /><span>{filtered.length} records</span></div><div className="table-wrap"><table><thead><tr>{definition.columns.map((column) => <th key={column}>{definition.fields.find((field) => field.key === column)?.label || column}</th>)}<th>Action</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}>{definition.columns.map((column) => <td key={column}>{typeof record[column] === "boolean" ? (record[column] ? "Active" : "Inactive") : String(record[column] ?? "—")}</td>)}<td><button className="master-edit" onClick={() => openEdit(record)}>Edit</button></td></tr>)}{!filtered.length && <tr><td className="master-empty" colSpan={definition.columns.length + 1}>No records found.</td></tr>}</tbody></table></div></section>{showForm && <div className="master-modal-backdrop"><form className="master-form" onSubmit={save}><div className="master-form-head"><div><span>MASTERS / {definition.category.toUpperCase()}</span><h2>{editing ? `Edit ${definition.title}` : `Add ${definition.title}`}</h2></div><button type="button" onClick={() => setShowForm(false)}>×</button></div>{error && <div className="master-error">{error}</div>}<div className="master-form-grid">{definition.fields.map((field) => <MasterField key={field.key} field={field} value={editing?.[field.key]} />)}</div><div className="master-form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary">{editing ? "Update Master" : "Save Master"}</button></div></form></div>}</main>;
}

function MasterCategory({ title, definitions, onNavigate }) {
  if (!definitions.length) return null;
  return <section className="master-category"><h2>{title}</h2>{definitions.map((definition) => <button key={definition.key} onClick={() => onNavigate(`master:${definition.key}`)}><strong>{definition.title}</strong><span>{definition.description}</span></button>)}</section>;
}

function MasterField({ field, value }) {
  if (field.type === "checkbox") return <label className="master-checkbox"><input name={field.key} type="checkbox" defaultChecked={value ?? field.key === "active"} /><span>{field.label}</span></label>;
  return <label>{field.label}{field.required && <em>*</em>}{field.type === "select" ? <select name={field.key} defaultValue={value ?? ""} required={field.required}><option value="">Select…</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea name={field.key} rows="3" defaultValue={value ?? ""} required={field.required} /> : <input name={field.key} type={field.type || "text"} defaultValue={value ?? ""} required={field.required} />}</label>;
}
