import React from "react";
import { ChevronDown } from "lucide-react";

export function ActionMenu({
  open,
  onToggle,
  items = [],
  label = "Actions",
  className = "",
}) {
  return (
    <div className={`ds-action-menu ${className}`.trim()}>
      <button
        type="button"
        className="ds-action-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {label} <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="ds-action-menu-dropdown"
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          {items.map((item) => (
            <button
              key={item.key || item.label}
              type="button"
              role="menuitem"
              className={item.danger ? "ds-action-menu-item-danger" : ""}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
