# Quality Functional Requirements

**Document ID:** FRD-QUALITY  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-QUAL-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Quality manages parameters, specifications, sampling plans, observations, laboratory results, evaluations, holds, release decisions, deviations, and quality reporting across receiving, production, inventory, and dispatch.

## Current implementation status

**Overall status:** Partially implemented. Quality parameter masters, production checkpoints, observations, QC requests, and dispatch-quality capture exist. Full configuration versioning, generalized laboratory results, deviation lifecycle, hold enforcement across all inventory/dispatch paths, and quality reporting remain incomplete.

| Area | Status | Evidence |
|---|---|---|
| Quality parameters | Partially implemented | `../../src/masters/QualityParameterMaster.jsx`, `../../tests/quality-parameter-domain.test.js` |
| Production quality checkpoints and observations | Partially implemented | `../../src/quality/ProductionQuality.jsx`, `../../src/quality/QualityCheckpointForm.jsx` |
| QC requests | Partially implemented | `../../src/quality/QCRequests.jsx` |
| Dispatch quality capture | Partially implemented | `../../src/quality/dispatch-quality.js`, `../../src/logistics/LoadingPlans.jsx` |
| Deviations, generalized holds/releases, and quality reporting | Planned | No complete dedicated implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-QUAL-001` | Quality Parameter | Define measurable quality parameters, methods, units, precision, and classifications. |
| `PR-QUAL-002` | Quality Configuration | Configure effective-dated specifications, limits, sampling, methods, and release policies. |
| `PR-QUAL-003` | Quality Observation | Capture traceable samples, observations, test results, measurement points, and attachments. |
| `PR-QUAL-004` | Quality Evaluation | Evaluate results against the applicable specification and determine status. |
| `PR-QUAL-005` | Quality Deviation | Record, investigate, approve, contain, and close quality deviations with corrective actions. |
| `PR-QUAL-006` | Quality Reporting | Report trends, failures, holds, releases, deviations, and compliance evidence. |

## Common requirements

- Parameters, methods, specifications, limits, sampling plans, measurement points, release rules, and approval paths are configurable, scoped, effective-dated, and versioned.
- An active configuration must have an applicable specification and cannot overlap another active configuration where the policy forbids ambiguity.
- Quality holds and releases are server-enforced and respected by Inventory and Dispatch through explicit interfaces.
- Observations preserve sample identity, source lot/batch/receipt, equipment or measurement point when applicable, operator, method version, timestamp, result, unit, and audit history.

## UI/API and acceptance baseline

- UI: parameter, configuration, sample, observation, evaluation, deviation, hold/release, and report workflows.
- API: versioned `/api/v1/quality-configurations`, `/observations`, `/evaluations`, `/deviations`, and hold/release commands.
- Acceptance: an authorized Quality Manager can approve a valid configuration; incomplete or ambiguous configurations are rejected; a held lot cannot be dispatched; a failed evaluation keeps the configured hold state; release records specification version, approver, time, and audit event.

## Traceability

## Detailed requirement blueprint

### FR-QUAL-DETAIL — Evaluate Quality Observation

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: QualityParameter, Specification, SamplingPlan, Sample, Observation, Evaluation, Hold, Deviation, CAPA, QualityAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: quality trend, failure rate, hold aging, release turnaround, parameter compliance, deviation closure.
- Integrations: laboratory, production, receiving, inventory, dispatch, document storage.
- AI implementation blueprint: QualityEvaluationService, HoldReleaseService, /api/v1/quality/*, quality permissions, range/version/hold/isolation tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Detailed rules use `BR-QUAL-*`, stories use `US-QUAL-*`, and acceptance evidence uses `AC-QUAL-*`. Changes follow the controlled change process in [`../Product_requirement.md`](../Product_requirement.md).
