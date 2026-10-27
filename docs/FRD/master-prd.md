# Master Product PRD — Palm Oil Mill ERP + MES

**Baseline:** v1.0 Draft  
**Product:** ROCKEYE Palm Oil Mill ERP + MES SaaS  
**Scope:** Multi-tenant, multi-company, multi-mill, configurable industrial operations

## Product outcome

ROCKEYE enables palm oil organizations to manage commercial commitments, procurement, FFB receiving, weighing, quality, production execution, inventory, storage, maintenance, dispatch, sustainability, finance interfaces, reporting, and auditability in one traceable operational system.

The target product must support a small single-mill operator and a conglomerate with multiple legal entities, operating companies, mills, lines, warehouses, shared services, delegated administration, and strict data segregation through configuration rather than code forks.

## Product principles

- Business rules are configurable and scoped to tenant, company, mill, line, product, effective date, and regulatory context.
- Domain modules own their data and state transitions; cross-module changes use APIs, commands, or events.
- Posted production, quality, inventory, commercial, and compliance records are traceable and corrected through controlled reversal.
- Server-side authorization and tenant isolation are mandatory; frontend checks are presentation controls.
- Routes, quality specifications, sampling, costing, approvals, numbering, shifts, and tolerances are versioned when historical interpretation matters.
- The product is API-first for integrations, observable in production, and usable on desktop, tablet, and mobile.

## Capability groups

| Group | Primary capabilities |
|---|---|
| Sales | customers, contracts, allocations, delivery commitments, settlement |
| Procurement | suppliers, purchase contracts, direct purchase, commitments |
| Receiving | gate, weighbridge, FFB receipt, grading, rejection, reconciliation |
| Inventory | lots, ledger, balances, reservations, storage, transfers, reversals |
| Production | routes, planning, batches, execution, outputs, losses, genealogy |
| Quality | parameters, configurations, observations, evaluation, deviation, reporting |
| Maintenance | equipment, preventive work, breakdowns, work orders, reliability |
| Dispatch | orders, loading, outbound weighing, release, documents, POD |
| Sustainability | certification, traceability, mass balance, due diligence |
| Reporting | KPIs, dashboards, drill-down, audit and scheduled exports |

Platform capabilities—tenant administration, identity, RBAC, workflows, documents, notifications, audit, integrations, and configuration—serve all groups.

## Product success measures

The final measures require business-owner approval, but the product must be able to measure:

- complete traceability from delivery/source lot to product dispatch;
- reconciliation of weighment, grading, accepted/rejected, inventory, and production quantities;
- production yield, loss, downtime, quality release, and equipment performance;
- contract, procurement, and dispatch fulfillment;
- approval turnaround, exception aging, audit completeness, and integration failures;
- tenant isolation, authorization failures, posting retries, and operational availability.

## Scope boundaries

Finance accounting, tax, payroll, laboratory control, SCADA/PLC control, sensor telemetry, and external certification portals are integration boundaries unless explicitly approved as product-owned capabilities. The ERP/MES must retain the operational source records required for reconciliation and audit.

## Baseline governance

This is an approved-and-controlled baseline, not an immutable document. Changes require a change request, impact assessment, approver, and revised baseline version as defined in [`../Product_requirement.md`](../Product_requirement.md).
