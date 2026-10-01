import React, { useMemo, useState } from "react";
import "./storage-areas.css";

const areaConfig = {
  tankFarm: {
    title: "Tank Farm",
    material: "CPO",
    subtitle: "Bulk CPO storage, release status and tank inventory visibility.",
    locations: ["CPO Tank 01"],
    storageType: "Bulk liquid tank",
    control: "FFA, moisture and dirt release checks",
  },
  kernelWarehouse: {
    title: "Kernel Warehouse",
    material: "Palm Kernel",
    subtitle: "Palm Kernel warehouse stock, storage location and availability.",
    locations: ["Kernel Silo"],
    storageType: "Dry bulk warehouse / silo",
    control: "Moisture, infestation and lot traceability",
  },
  efbStorage: {
    title: "EFB Storage",
    material: "EFB",
    subtitle: "Empty Fruit Bunch storage balance, availability and handling information.",
    locations: ["EFB Storage"],
    storageType: "Covered residue storage",
    control: "Moisture, yard condition and movement tracking",
  },
};

const formatQty = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} MT`;

export function StorageAreaPage({ area, rows = [], quality = [] }) {
  const config = areaConfig[area] || areaConfig.tankFarm;
  const [search, setSearch] = useState("");
  const records = useMemo(() => rows.filter((row) => row.material === config.material || config.locations.includes(row.location)).filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))), [rows, config, search]);
  const primary = records[0] || { material: config.material, location: config.locations[0], balance: 0, state: "No stock recorded", trend: "—" };
  const relatedQuality = quality.filter((row) => row.source === primary.location || row.source.toLowerCase().includes(config.material.toLowerCase()));
  const statusClass = /release|available/i.test(primary.state) ? "storage-status available" : "storage-status";

  return <main className="storage-page">
    <div className="customer-breadcrumb"><span>Stock</span><b>›</b><strong>{config.title}</strong></div>
    <div className="customer-list-heading"><div><div className="eyebrow">STOCK / STORAGE</div><h1>{config.title}</h1><p>{config.subtitle}</p></div></div>
    <section className="storage-kpis"><article><span>Current balance</span><strong>{formatQty(primary.balance)}</strong><small>{primary.material}</small></article><article><span>Storage location</span><strong>{primary.location}</strong><small>{config.storageType}</small></article><article><span>Stock status</span><strong className={statusClass}>{primary.state}</strong><small>{primary.trend} movement trend</small></article><article><span>Control focus</span><strong>{config.control}</strong><small>Configured quality and handling controls</small></article></section>
    <section className="panel storage-panel"><div className="items-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()} records...`} /><span>{records.length} storage record{records.length === 1 ? "" : "s"}</span></div><div className="table-wrap"><table><thead><tr><th>Material</th><th>Location / Unit</th><th>Balance</th><th>UOM</th><th>State</th><th>Trend</th></tr></thead><tbody>{records.map((row) => <tr key={row.id || `${row.material}-${row.location}`}><td><strong>{row.material}</strong></td><td>{row.location}</td><td>{formatQty(row.balance).replace(" MT", "")}</td><td>MT</td><td><span className={/release|available/i.test(row.state) ? "customer-status" : "customer-status warning"}>{row.state}</span></td><td>{row.trend || "—"}</td></tr>)}{!records.length && <tr><td colSpan="6" className="items-empty">No stock records found for this storage area.</td></tr>}</tbody></table></div></section>
    <section className="storage-lower-grid"><article className="panel storage-info"><h2>Storage information</h2><dl><div><dt>Material</dt><dd>{config.material}</dd></div><div><dt>Storage type</dt><dd>{config.storageType}</dd></div><div><dt>Traceability</dt><dd>Batch / lot movement</dd></div><div><dt>Quality control</dt><dd>{config.control}</dd></div></dl></article><article className="panel storage-info"><h2>Latest quality checks</h2>{relatedQuality.length ? <div className="storage-quality-list">{relatedQuality.slice(0, 5).map((row) => <div key={row.id}><strong>{row.parameter}</strong><span>{row.result}</span><small>{row.status} · {row.due}</small></div>)}</div> : <p className="storage-empty-copy">No quality checks are currently recorded for this storage area.</p>}</article></section>
  </main>;
}
