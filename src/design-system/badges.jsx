import React from "react";
import { getStatusDefinition, statusTone } from "./status-registry.js";

export function Badge({ tone = "neutral", children, className = "", ...props }) {
  return (
    <span className={`ds-badge ds-badge-${tone} ${className}`.trim()} role="status" {...props}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, tone, children, className = "", ...props }) {
  const definition = getStatusDefinition(status);
  return <Badge tone={tone || (status ? statusTone(status) : "neutral")} className={className} {...props}>{children ?? definition?.label ?? status}</Badge>;
}

export function badgeToneForStatus(value) {
  return statusTone(value);
}
