import React, { useMemo, useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { getMasterDefinition } from "../config/masterData.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { BreadcrumbSeparator, Button, Card, DrawerCloseButton, EmptyState, FormField, PageHeader } from "../design-system/index.js";
import { StatusBadge } from "../design-system/badges.jsx";
import { normalizeQualityParameter, QUALITY_PARAMETER_DATA_TYPES, QUALITY_PARAMETER_MATERIALS, QUALITY_PARAMETER_TYPES, validateQualityParameter } from "../../packages/masters/qualityParameterDomain.js";
import "./quality-parameter-master.css";

const STORAGE_KEY = "rockeye.master.qualityParameters";
const UOM_STORAGE_KEY = "rockeye.master.uoms";
const CONFIGURABLE_DATA_TYPES = QUALITY_PARAMETER_DATA_TYPES.filter((type) => !["TEXT", "SELECTION"].includes(type));
const definition = getMasterDefinition("qualityParameters");
const uomDefinition = getMasterDefinition("uoms");

function loadParameters() {
  const seeded = definition.seed.map((record) => ({ ...record }));
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seeded;
    const records = JSON.parse(stored);
    const existing = Array.isArray(records) ? records : [];
    return [...existing.map((record) => normalizeQualityParameter(record)), ...seeded.filter((seed) => !existing.some((record) => record.id === seed.id))];
  } catch {
    return seeded;
  }
}

