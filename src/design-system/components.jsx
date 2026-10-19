import React, { useId } from "react";
import { ChevronRight, X } from "lucide-react";
import { EMPTY_VALUE, formatVehiclePlate } from "../shared/formatters.js";
import { normalizeBreadcrumbItems } from "./breadcrumbs.js";

export function Button({ variant = "primary", size = "md", className = "", type = "button", children, ...props }) {
  return <button type={type} className={`ds-button ds-button-${variant} ds-button-${size} ${className}`.trim()} {...props}>{children}</button>;
}

export function IconButton({ label, children, className = "", type = "button", ...props }) {
  return <button type={type} className={`ds-icon-button ${className}`.trim()} aria-label={label} {...props}>{children}</button>;
}

export function BreadcrumbSeparator({ className = "" }) {
  return <ChevronRight className={`ds-breadcrumb-separator ${className}`.trim()} size={14} strokeWidth={1.8} aria-hidden="true" />;
}

export function Breadcrumbs({ items = [], className = "" }) {
  const normalizedItems = normalizeBreadcrumbItems(items);
  return (
    <nav className={`ds-breadcrumb ${className}`.trim()} aria-label="Breadcrumb">
      {normalizedItems.map((item, index) => {
        const current = index === normalizedItems.length - 1;
        const content = current
          ? <strong aria-current="page">{item.label}</strong>
          : item.onClick
            ? <button type="button" onClick={item.onClick}>{item.label}</button>
            : <span>{item.label}</span>;
        return <React.Fragment key={`${item.label}-${index}`}>{index ? <BreadcrumbSeparator /> : null}{content}</React.Fragment>;
      })}
    </nav>
  );
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

export function FormField({ label, required = false, hint, error, id, children, className = "" }) {
  const generatedId = useId().replace(/:/g, "");
  const controlId = id || `field-${generatedId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = React.isValidElement(children)
    ? React.cloneElement(children, { id: children.props.id || controlId, "aria-describedby": children.props["aria-describedby"] || describedBy, "aria-invalid": error ? true : children.props["aria-invalid"] })
    : children;
  return (
    <div className={`ds-field ${error ? "ds-field-error" : ""} ${className}`.trim()}>
      <label className="ds-field-label" htmlFor={controlId}>
        <span>{label}{required ? <span className="ds-required" aria-hidden="true"> *</span> : null}</span>
        {hint ? <small id={hintId}>{hint}</small> : null}
      </label>
      {control}
      {error ? <div id={errorId} className="ds-field-message" role="alert">{error}</div> : null}
    </div>
  );
}

export function Alert({ tone = "info", children, className = "" }) {
  return <div className={`ds-alert ds-alert-${tone} ${className}`.trim()} role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}>{children}</div>;
}

export function EmptyState({ title, description, action }) {
  return <div className="ds-empty-state"><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>;
}
