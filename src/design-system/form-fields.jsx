import React from "react";
import { formatInputValue, normalizeDisplayText } from "../shared/formatters.js";

function inputClassName(className = "") {
  return `ds-input ${className}`.trim();
}

export function TextInput({ value, defaultValue, className = "", ...props }) {
  const controlled = value !== undefined;
  return <input type="text" className={inputClassName(className)} {...props} {...(controlled ? { value: formatInputValue(value) } : { defaultValue: formatInputValue(defaultValue) })} />;
}

export function NumberInput({ value, defaultValue, className = "", ...props }) {
  const controlled = value !== undefined;
  return <input type="number" className={inputClassName(className)} {...props} {...(controlled ? { value: formatInputValue(value) } : { defaultValue: formatInputValue(defaultValue) })} />;
}

export function QuantityInput({ uom = "MT", decimals = 2, onChange, ...props }) {
  const step = props.step ?? 10 ** -decimals;
  const handleChange = (event) => {
    const raw = event.currentTarget.value;
    const fraction = raw.split(".")[1];
    if (fraction && fraction.length > decimals) return;
    onChange?.(event);
  };
  return <div className="ds-input-with-suffix"><NumberInput {...props} step={step} onChange={handleChange} inputMode="decimal" /><span>{uom}</span></div>;
}

export function CurrencyInput({ currency = "MYR", ...props }) {
  return <div className="ds-input-with-prefix"><span>{currency}</span><NumberInput min="0" step="0.01" {...props} /></div>;
}

export function FileInput({ className = "", ...props }) {
  return <input type="file" className={inputClassName(`ds-file-input ${className}`)} {...props} />;
}

export function DisplayValue({ value, formatter, fallback = "-", className = "" }) {
  const display = formatter ? formatter(value) : normalizeDisplayText(value, fallback);
  return <span className={`ds-display-value ${className}`.trim()}>{display || fallback}</span>;
}
