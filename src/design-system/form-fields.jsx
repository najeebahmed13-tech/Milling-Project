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

export function QuantityInput({ uom = "MT", ...props }) {
  return <div className="ds-input-with-suffix"><NumberInput step="0.001" {...props} /><span>{uom}</span></div>;
}

export function CurrencyInput({ currency = "MYR", ...props }) {
  return <div className="ds-input-with-prefix"><span>{currency}</span><NumberInput min="0" step="0.01" {...props} /></div>;
}

export function DisplayValue({ value, formatter, fallback = "\u2014", className = "" }) {
  const display = formatter ? formatter(value) : normalizeDisplayText(value, fallback);
  return <span className={`ds-display-value ${className}`.trim()}>{display || fallback}</span>;
}
