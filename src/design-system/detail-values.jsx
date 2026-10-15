import React from "react";
import { DETAIL_EMPTY_VALUE, DETAIL_PENDING_VALUE, resolveDetailValue } from "./detail-values.js";

export { DETAIL_EMPTY_VALUE, DETAIL_PENDING_VALUE } from "./detail-values.js";

export function DetailValue({ value, pending = false, fallback = DETAIL_EMPTY_VALUE, formatter, className = "" }) {
  const resolved = formatter
    ? formatter(value)
    : resolveDetailValue(value, { pending, fallback });
  return <span className={`ds-detail-value ${className}`.trim()}>{resolved}</span>;
}
