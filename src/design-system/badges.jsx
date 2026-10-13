import React from "react";

export function Badge({ tone = "neutral", children, className = "", ...props }) {
  return (
    <span className={`ds-badge ds-badge-${tone} ${className}`.trim()} role="status" {...props}>
      {children}
    </span>
  );
}

export function StatusBadge({ tone = "neutral", children, className = "", ...props }) {
  return <Badge tone={tone} className={className} {...props}>{children}</Badge>;
}

export function badgeToneForStatus(value) {
  const normalized = String(value || "").toLowerCase();
  if (/completed|approved|ready|active/.test(normalized)) return "info";
  if (/pending|awaiting|weighing|review/.test(normalized)) return "warning";
  if (/rejected|blocked|cancelled|failed/.test(normalized)) return "danger";
  return "neutral";
}
