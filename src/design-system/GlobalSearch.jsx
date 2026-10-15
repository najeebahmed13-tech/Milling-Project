import React from "react";
import { Search, X } from "lucide-react";

export function GlobalSearch({ value, onChange }) {
  return (
    <div className="global-search" role="search">
      <Search className="global-search-icon" size={18} strokeWidth={1.9} aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search..." aria-label="Search across the application" autoComplete="off" />
      {value ? <button type="button" className="global-search-clear" onClick={() => onChange("")} aria-label="Clear search"><X size={16} aria-hidden="true" /></button> : null}
    </div>
  );
}
