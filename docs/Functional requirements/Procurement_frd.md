# Procurement Functional Requirements

**Document ID:** FRD-PROCUREMENT  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-PROC-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Procurement manages supplier purchasing, purchase contracts, direct purchase, commitments, and supplier delivery references. It does not own receiving, quality posting, inventory movement, or accounts payable settlement.

## Current implementation status

**Overall status:** Partially implemented. Purchase contracts, direct purchases, purchase invoices, and purchasing screens exist. Full commitment allocation, configurable approval policy, supplier performance, and transaction-safe receiving integration remain incomplete.

| Area | Status | Evidence |
|---|---|---|
| Purchase contracts | Partially implemented | `../../src/commercial/PurchaseContracts.jsx`, `../../server/purchaseContracts.js` |
| Direct purchases | Partially implemented | `../../src/commercial/Purchasing.jsx`, `../../server/purchases.js` |
| Purchase invoices | Partially implemented | `../../server/purchases.js` |
| Supplier master | Partially implemented | `../../src/commercial/Suppliers.jsx` |
| Commitment allocation and approval workflow | Planned | No complete dedicated implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-PROC-001` | Supplier Procurement Master | Maintain authorized supplier profiles, categories, terms, and risk references. |
| `PR-PROC-002` | Purchase Contract | Create, approve, version, and manage purchase contracts and lines. |
| `PR-PROC-003` | Direct Purchase | Record configured direct purchases from dealers or other approved sources. |
| `PR-PROC-004` | Purchase Commitment | Track committed quantities, prices, periods, and remaining availability. |
| `PR-PROC-005` | Supplier Delivery Instruction | Issue delivery instructions linked to approved purchase commitments. |
| `PR-PROC-006` | Procurement Reporting | Report commitments, supplier performance, price exposure, and exceptions. |

## Common requirements

- Supplier, material, UOM, contract, pricing, approval, and tolerance rules are tenant/company/mill scoped and configurable.
- Direct-purchase policies, required documents, duplicate detection, and approval thresholds are configuration, not hard-coded customer logic.
- Receiving references procurement commitments through an explicit interface and validates availability within a transaction.
- Changes to approved or posted purchasing records use controlled amendment or reversal and emit audit events.

## UI/API and acceptance baseline

- UI: supplier, contract, direct-purchase, commitment, and delivery-instruction workflows.
- API: versioned `/api/v1/purchase-contracts`, `/api/v1/direct-purchases`, and commitment commands with authorization, idempotency, and concurrency checks.
- Acceptance: approved commitments cannot be exceeded; an unauthorized user cannot approve their own restricted transaction; duplicate direct purchases are rejected or safely identified; every receiving reference resolves to an approved commitment or an explicitly configured exception.

## Traceability

## Detailed requirement blueprint

### FR-PROC-DETAIL — Maintain Purchase Contract

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: Supplier, PurchaseContract, PurchaseLine, DirectPurchase, Commitment, DeliveryInstruction, ProcurementAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: supplier commitments, delivery variance, purchase price exposure, overdue commitments.
- Integrations: receiving, finance/AP, risk/pricing engines, supplier notifications.
- AI implementation blueprint: PurchaseContractService, DirectPurchaseService, /api/v1/purchase-contracts, /api/v1/direct-purchases, procurement permissions, duplicate/idempotency/approval tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-PROC-*`, `US-PROC-*`, and `AC-PROC-*` identifiers for detailed rules, stories, and evidence.
