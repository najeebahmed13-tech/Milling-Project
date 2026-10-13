import React from "react";
import { ChevronRight, X } from "lucide-react";
import { EMPTY_VALUE, formatVehiclePlate } from "../shared/formatters.js";

export function Button({ variant = "primary", size = "md", className = "", type = "button", children, ...props }) {
  return <button type={type} className={`ds-button ds-button-${variant} ds-button-${size} ${className}`.trim()} {...props}>{children}</button>;
}

export function IconButton({ label, children, className = "", type = "button", ...props }) {
  return <button type={type} className={`ds-icon-button ${className}`.trim()} aria-label={label} {...props}>{children}</button>;
}

export function BreadcrumbSeparator({ className = "" }) {
  return <ChevronRight className={`ds-breadcrumb-separator ${className}`.trim()} size={14} strokeWidth={1.8} aria-hidden="true" />;
}

export function DrawerCloseButton({ onClick, label = "Close drawer", className = "", ...props }) {
  return <button type="button" className={`icon-button ds-drawer-close ${className}`.trim()} aria-label={label} title={label} onClick={onClick} {...props}><X size={17} strokeWidth={1.8} aria-hidden="true" /></button>;
}

export function VehiclePlateDisplay({ value, fallback = EMPTY_VALUE, className = "" }) {
  return <span className={`ds-vehicle-plate ${className}`.trim()}>{formatVehiclePlate(value, fallback)}</span>;
}

export function Card({ as: Element = "section", className = "", children, ...props }) {
  return <Element className={`ds-card ${className}`.trim()} {...props}>{children}</Element>;
}

export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <header className={`ds-page-header ${className}`.trim()}>
      <div className="ds-page-header-copy">
        {eyebrow ? <div className="ds-eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="ds-page-header-actions">{actions}</div> : null}
    </header>
  );
}

export function FormField({ label, required = false, hint, error, children, className = "" }) {
  return (
    <div className={`ds-field ${error ? "ds-field-error" : ""} ${className}`.trim()}>
      <label className="ds-field-label">
        <span>{label}{required ? <span className="ds-required" aria-hidden="true"> *</span> : null}</span>
        {hint ? <small>{hint}</small> : null}
      </label>
      {children}
      {error ? <div className="ds-field-message" role="alert">{error}</div> : null}
    </div>
  );
}

export function Alert({ tone = "info", children, className = "" }) {
  return <div className={`ds-alert ds-alert-${tone} ${className}`.trim()} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function EmptyState({ title, description, action }) {
  return <div className="ds-empty-state"><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>;
}
