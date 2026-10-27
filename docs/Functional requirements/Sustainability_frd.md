# Sustainability Functional Requirements

**Document ID:** FRD-SUSTAINABILITY  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-SUST-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Sustainability manages traceability evidence, certification scope, mass-balance records, regulatory attributes, due diligence, claims, and supporting documents for applicable materials and transactions.

## Current implementation status

**Overall status:** Not started as a dedicated module. Some quality, production, receiving, dispatch, and attachment features provide source data that could support future traceability and sustainability capabilities, but no dedicated sustainability capability implementation was identified.

| Area | Status | Evidence |
|---|---|---|
| Dedicated sustainability profile | Not started | No dedicated sustainability module identified |
| Certification and regulatory evidence | Not started | No dedicated implementation identified |
| Material traceability and mass balance | Planned | Related source records exist in receiving, production, quality, and dispatch |
| Due diligence and sustainability reporting | Not started | No dedicated implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-SUST-001` | Sustainability Profile | Configure certification, regulatory, and sustainability requirements by scope. |
| `PR-SUST-002` | Material Traceability | Trace material genealogy from source through production, storage, and dispatch. |
| `PR-SUST-003` | Certification Evidence | Record certificates, validity, scope, controls, and supporting evidence. |
| `PR-SUST-004` | Mass-Balance Accounting | Track configured certified, non-certified, input, output, and claim quantities. |
| `PR-SUST-005` | Due Diligence | Capture origin, supplier, risk, declaration, and review evidence. |
| `PR-SUST-006` | Sustainability Reporting | Produce scoped evidence and regulatory/certification reports. |

## Common requirements

- Certification schemes, standards, claims, material categories, mass-balance rules, evidence types, retention, and approval paths are configurable and versioned.
- Traceability uses immutable links to source lots, operations, movements, quality records, dispatches, and documents; it must not duplicate or silently rewrite operational history.
- Compliance and sustainability controls are enforced at the applicable transaction boundary and are auditable by tenant and organization scope.
- Confidential evidence requires tenant-scoped authorization, secure file handling, retention rules, and access audit.

## UI/API and acceptance baseline

- UI: sustainability profile, evidence, certificate, genealogy, mass-balance, due-diligence, and report workflows.
- API: versioned `/api/v1/sustainability-profiles`, `/traceability`, `/certificates`, `/mass-balance`, and `/due-diligence` resources.
- Acceptance: a report identifies source records and rule versions; expired certification cannot support a restricted claim; traceability cannot cross tenant boundaries; evidence access is authorized and audited; corrections preserve original records.

## Traceability

## Detailed requirement blueprint

### FR-SUST-DETAIL — Trace Material Genealogy and Claim Balance

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: Scheme, Certificate, SustainabilityProfile, Evidence, GenealogyProjection, Claim, MassBalanceLedger, DueDiligenceReview.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: certified volume, mass balance, origin, claim, certificate expiry, evidence completeness.
- Integrations: all operational modules, certification portals, document storage, reporting.
- AI implementation blueprint: TraceabilityService, MassBalanceService, /api/v1/sustainability/*, sustainability permissions, genealogy/expiry/claim tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-SUST-*`, `US-SUST-*`, and `AC-SUST-*` identifiers for detailed rules, stories, and evidence.
