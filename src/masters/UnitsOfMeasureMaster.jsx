import React, { useMemo, useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { getMasterDefinition } from "../config/masterData.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { BreadcrumbSeparator, Button, Card, DrawerCloseButton, EmptyState, FormField, PageHeader } from "../design-system/index.js";
import { StatusBadge } from "../design-system/badges.jsx";
import { normalizeUom, UOM_CATEGORIES, validateUom } from "../../packages/masters/uomDomain.js";
import "./units-of-measure.css";

const STORAGE_KEY = "rockeye.master.uoms";
const definition = getMasterDefinition("uoms");

function loadUnits() {
  const seeded = definition.seed.map((record) => ({ ...record }));
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seeded;
    const records = JSON.parse(stored);
    const existing = Array.isArray(records) ? records : [];
    return [...existing, ...seeded.filter((seed) => !existing.some((record) => record.id === seed.id))];
  } catch {
    return seeded;
  }
}

function persistUnits(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const emptyForm = () => ({ code: "", name: "", symbol: "", category: "", precision: 0, active: true });

export function UnitsOfMeasureMaster({ onNavigate }) {
  const [records, setRecords] = useState(loadUnits);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || [record.code, record.name, record.symbol, record.category].some((value) => String(value).toLowerCase().includes(query));
      const matchesCategory = category === "all" || record.category === category;
      const matchesStatus = status === "all" || (status === "active" ? record.active : !record.active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [records, search, category, status]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, `${search}|${category}|${status}`);

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setDrawer("create");
  };

  const openEdit = (record) => {
    setForm(normalizeUom(record));
    setErrors({});
    setDrawer("edit");
  };

  const closeDrawer = () => {
    setDrawer(null);
    setErrors({});
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const save = (event) => {
    event.preventDefault();
    const result = validateUom(form, records, drawer === "edit" ? form.id : null);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    const next = drawer === "edit"
      ? records.map((record) => record.id === form.id ? { ...record, ...result.value } : record)
      : [{ id: `UOMS-${Date.now()}`, ...result.value }, ...records];
    setRecords(next);
    persistUnits(next);
    closeDrawer();
  };

  const activeCount = records.filter((record) => record.active).length;
  const categoryCount = new Set(records.map((record) => record.category)).size;

  return (
    <main className="uom-master-page">
      <div className="uom-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate?.("masters")}>Masters</button>
        <BreadcrumbSeparator />
        <strong>Units of Measure</strong>
      </div>

      <PageHeader
        eyebrow="MASTERS / MATERIAL FOUNDATION"
        title="Units of Measure"
        description="Control quantity units, display symbols, and decimal precision used across mill operations."
        actions={<Button onClick={openCreate}><Plus size={16} aria-hidden="true" /> Add Unit</Button>}
        className="uom-page-header"
      />

      <div className="uom-summary-grid" aria-label="Units of measure summary">
        <Card className="uom-summary-card"><span>Total units</span><strong>{records.length}</strong><small>Configured reference units</small></Card>
        <Card className="uom-summary-card"><span>Active units</span><strong>{activeCount}</strong><small>Available for transactions</small></Card>
        <Card className="uom-summary-card"><span>Categories</span><strong>{categoryCount}</strong><small>Configured quantity families</small></Card>
      </div>

      <Card className="uom-list-card">
        <div className="uom-list-heading">
          <div><h2>Unit register</h2><p>Reusable quantity definitions for materials, capacity, quality, and production records.</p></div>
          <span className="uom-record-count">{filtered.length} {filtered.length === 1 ? "unit" : "units"}</span>
        </div>
        <div className="uom-toolbar">
          <label className="uom-search"><span className="sr-only">Search units</span><input name="uom-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code, name, or symbol…" autoComplete="off" /></label>
          <label className="uom-filter"><span className="sr-only">Filter by category</span><select name="uom-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{UOM_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="uom-filter"><span className="sr-only">Filter by status</span><select name="uom-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <div className="uom-table-wrap">
          <table className="uom-table">
            <thead><tr><th scope="col">Code</th><th scope="col">Unit name</th><th scope="col">Symbol</th><th scope="col">Category</th><th scope="col">Precision</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visibleItems.map((record) => (
                <tr key={record.id}>
                  <td><button type="button" className="uom-code-button" onClick={() => setDrawer({ mode: "detail", record })}>{record.code}</button></td>
                  <td><strong>{record.name}</strong></td><td className="uom-symbol">{record.symbol}</td><td>{record.category}</td><td className="uom-number">{record.precision}</td>
                  <td><StatusBadge status={record.active ? "ACTIVE" : "INACTIVE"} /></td>
                  <td><div className="uom-row-actions"><Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "detail", record })}><Eye size={15} aria-hidden="true" /> View</Button><Button variant="secondary" size="sm" onClick={() => openEdit(record)}><Pencil size={14} aria-hidden="true" /> Edit</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? <EmptyState title="No units found" description="Adjust the filters or add a new unit of measure." action={<Button size="sm" onClick={openCreate}><Plus size={14} aria-hidden="true" /> Add Unit</Button>} /> : null}
        </div>
        {pagination}
      </Card>

      {drawer ? <UomDrawer drawer={drawer} form={form} errors={errors} onClose={closeDrawer} onEdit={openEdit} onSave={save} onChange={updateForm} /> : null}
    </main>
  );
}

