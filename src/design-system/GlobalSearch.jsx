import React, { useEffect, useReducer, useRef } from "react";
import { Command, Search, X } from "lucide-react";
import { globalSearchReducer, initialGlobalSearchState } from "./global-search-state.js";

export function GlobalSearch({ value, onChange }) {
  const [state, dispatch] = useReducer(globalSearchReducer, initialGlobalSearchState);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dispatch({ type: "open" });
      }
      if (event.key === "Escape") dispatch({ type: "close" });
    };
    const onPointerDown = (event) => {
      if (state.open && !searchRef.current?.contains(event.target)) dispatch({ type: "close" });
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [state.open]);

  useEffect(() => {
    if (state.open) inputRef.current?.focus();
  }, [state.open]);

  return (
    <div ref={searchRef} className={`global-search ${state.open ? "is-open" : ""}`}>
      <button type="button" className="global-search-trigger" onClick={() => dispatch({ type: "toggle" })} aria-expanded={state.open} aria-controls="global-search-panel" aria-label="Open global search">
        <Search size={18} strokeWidth={1.9} aria-hidden="true" />
        <span>Search</span>
        <kbd><Command size={11} aria-hidden="true" /> K</kbd>
      </button>
      {state.open ? (
        <div id="global-search-panel" className="global-search-panel" role="search">
          <div className="global-search-input-wrap">
            <Search size={18} strokeWidth={1.9} aria-hidden="true" />
            <input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search modules, records, or actions…" aria-label="Search modules, records, or actions" autoComplete="off" />
            {value ? <button type="button" className="global-search-clear" onClick={() => onChange("")} aria-label="Clear search"><X size={16} aria-hidden="true" /></button> : null}
          </div>
          <div className="global-search-footer"><span>Search across the application</span><button type="button" onClick={() => dispatch({ type: "close" })}>Esc</button></div>
        </div>
      ) : null}
    </div>
  );
}
