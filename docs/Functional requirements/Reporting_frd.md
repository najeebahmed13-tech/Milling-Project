# Reporting Functional Requirements

**Document ID:** FRD-REPORTING  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-REPT-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Reporting provides tenant-scoped operational dashboards, KPI definitions, analytical views, exports, audit search, and scheduled reporting across approved read models and interfaces. It does not mutate transactional aggregates.

## Current implementation status

**Overall status:** Not started as a dedicated module. The system contains operational overview data and screens, but no complete reporting module, KPI registry, scheduled reporting, governed exports, or report-versioning implementation was identified.

| Area | Status | Evidence |
|---|---|---|
| Operational overview data | Partially implemented | `../../apps/api/production.js` exposes production overview data |
| Dedicated KPI definitions | Not started | No dedicated KPI registry identified |
| Dashboards and governed reports | Planned | No complete reporting module identified |
| Scheduled reports and exports | Not started | No dedicated implementation identified |
| Audit reporting | Planned | Audit/reporting boundary is documented but not fully implemented |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-REPT-001` | KPI Definition | Define KPI formula, source, scope, date basis, UOM, and refresh behavior. |
| `PR-REPT-002` | Operational Dashboard | View receiving, production, quality, inventory, maintenance, dispatch, and sustainability indicators. |
| `PR-REPT-003` | Traceability and Audit Report | Search and export linked business events, movements, approvals, and audit history. |
| `PR-REPT-004` | Scheduled Report | Configure authorized recurring reports, recipients, filters, and delivery status. |
| `PR-REPT-005` | Data Export | Export approved datasets with pagination, scope, format, and access controls. |
| `PR-REPT-006` | Report Administration | Manage report definitions, visibility, versions, refresh, and failure handling. |

## Common requirements

- KPI formulas, source fields, aggregation, scope, UOM, calendar, timezone, thresholds, and refresh cadence are documented and versioned.
- Reports use read interfaces, projections, or approved queries and must not bypass module ownership or mutate source data.
- Every query, export, and scheduled delivery is tenant-scoped, permission-checked, paginated where appropriate, and observable.
- Historical reports identify the formula/configuration version and data refresh timestamp used.

## UI/API and acceptance baseline

- UI: dashboard, report catalog, filters, drill-through, export, schedule, audit, and refresh status views.
- API: versioned `/api/v1/reports`, `/dashboards`, `/exports`, and `/report-schedules` queries and commands.
- Acceptance: a user sees only permitted organization scope; KPI values expose formula and timestamp; large exports paginate or run asynchronously; failed jobs are visible and retryable; reporting cannot alter a posted transaction.

## Traceability

## Detailed requirement blueprint

### FR-REPT-DETAIL — Define and Publish KPI

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: KPI, FormulaVersion, ReadModel, Dashboard, ReportDefinition, Filter, ExportJob, Schedule, ReportAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: all module KPIs, exception reports, audit and traceability exports.
- Integrations: module read ports/events, object storage, email/notification provider, BI tools.
- AI implementation blueprint: KpiService, ExportJobService, /api/v1/reports/*, report permissions, formula/scope/export tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-REPT-*`, `US-REPT-*`, and `AC-REPT-*` identifiers for detailed rules, stories, and evidence.
