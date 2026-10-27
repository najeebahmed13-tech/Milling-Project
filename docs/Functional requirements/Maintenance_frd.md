# Maintenance Functional Requirements

**Document ID:** FRD-MAINTENANCE  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-MAINT-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Maintenance manages equipment masters, preventive plans, condition observations, work requests, work orders, downtime, parts references, and maintenance history for mills, lines, stations, machines, and storage units.

## Current implementation status

**Overall status:** Partially implemented. Machine health monitoring masters, monitoring requests, and related domain tests exist. Preventive maintenance plans, work orders, downtime lifecycle, parts/service tracking, and reliability reporting are not yet complete.

| Area | Status | Evidence |
|---|---|---|
| Machine health monitoring master | Partially implemented | `../../src/masters/MachineHealthMonitoringMaster.jsx` |
| Machine monitoring requests | Partially implemented | `../../src/maintenance/MachineMonitoringRequests.jsx` |
| Monitoring domain validation | Partially implemented | `../../tests/machine-monitoring-domain.test.js`, `../../tests/machine-health-domain.test.js` |
| Preventive plans, work orders, downtime, and reliability reporting | Planned | No complete dedicated implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-MAINT-001` | Equipment Register | Maintain hierarchical equipment, location, criticality, meter, and service history. |
| `PR-MAINT-002` | Maintenance Plan | Configure preventive, predictive, inspection, and calibration schedules. |
| `PR-MAINT-003` | Work Request and Order | Request, prioritize, approve, schedule, execute, and close maintenance work. |
| `PR-MAINT-004` | Downtime Event | Record equipment downtime, cause, start/end, impact, and configured reason. |
| `PR-MAINT-005` | Parts and Service Reference | Track planned and actual parts, services, vendors, and costs through approved interfaces. |
| `PR-MAINT-006` | Reliability Reporting | Report availability, downtime, preventive compliance, backlog, and recurring failures. |

## Common requirements

- Equipment hierarchy, criticality, maintenance strategy, intervals, tolerances, downtime reasons, approval paths, and work priorities are configurable by mill and effective date.
- Maintenance history is append-only for completed work; corrections use controlled amendment with audit evidence.
- Production may consume equipment availability and downtime events through an explicit interface; Maintenance does not alter production postings.
- Safety, permit, lockout/tagout, calibration, and statutory requirements must be represented as configurable controls where applicable.

## UI/API and acceptance baseline

- UI: equipment tree, plan calendar, requests, work orders, downtime capture, execution, and reliability dashboards.
- API: versioned `/api/v1/equipment`, `/maintenance-plans`, `/work-orders`, and `/downtime-events` resources.
- Acceptance: a work order follows configured states; only authorized roles can approve or close it; downtime links to valid equipment and mill scope; overdue planned work is observable; historical work remains auditable.

## Traceability

## Detailed requirement blueprint

### FR-MAINT-DETAIL — Execute Maintenance Work Order

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: Equipment, MaintenancePlan, WorkRequest, WorkOrder, Task, Permit, PartUse, DowntimeEvent, Calibration, MaintenanceAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: PM compliance, backlog, MTBF/MTTR, downtime, equipment availability, recurring failures.
- Integrations: production, inventory/spares, procurement, sensors/OEM, notifications.
- AI implementation blueprint: WorkOrderService, DowntimeService, /api/v1/maintenance/*, maintenance permissions, lifecycle/permit/history tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-MAINT-*`, `US-MAINT-*`, and `AC-MAINT-*` identifiers for detailed rules, stories, and evidence.
