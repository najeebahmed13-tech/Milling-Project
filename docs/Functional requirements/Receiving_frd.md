# Receiving Functional Requirements

**Document ID:** FRD-RECEIVING  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-RECV-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Receiving manages gate entry, vehicle and weighbridge references, supplier delivery, FFB receipt, grading, accepted/rejected reconciliation, and receipt posting. Weighbridge remains authoritative for gross, tare, and net measurements; Inventory owns resulting stock movements.

## Current implementation status

**Overall status:** Partially implemented. The current system includes FFB receiving, grading, second weighing, receiving slips, and receiving permission helpers. Full authoritative device integration, tenant isolation, atomic inventory posting, and controlled reversal require further implementation.

| Area | Status | Evidence |
|---|---|---|
| FFB receiving workflow | Partially implemented | `../../src/receiving/FFBReceiving.jsx` |
| FFB grading | Partially implemented | `../../src/receiving/FFBGrading.jsx`, `../../src/receiving/FfbGradingFormContent.jsx` |
| Second weighing and receipt slip | Partially implemented | `../../src/receiving/SecondWeighingFormDrawer.jsx`, `../../src/receiving/ReceivingSlip.jsx` |
| Receiving permissions and traceability helpers | Partially implemented | `../../modules/receiving/receiving.js` |
| Weighbridge device integration and controlled reversal | Planned | No complete implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-RECV-001` | Gate and Vehicle Entry | Record and control vehicle entry for an authorized mill. |
| `PR-RECV-002` | Weighment Reference | Capture or integrate authoritative gross, tare, net, device, and ticket data. |
| `PR-RECV-003` | FFB Delivery Receipt | Record a supplier delivery against a valid purchase reference or configured exception. |
| `PR-RECV-004` | FFB Grading | Apply the effective mill/product grading configuration and record results. |
| `PR-RECV-005` | Acceptance Reconciliation | Reconcile received, accepted, rejected, and adjusted quantities with reasons. |
| `PR-RECV-006` | Receipt Posting and Reversal | Post a traceable FFB lot and controlled reversal through Inventory. |

## Common requirements

- Every receipt is scoped to tenant, company, mill, vehicle, supplier, material, UOM, and applicable shift or time zone.
- Tolerances, grading attributes, rejection reasons, ticket numbering, offline buffering, and approval rules are configurable by applicable mill and effective date.
- Confirmation is atomic: validate weighment, grading, reconciliation, contract allocation, lot creation, inventory movement, state transition, audit, and outbox event together.
- A posted receipt cannot be silently edited or deleted.

## UI/API and acceptance baseline

- UI: gate, weighment, receipt, grading, reconciliation, posting, and reversal workflow with clear state and exception reasons.
- API: versioned `/api/v1/ffb-receipts` and commands for grade, confirm, and reverse; all commands require tenant scope, permission, idempotency, and concurrency checks.
- Acceptance: a valid receipt posts once; an invalid or duplicate ticket is rejected; accepted plus rejected quantity reconciles to the configured basis; cross-mill access is denied; a failed posting leaves no partial stock movement.

## Traceability

## Detailed requirement blueprint

### FR-RECV-DETAIL — Post and Reverse FFB Receipt

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: GateEntry, Weighment, FfbReceipt, GradeResult, RejectionReason, FfbLot, ReceiptAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: receiving queue, supplier quantity, accepted/rejected trend, weighbridge reconciliation.
- Integrations: weighbridge, procurement, quality, inventory, supplier invoice, offline buffer.
- AI implementation blueprint: ReceiptPostingService, WeighmentPort, GradeService, /api/v1/ffb-receipts, receiving permissions, reconciliation/retry tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-RECV-*`, `US-RECV-*`, and `AC-RECV-*` identifiers for detailed rules, stories, and evidence.