function loadUoms() {
  const seeded = uomDefinition.seed.map((record) => ({ ...record }));
  try {
    const stored = localStorage.getItem(UOM_STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : [];
    const existing = Array.isArray(records) ? records : [];
    return [...existing, ...seeded.filter((seed) => !existing.some((record) => record.id === seed.id))].filter((record) => record.active !== false);
  } catch {
    return seeded;
  }
}

function persistParameters(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const emptyForm = () => ({ code: "", name: "", dataType: "DECIMAL", uom: "", precision: "", material: "BOTH", parameterTypes: [], description: "", active: true });

export function QualityParameterMaster({ onNavigate }) {
  const [records, setRecords] = useState(loadParameters);
  const [search, setSearch] = useState("");
  const [dataType, setDataType] = useState("all");
  const [material, setMaterial] = useState("all");
  const [status, setStatus] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const uoms = useMemo(loadUoms, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || [record.code, record.name, record.dataType, record.uom, record.description].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesType = dataType === "all" || record.dataType === dataType;
      const matchesMaterial = material === "all" || record.material === material || record.material === "BOTH";
      const matchesStatus = status === "all" || (status === "active" ? record.active : !record.active);
      return matchesSearch && matchesType && matchesMaterial && matchesStatus;
    });
  }, [records, search, dataType, material, status]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, `${search}|${dataType}|${material}|${status}`);

  const openCreate = () => { setForm(emptyForm()); setErrors({}); setDrawer("create"); };
  const openEdit = (record) => { setForm(normalizeQualityParameter(record)); setErrors({}); setDrawer("edit"); };
  const closeDrawer = () => { setDrawer(null); setErrors({}); };
  const updateForm = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined, form: undefined })); };
  const save = (event) => {
    event.preventDefault();
    const result = validateQualityParameter(form, records, drawer === "edit" ? form.id : null);
    if (!result.valid) { setErrors(result.errors); return; }
    const next = drawer === "edit" ? records.map((record) => record.id === form.id ? { ...record, ...result.value } : record) : [{ id: `QPAR-${Date.now()}`, ...result.value }, ...records];
    setRecords(next);
    persistParameters(next);
    closeDrawer();
  };

  const activeCount = records.filter((record) => record.active).length;
  const configuredTypes = new Set(records.map((record) => record.dataType)).size;

  return <main className="quality-parameter-master-page">
    <div className="quality-parameter-breadcrumb" aria-label="Breadcrumb"><button type="button" onClick={() => onNavigate?.("masters")}>Masters</button><BreadcrumbSeparator /><strong>Quality Parameter Master</strong></div>
    <PageHeader eyebrow="MASTERS / QUALITY" title="Quality Parameter Master" description="Define reusable measurements, data types, units, and precision rules for quality capture." actions={<Button onClick={openCreate}><Plus size={16} aria-hidden="true" /> Add Parameter</Button>} className="quality-parameter-page-header" />
    <div className="quality-parameter-summary-grid" aria-label="Quality parameter summary"><Card><span>Total parameters</span><strong>{records.length}</strong><small>Configured measurement definitions</small></Card><Card><span>Active parameters</span><strong>{activeCount}</strong><small>Available for checkpoints</small></Card><Card><span>Data types</span><strong>{configuredTypes}</strong><small>Supported recording formats</small></Card></div>
    <Card className="quality-parameter-list-card">
      <div className="quality-parameter-list-heading"><div><h2>Quality parameter register</h2><p>Use these definitions when configuring production quality checkpoints.</p></div><span>{filtered.length} {filtered.length === 1 ? "parameter" : "parameters"}</span></div>
      <div className="quality-parameter-toolbar"><label className="quality-parameter-search"><span className="quality-parameter-sr-only">Search quality parameters</span><input name="quality-parameter-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code, name, or unit…" autoComplete="off" /></label><label className="quality-parameter-filter"><span className="quality-parameter-sr-only">Filter by material</span><select name="quality-parameter-material" value={material} onChange={(event) => setMaterial(event.target.value)}><option value="all">All materials</option>{QUALITY_PARAMETER_MATERIALS.map((item) => <option key={item} value={item}>{item === "BOTH" ? "CPO & PK" : item}</option>)}</select></label><label className="quality-parameter-filter"><span className="quality-parameter-sr-only">Filter by data type</span><select name="quality-parameter-data-type" value={dataType} onChange={(event) => setDataType(event.target.value)}><option value="all">All data types</option>{QUALITY_PARAMETER_DATA_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="quality-parameter-filter"><span className="quality-parameter-sr-only">Filter by status</span><select name="quality-parameter-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
      <div className="quality-parameter-table-wrap"><table className="quality-parameter-table"><thead><tr><th scope="col">Code</th><th scope="col">Parameter name</th><th scope="col">Parameter type</th><th scope="col">Material</th><th scope="col">Data type</th><th scope="col">UOM</th><th scope="col">Precision</th><th scope="col">Status</th><th scope="col"><span className="quality-parameter-sr-only">Actions</span></th></tr></thead><tbody>{visibleItems.map((record) => <tr key={record.id}><td><button type="button" className="quality-parameter-code" onClick={() => setDrawer({ mode: "detail", record })}>{record.code}</button></td><td><strong>{record.name}</strong></td><td>{record.parameterTypes?.length ? record.parameterTypes.map((type) => type[0] + type.slice(1).toLowerCase()).join(", ") : "—"}</td><td>{record.material === "BOTH" ? "CPO & PK" : record.material}</td><td>{record.dataType}</td><td>{record.uom || "—"}</td><td className="quality-parameter-number">{record.precision === "" || record.precision == null ? "—" : record.precision}</td><td><StatusBadge status={record.active ? "ACTIVE" : "INACTIVE"} /></td><td><div className="quality-parameter-row-actions"><Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "detail", record })}><Eye size={15} aria-hidden="true" /> View</Button><Button variant="secondary" size="sm" onClick={() => openEdit(record)}><Pencil size={14} aria-hidden="true" /> Edit</Button></div></td></tr>)}</tbody></table>{!filtered.length ? <EmptyState title="No quality parameters found" description="Adjust the filters or use Add Parameter above." /> : null}</div>
      {pagination}
    </Card>
    {drawer ? <ParameterDrawer drawer={drawer} form={form} errors={errors} uoms={uoms} onClose={closeDrawer} onEdit={openEdit} onSave={save} onChange={updateForm} /> : null}
  </main>;
}

