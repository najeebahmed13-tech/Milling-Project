import React from "react";

export function DateRangeFilter({ start, end, separator = " - ", className = "" }) {
  return (
    <span className={`ds-date-range-filter ${className}`.trim()}>
      {start || "—"}{separator}{end || "—"}
    </span>
  );
}
