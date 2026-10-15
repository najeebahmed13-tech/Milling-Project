import React from "react";

import { formatDate } from "../shared/formatters.js";

const displayDate = (value) => {
  if (!value) return "TBA";
  const formatted = formatDate(value);
  return formatted === "-" ? "TBA" : formatted;
};

export function DateRangeFilter({ start, end, separator = " - ", className = "" }) {
  return (
    <span className={`ds-date-range-filter ${className}`.trim()}>
      {start || "—"}{separator}{end || "—"}
    </span>
  );
}
