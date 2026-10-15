import React from "react";
import { DetailValue } from "./detail-values.jsx";

export function ReadOnlySummary({ title, reference, children, className = "" }) {
  return (
    <section className={`ds-readonly-summary ${className}`.trim()}>
      <div className="ds-readonly-summary-heading">
        <span>{title}</span>
        <ReferenceCode>{reference}</ReferenceCode>
      </div>
      <div className="ds-readonly-summary-grid">{children}</div>
    </section>
  );
}

export function ReferenceCode({ children, className = "" }) {
  return <span className={`ds-reference-code ${className}`.trim()}>{children}</span>;
}

export function ReadOnlyField({ label, value, pending = false, meta, emphasis = false }) {
  return (
    <div className={`ds-readonly-field${emphasis ? " emphasis" : ""}`}>
      <span>{label}</span>
      <strong><DetailValue value={value} pending={pending} /></strong>
      {meta ? <small>{meta}</small> : null}
    </div>
  );
}
