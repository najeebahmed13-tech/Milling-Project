# Production Functional Requirements

**Document ID:** FRD-PRODUCTION  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-PROD-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Production manages planning, route versions, batch scheduling, execution, inputs, outputs, by-products, losses, downtime references, and material genealogy. Route definitions are separate from route execution.

## Current implementation status

**Overall status:** Partially implemented. Production line, machine, station, routing, run, stage, quality-result, and production-inventory APIs are present. Full configurable mass-balance posting, inventory integration, genealogy, approvals, tenant isolation, and controlled reversal remain incomplete.

| Area | Status | Evidence |
|---|---|---|
| Lines, machines, and stations | Implemented in current prototype | `../../apps/api/production.js`, `../../src/production/ProductionSystem.jsx` |
| Route definitions and steps | Partially implemented | `../../apps/api/production.js` |
| Production runs and stage execution | Partially implemented | `../../apps/api/production.js`, `../../src/production/ProductionSystem.jsx` |
| Production quality capture | Partially implemented | `../../server/productionQuality.js`, `../../src/quality/ProductionQuality.jsx` |
| Mass-balance, genealogy, and transaction-safe inventory posting | Planned | No complete production posting implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-PROD-001` | Production Route | Define effective-dated process routes, operations, stations, machines, inputs, outputs, and parameters. |
| `PR-PROD-002` | Production Plan | Plan capacity, shifts, materials, and batches for an authorized mill and line. |
| `PR-PROD-003` | Batch and Operation Execution | Execute configured operations with state, operator, equipment, time, and quantity evidence. |
| `PR-PROD-004` | Input and Output Posting | Consume inputs and post products, by-products, losses, and genealogy through Inventory. |
| `PR-PROD-005` | Production Exception | Record configured downtime, loss, deviation, hold, and controlled correction reasons. |
| `PR-PROD-006` | Production Performance | Report throughput, yield, utilization, loss, downtime, and mass-balance indicators. |

## Common requirements

- Route, capacity, operation sequence, machine, shift, loss, output, and approval rules are configurable by mill/line and effective date.
- A batch executes against a route version snapshot so later master changes do not alter historical interpretation.
- Posting an operation validates state, source availability, quantities, quality holds, output configuration, and genealogy in one transaction.
- Production must not update Inventory tables directly and must support retry, concurrency conflict, and controlled reversal.

## UI/API and acceptance baseline

- UI: route master, plan board, batch execution, operation entry, exception, genealogy, and performance views.
- API: versioned `/api/v1/production-plans`, `/batches`, `/operations`, and post/reverse commands.
- Acceptance: an operation cannot execute out of sequence unless configured; unavailable input prevents posting; outputs and losses reconcile according to the active rule; a posted operation remains traceable to its route version, operators, equipment, and source lots.

## Traceability

## Detailed requirement blueprint

### FR-PROD-DETAIL — Execute and Post Production Operation

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: Route, RouteVersion, RouteStep, Plan, Batch, Operation, Input, Output, Loss, GenealogyLink, ProductionAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: yield, OER, loss, throughput, utilization, downtime, route variance, mass balance.
- Integrations: inventory, quality, maintenance, SCADA/PLC, sensors, sustainability.
- AI implementation blueprint: ProductionExecutionService, RouteSnapshotService, /api/v1/production/*, production permissions, state/mass-balance/integration tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-PROD-*`, `US-PROD-*`, and `AC-PROD-*` identifiers for detailed rules, stories, and evidence.