function ParameterDrawer({ drawer, form, errors, uoms, onClose, onEdit, onSave, onChange }) {
  const isDetail = drawer.mode === "detail";
  const record = isDetail ? drawer.record : form;
  return <div className="drawer-backdrop quality-parameter-drawer-backdrop" onClick={onClose}><aside className="drawer quality-parameter-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="quality-parameter-drawer-title"><div className="drawer-head quality-parameter-drawer-head"><div><div className="eyebrow">MASTERS / QUALITY</div><h2 id="quality-parameter-drawer-title">{isDetail ? record.name : drawer === "edit" ? "Edit Quality Parameter" : "Add Quality Parameter"}</h2><p>{isDetail ? `${record.code} · ${record.dataType}` : "Define a reusable measurement rule."}</p></div><DrawerCloseButton onClick={onClose} /></div>{isDetail ? <><StatusBadge status={record.active ? "ACTIVE" : "INACTIVE"} className="quality-parameter-detail-status" /><div className="quality-parameter-detail-list"><Detail label="Code" value={record.code} /><Detail label="Parameter type" value={record.parameterTypes?.length ? record.parameterTypes.join(", ") : "Not specified"} /><Detail label="Material" value={record.material === "BOTH" ? "CPO & PK" : record.material} /><Detail label="Data type" value={record.dataType} /><Detail label="Unit of measure" value={record.uom || "Not specified"} /><Detail label="Decimal precision" value={record.precision === "" || record.precision == null ? "Not specified" : `${record.precision} place${record.precision === 1 ? "" : "s"}`} /><Detail label="Description" value={record.description || "Not specified"} /></div><div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit(record)}><Pencil size={15} aria-hidden="true" /> Edit Parameter</Button></div></> : <form className="quality-parameter-form" onSubmit={onSave} noValidate>{errors.form ? <div className="quality-parameter-form-error" role="alert">{errors.form}</div> : null}<FormField label="Code" required error={errors.code}><input name="code" value={form.code} onChange={(event) => onChange("code", event.target.value)} autoComplete="off" spellCheck={false} placeholder="e.g. FFA" /></FormField><FormField label="Parameter name" required error={errors.name}><input name="name" value={form.name} onChange={(event) => onChange("name", event.target.value)} autoComplete="off" placeholder="e.g. Free Fatty Acid" /></FormField><FormField label="Parameter Type" hint="Hold Ctrl or Command to select multiple types." error={errors.parameterTypes}><select className="quality-parameter-multi-select" name="parameterTypes" multiple value={form.parameterTypes || []} onChange={(event) => onChange("parameterTypes", Array.from(event.target.selectedOptions, (option) => option.value))}>{QUALITY_PARAMETER_TYPES.map((item) => <option key={item} value={item}>{item[0] + item.slice(1).toLowerCase()}</option>)}</select></FormField><FormField label="Material applicability" required error={errors.material}><select name="material" value={form.material} onChange={(event) => onChange("material", event.target.value)}>{QUALITY_PARAMETER_MATERIALS.map((item) => <option key={item} value={item}>{item === "BOTH" ? "CPO & PK" : item}</option>)}</select></FormField><FormField label="Data type" required error={errors.dataType}><select name="dataType" value={form.dataType} onChange={(event) => onChange("dataType", event.target.value)}>{CONFIGURABLE_DATA_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></FormField><FormField label="Unit of measure" hint="Select an active unit from the Units of Measure master."><select name="uom" value={form.uom} onChange={(event) => onChange("uom", event.target.value)}><option value="">Not specified</option>{uoms.map((item) => <option key={item.id} value={item.symbol}>{item.code} · {item.name} ({item.symbol})</option>)}</select></FormField><FormField label="Decimal precision" hint="Use only when the data type is numeric." error={errors.precision}><input name="precision" type="number" min="0" max="12" step="1" inputMode="numeric" value={form.precision} onChange={(event) => onChange("precision", event.target.value)} /></FormField><FormField label="Description"><textarea name="description" rows="3" value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Describe what this parameter measures…" /></FormField><label className="quality-parameter-active-field"><input name="active" type="checkbox" checked={form.active} onChange={(event) => onChange("active", event.target.checked)} /><span>Available for checkpoints</span></label><div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{drawer === "edit" ? "Update Parameter" : "Save Parameter"}</Button></div></form>}</aside></div>;
}

function Detail({ label, value }) { return <div className="quality-parameter-detail-row"><span>{label}</span><strong>{value}</strong></div>; }
