import React from "react";
import { BreadcrumbSeparator, PageHeader } from "../design-system/index.js";
import "./maintenance.css";

export function MaintenancePage({ onNavigate }) {
  return (
    <main className="maintenance-page">
      <div className="maintenance-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate("maintenance")}>Maintenance</button>
        <BreadcrumbSeparator />
        <strong>Overview</strong>
      </div>
      <PageHeader eyebrow="MAINTENANCE" title="Maintenance" description="Coordinate equipment records and maintenance-store masters for mill reliability." />
    </main>
  );
}
