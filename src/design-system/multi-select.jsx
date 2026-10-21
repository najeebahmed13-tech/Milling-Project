import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getMultiSelectSummary, normalizeMultiSelectOptions, toggleMultiSelectValue } from "./multi-select.js";

export function MultiSelectDropdown({ options = [], value = [], onChange, placeholder = "Select options", disabled = false, id, name, className = "", "aria-describedby": describedBy, "aria-invalid": invalid }) {
  const generatedId = useId().replace(/:/g, "");
  const controlId = id || `multi-select-${generatedId}`;
  const listboxId = `${controlId}-options`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const normalizedOptions = useMemo(() => normalizeMultiSelectOptions(options), [options]);
  const selectedValues = useMemo(() => normalizedOptions.map((option) => option.value).filter((option) => value.includes(option)), [normalizedOptions, value]);
  const summary = getMultiSelectSummary(selectedValues, normalizedOptions, placeholder);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const handleKeyDown = (event) => { if (event.key === "Escape") { setOpen(false); document.getElementById(controlId)?.focus(); } };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("pointerdown", handlePointerDown); document.removeEventListener("keydown", handleKeyDown); };
  }, [controlId, open]);

  const toggleOption = (optionValue) => onChange?.(toggleMultiSelectValue(selectedValues, optionValue, normalizedOptions));

  return <div ref={rootRef} className={`ds-multi-select ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}>
    <button id={controlId} type="button" className="ds-multi-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} aria-describedby={describedBy} aria-invalid={invalid} disabled={disabled} onClick={() => setOpen((current) => !current)}>
      <span className={`ds-multi-select-value ${selectedValues.length ? "has-value" : ""}`}>{summary}</span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
    {name ? selectedValues.map((selectedValue) => <input key={selectedValue} type="hidden" name={`${name}[]`} value={selectedValue} />) : null}
    {open ? <div id={listboxId} className="ds-multi-select-menu" role="listbox" aria-label={placeholder} aria-multiselectable="true">
      {normalizedOptions.map((option) => { const selected = selectedValues.includes(option.value); return <button key={option.value} type="button" role="option" aria-selected={selected} className={`ds-multi-select-option ${selected ? "is-selected" : ""}`} onClick={() => toggleOption(option.value)}><span className="ds-multi-select-check" aria-hidden="true">{selected ? <Check size={14} strokeWidth={2.5} /> : null}</span><span>{option.label}</span></button>; })}
    </div> : null}
  </div>;
}
