# Dispatch Functional Requirements

**Document ID:** FRD-DISPATCH  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-DISP-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Dispatch manages outbound orders, vehicle/loading references, outbound weighment, quality release checks, stock issue, documents, delivery handover, and controlled reversal.

## Current implementation status

**Overall status:** Partially implemented. Loading plans, dispatch workflow, outbound quality capture, seal/checklist details, and dispatch server services exist. Full contract allocation, authoritative outbound weighing, inventory posting, POD lifecycle, tenant isolation, and controlled reversal require completion.

| Area | Status | Evidence |
|---|---|---|
| Loading plans and dispatch workflow | Partially implemented | `../../src/logistics/LoadingPlans.jsx`, `../../src/logistics/dispatchWorkflow.js` |
| Dispatch inventory view | Partially implemented | `../../src/inventory/Dispatch.jsx` |
| Outbound quality and dispatch checks | Partially implemented | `../../src/logistics/LoadingPlans.jsx`, `../../src/quality/dispatch-quality.js` |
| Dispatch backend services | Partially implemented | `../../server/dispatch.js` |
| POD, atomic stock posting, and controlled reversal | Planned | No complete implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-DISP-001` | Dispatch Order | Create and approve dispatch orders against customer commitments. |
| `PR-DISP-002` | Loading Execution | Schedule and record loading by authorized mill, location, vehicle, product, and lot. |
| `PR-DISP-003` | Outbound Weighment | Capture authoritative outbound weighment and reconcile loaded quantity. |
| `PR-DISP-004` | Dispatch Quality Release | Enforce configured quality hold and release policy before posting. |
| `PR-DISP-005` | Dispatch Posting | Issue released stock, update commercial fulfillment, and create traceable documents atomically. |
| `PR-DISP-006` | Delivery and POD | Record delivery handover, proof of delivery, exceptions, and status. |

## Common requirements

- Customer, contract, product, lot, location, vehicle, quality release, document, tolerance, and approval rules are configurable by scope and effective date.
- Dispatch must validate commercial availability, released quality status, stock availability, outbound weighing, and permissions in one posting transaction.
- Inventory owns the stock issue; Commercial owns contract fulfillment; Documents owns document metadata and secure files.
- Posted dispatches are immutable and corrected only through controlled reversal or approved amendment.

## UI/API and acceptance baseline

- UI: dispatch order, allocation, loading, weighment, release check, posting, documents, POD, and reversal workflows.
- API: versioned `/api/v1/dispatches` commands for approve, load, post, reverse, and POD capture.
- Acceptance: unavailable or unreleased stock cannot dispatch; contract over-fulfillment is rejected; duplicate post returns the original result; a successful post creates stock, fulfillment, document, and audit outcomes atomically.

## Traceability

## Detailed requirement blueprint

### FR-DISP-DETAIL — Post Dispatch

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: DispatchOrder, Allocation, Load, OutboundWeighment, ReleaseCheck, Seal, DispatchDocument, POD, DispatchAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: dispatch queue, fulfillment, load variance, quality release, delivery exceptions, POD aging.
- Integrations: sales, inventory, quality, weighbridge, logistics/carrier, documents, notifications.
- AI implementation blueprint: DispatchPostingService, ReleasePolicyService, /api/v1/dispatches/*, dispatch permissions, stock/quality/idempotency tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-DISP-*`, `US-DISP-*`, and `AC-DISP-*` identifiers for detailed rules, stories, and evidence.