function UomDrawer({ drawer, form, errors, onClose, onEdit, onSave, onChange }) {
  const isDetail = drawer.mode === "detail";
  const record = isDetail ? drawer.record : form;
  return (
    <div className="drawer-backdrop uom-drawer-backdrop" onClick={onClose}>
      <aside className="drawer uom-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="uom-drawer-title">
        <div className="drawer-head uom-drawer-head"><div><div className="eyebrow">MASTERS / MATERIAL FOUNDATION</div><h2 id="uom-drawer-title">{isDetail ? record.name : drawer === "edit" ? "Edit Unit" : "Add Unit"}</h2><p>{isDetail ? `${record.code} · ${record.symbol}` : "Define a reusable quantity unit."}</p></div><DrawerCloseButton onClick={onClose} /></div>
        {isDetail ? <>
          <StatusBadge status={record.active ? "ACTIVE" : "INACTIVE"} className="uom-detail-status" />
          <div className="uom-detail-list"><Detail label="Code" value={record.code} /><Detail label="Symbol" value={record.symbol} /><Detail label="Category" value={record.category} /><Detail label="Decimal precision" value={`${record.precision} place${record.precision === 1 ? "" : "s"}`} /></div>
          <div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit(record)}><Pencil size={15} aria-hidden="true" /> Edit Unit</Button></div>
        </> : <form className="uom-form" onSubmit={onSave} noValidate>
          {errors.form ? <div className="uom-form-error" role="alert">{errors.form}</div> : null}
          <FormField label="Code" required error={errors.code}><input name="code" value={form.code} onChange={(event) => onChange("code", event.target.value)} autoComplete="off" spellCheck={false} placeholder="e.g. KG" /></FormField>
          <FormField label="Unit name" required error={errors.name}><input name="name" value={form.name} onChange={(event) => onChange("name", event.target.value)} autoComplete="off" placeholder="e.g. Kilogram" /></FormField>
          <FormField label="Symbol" required error={errors.symbol}><input name="symbol" value={form.symbol} onChange={(event) => onChange("symbol", event.target.value)} autoComplete="off" placeholder="e.g. kg" /></FormField>
          <FormField label="Category" required error={errors.category}><select name="category" value={form.category} onChange={(event) => onChange("category", event.target.value)}><option value="">Select a category…</option>{UOM_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></FormField>
          <FormField label="Decimal precision" required hint="Number of digits shown after the decimal point." error={errors.precision}><input name="precision" type="number" min="0" max="12" step="1" inputMode="numeric" value={form.precision} onChange={(event) => onChange("precision", event.target.value)} /></FormField>
          <label className="uom-active-field"><input name="active" type="checkbox" checked={form.active} onChange={(event) => onChange("active", event.target.checked)} /><span>Available for transactions</span></label>
          <div className="drawer-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{drawer === "edit" ? "Update Unit" : "Save Unit"}</Button></div>
        </form>}
      </aside>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="uom-detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

