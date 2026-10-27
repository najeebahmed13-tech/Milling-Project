# ROCKEYE Business Rules Document

**Baseline:** v1.0 Draft  
**Product:** Palm Oil Mill ERP + MES SaaS  
**Source:** approved PRD, module FRDs, prototype/reference flows, project architecture decisions, and attached BRD prompt

## Deliverables

- [`business-rule-index.md`](business-rule-index.md) — rule register and module ownership
- [`cross-module-rules.md`](cross-module-rules.md) — centralized rules shared across modules
- [`module-business-rules.md`](module-business-rules.md) — module-wise rules with full rule fields
- [`status-transition-matrix.md`](status-transition-matrix.md) — state machines and transition controls
- [`calculation-validation-catalogue.md`](calculation-validation-catalogue.md) — quantities, UOM, quality, mass balance, and validation rules
- [`permissions-configurability.md`](permissions-configurability.md) — permission, override, configuration, and scope matrix
- [`traceability-open-decisions.md`](traceability-open-decisions.md) — FRD-to-rule traceability and unresolved decisions

## Consolidated rule-owning modules

The prompt's possible modules are consolidated where they share an aggregate and transaction boundary:

1. Platform Administration
2. Identity, Users & RBAC
3. Master Data & Configuration
4. Sales & Customer Management
5. Procurement & Supplier Management
6. Weighbridge & FFB Receiving
7. Inventory, Warehouse & Storage
8. Production Planning, Routing & MES Execution
9. Quality Management
10. Sustainability, Mass Balance & Traceability
11. Maintenance, Equipment, Breakdown, PM, Work Orders & OEE
12. Dispatch & Delivery
13. Documents & Notifications
14. Reporting & Dashboards
15. Integration Management
16. Finance Interface

This avoids duplicate rules while still covering Customer Management, Supplier Management, Sales Contracts, Customer Orders, Procurement/Supplier Contracts, FFB Receiving, Weighbridge, Item/Product Master, Warehouse/Storage, Tank Management, Production Planning, Production Execution, Production Routing, Quality, Checkpoints, Mass Balance, Oil Loss, CPO, Palm Kernel, Dispatch, Delivery, Equipment, Maintenance, Breakdown, Preventive Maintenance, Work Orders, OEE, Documents, Reporting, Dashboards, Users, RBAC, Tenant Configuration, Platform Administration, Audit, and Integrations.

## Rule format

Every rule uses a unique `BR-<MODULE>-###` identifier and records the rule name, module, exact statement, trigger, conditions, system behavior, validation, exception, role/permission, status impact, audit requirement, related FRD, classification, and priority.

Rules are controlled baselines. A change requires a change request, impact assessment, approval, and new baseline version.
