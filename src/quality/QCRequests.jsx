import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { BreadcrumbSeparator, Button, Card, EmptyState, PageHeader, StatusBadge, VehiclePlateDisplay } from "../design-system/index.js";
import { usePaginatedItems } from "../shared/PaginatedList.jsx";
import { formatDate, formatQuantity } from "../shared/formatters.js";
import { filterDispatchQualityRecords, normalizeDispatchQualityRecord } from "./dispatch-quality.js";
import "./dispatch-quality.css";

const valueOrPending = (value) => value === "—" || value === "" || value == null ? "Not captured" : value;
const dateTime = (value) => value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Not captured";
const weight = (value, uom = "MT") => value == null || value === "" ? "Not captured" : formatQuantity(value, uom, 3);

function DetailValue({ label, value }) {
  return <div className="dispatch-quality-detail-value"><span>{label}</span><strong>{valueOrPending(value)}</strong></div>;
}

function DetailSection({ title, description, children }) {
  return <section className="dispatch-quality-section"><div className="dispatch-quality-section-heading"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div></div>{children}</section>;
}

function DispatchQualityDetails({ record, onBack }) {
  return <main className="dispatch-quality-page dispatch-quality-detail-page">
    <div className="dispatch-quality-breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Dispatch QC</button><BreadcrumbSeparator /><strong>Details</strong></div>
    <PageHeader eyebrow="QUALITY / DISPATCH QC" title={record.orderNo} description={`${record.material} · ${record.customer}`} actions={<Button variant="secondary" onClick={onBack}>Back to Listing</Button>} />
    <div className="dispatch-quality-detail-layout">
      <div>
        <Card className="dispatch-quality-summary-card"><div className="dispatch-quality-summary-top"><div><span className="ds-eyebrow">QUALITY STATUS</span><h2>{record.sampleNo === "—" ? "Sample pending" : record.sampleNo}</h2></div><StatusBadge status={record.qualityStatus} /></div><p>{record.qualityStatus === "PENDING" ? "Loading is complete and this dispatch is waiting for quality sampling." : record.qualityStatus === "NOT_STARTED" ? "A quality sample has not been recorded for this dispatch." : `Sample recorded ${dateTime(record.sampleTime)}.`}</p></Card>
        <Card className="dispatch-quality-detail-card"><DetailSection title="Sample details" description="The quality receipt and recorded parameter results for this dispatch."><div className="dispatch-quality-detail-grid"><DetailValue label="Sample / receipt no." value={record.sampleNo} /><DetailValue label="Sample time" value={dateTime(record.sampleTime)} /><DetailValue label="Tested by" value={record.testedBy} /><DetailValue label="Quality status" value={<StatusBadge status={record.qualityStatus} />} /><DetailValue label="Remarks" value={record.remarks} /></div>{record.parameters.length ? <div className="dispatch-quality-parameters"><h3>Parameter results</h3><div className="table-wrap"><table><thead><tr><th>Parameter</th><th>Result</th><th>Unit</th></tr></thead><tbody>{record.parameters.map((item, index) => <tr key={`${item.parameter || "parameter"}-${index}`}><td>{valueOrPending(item.parameter)}</td><td>{valueOrPending(item.result)}</td><td>{valueOrPending(item.uom)}</td></tr>)}</tbody></table></div></div> : <EmptyState title="No parameter results recorded" description="The sample receipt has not captured parameter-level results yet." />}</DetailSection></Card>
      </div>
      <div className="dispatch-quality-detail-side"><Card className="dispatch-quality-detail-card"><DetailSection title="Dispatch and customer" description="Commercial context sourced from the dispatch order."><div className="dispatch-quality-detail-grid"><DetailValue label="Dispatch order" value={record.orderNo} /><DetailValue label="Customer" value={record.customer} /><DetailValue label="Material" value={record.material} /><DetailValue label="Planned quantity" value={record.quantity == null ? "Not captured" : formatQuantity(record.quantity, record.uom, 3)} /><DetailValue label="Order date" value={record.orderDate ? formatDate(record.orderDate) : "Not captured"} /></div></DetailSection></Card><Card className="dispatch-quality-detail-card"><DetailSection title="Sample logistics" description="Vehicle and transporter identity must remain visible with the quality record."><div className="dispatch-quality-detail-grid"><DetailValue label="Vehicle" value={<VehiclePlateDisplay value={record.vehicle} fallback="Not captured" />} /><DetailValue label="Driver" value={record.driver} /><DetailValue label="Transporter" value={record.transporter} /><DetailValue label="Loading bay" value={record.loadingBay} /></div></DetailSection></Card><Card className="dispatch-quality-detail-card"><DetailSection title="Dispatch measurements" description="Traceable weights associated with this quality event."><div className="dispatch-quality-detail-grid"><DetailValue label="Empty weight" value={weight(record.emptyWeight)} /><DetailValue label="Loaded weight" value={weight(record.loadedWeight)} /><DetailValue label="Tare weight" value={weight(record.tareWeight)} /><DetailValue label="Net dispatched" value={weight(record.netWeight)} /><DetailValue label="Loaded quantity" value={weight(record.loadedQuantity, record.uom)} /></div></DetailSection></Card></div>
    </div>
  </main>;
}

export function QCRequestsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/dispatch-orders"); const payload = await response.json(); if (!response.ok) throw new Error(payload.message || "Unable to load Dispatch QC records."); setRecords((Array.isArray(payload) ? payload : []).map(normalizeDispatchQualityRecord)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => filterDispatchQualityRecords(records, search), [records, search]);
  const { visibleItems, pagination } = usePaginatedItems(filtered, search);
  if (selected) return <DispatchQualityDetails record={selected} onBack={() => setSelected(null)} />;
  return <main className="dispatch-quality-page">
    <div className="dispatch-quality-breadcrumb"><span>Quality</span><BreadcrumbSeparator /><strong>Dispatch QC</strong></div>
    <PageHeader eyebrow="QUALITY" title="Dispatch QC" description="Review quality samples against the customer and vehicle dispatch context." actions={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</Button>} />
    {error ? <div className="ds-alert ds-alert-error" role="alert">{error}</div> : null}
    <Card className="dispatch-quality-list-card"><div className="dispatch-quality-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, vehicle, transporter or sample…" aria-label="Search Dispatch QC" /></div><div className="dispatch-quality-table-wrap"><table><thead><tr><th>Dispatch order</th><th>Customer</th><th>Material</th><th>Vehicle</th><th>Transporter</th><th>Sample</th><th>Sample time</th><th>Quality</th></tr></thead><tbody>{loading ? <tr><td colSpan="8" className="dispatch-quality-table-message">Loading Dispatch QC records…</td></tr> : visibleItems.map((record) => <tr key={record.id} className="clickable-table-row" onClick={() => setSelected(record)}><td><button type="button" className="table-link" onClick={(event) => { event.stopPropagation(); setSelected(record); }}>{record.orderNo}</button></td><td>{record.customer}</td><td>{record.material}</td><td><VehiclePlateDisplay value={record.vehicle} /></td><td>{record.transporter}</td><td>{record.sampleNo}</td><td>{dateTime(record.sampleTime)}</td><td><StatusBadge status={record.qualityStatus} /></td></tr>)}{!loading && !visibleItems.length ? <tr><td colSpan="8"><EmptyState title="No Dispatch QC records found" description={search ? "Try a different order, customer, vehicle or sample search." : "Dispatch orders will appear here when they enter the quality workflow."} /></td></tr> : null}</tbody></table></div>{pagination}</Card>
  </main>;
}
