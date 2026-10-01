import React, { useState } from "react";

const Icon = ({ name }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5" /><path d="M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></>,
    export: <><path d="M12 3v13" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></>,
    filter: <path d="M4 5h16M7 12h10m-7 7h4" />,
    list: <><rect x="4" y="5" width="16" height="3" rx="1" /><rect x="4" y="11" width="16" height="3" rx="1" /><rect x="4" y="17" width="16" height="3" rx="1" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="listing-action-icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
};

export function ListingActions({ search, setSearch, rows = [], columns = [], onRefresh, children }) {
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  const [filterOpen, setFilterOpen] = useState(false);
  const exportRows = () => {
    const header = columns.join(",");
    const body = rows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? "")).join(","));
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "listing-export.csv"; link.click(); URL.revokeObjectURL(link.href);
  };
  return <div className="listing-actions">
    {searchOpen && <input className="listing-search-input" autoFocus value={search || ""} onChange={(event) => setSearch?.(event.target.value)} placeholder="Search listing..." />}
    <button type="button" title="Search" aria-label="Search" className={searchOpen ? "active" : ""} onClick={() => setSearchOpen((value) => !value)}><Icon name="search" /></button>
    <button type="button" title="Refresh" aria-label="Refresh" onClick={onRefresh || (() => window.location.reload())}><Icon name="refresh" /></button>
    <button type="button" title="Export CSV" aria-label="Export CSV" onClick={exportRows}><Icon name="export" /></button>
    <button type="button" title="Filter" aria-label="Filter" className={filterOpen ? "active" : ""} onClick={() => setFilterOpen((value) => !value)}><Icon name="filter" /></button>
    <button type="button" title="List view" aria-label="List view" className="active"><Icon name="list" /></button>
    {filterOpen && <span className="listing-filter-popover">Showing {rows.length} records</span>}
    {children}
  </div>;
}
