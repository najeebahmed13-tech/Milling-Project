# Sales Functional Requirements

**Document ID:** FRD-SALES  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-SALES-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Sales manages customer demand, sales contracts, allocations, delivery commitments, and commercial status without directly posting inventory or finance transactions. It supports multiple tenants, companies, mills, products, currencies, customers, and contract policies.

## Current implementation status

**Overall status:** Partially implemented. The current system provides customer, supplier, sales-contract, delivery-request, purchasing, and sales-invoice screens/services. Full contract allocation, configurable settlement rules, multi-tenant enforcement, and controlled commercial posting are not yet complete.

| Area | Status | Evidence |
|---|---|---|
| Customer and supplier records | Partially implemented | `../../src/commercial/Customers.jsx`, `../../src/commercial/Suppliers.jsx` |
| Sales contracts | Partially implemented | `../../src/commercial/SalesContracts.jsx` |
| Delivery commitments | Partially implemented | `../../src/commercial/DeliveryRequests.jsx` |
| Invoicing | Partially implemented | `../../src/finance/SalesInvoices.jsx`, `../../server/salesInvoices.js` |
| Contract allocation and configurable settlement | Planned | No complete dedicated implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-SALES-001` | Customer Sales Master | Maintain authorized customers, delivery terms, currencies, and commercial profiles. |
| `PR-SALES-002` | Sales Contract | Create, approve, version, and manage customer sales contracts and lines. |
| `PR-SALES-003` | Contract Allocation | Reserve and reconcile contract quantities by product, period, and source mill. |
| `PR-SALES-004` | Delivery Commitment | Create and track delivery commitments against approved contract availability. |
| `PR-SALES-005` | Sales Price and Adjustment | Apply configured price, quality adjustment, and settlement rules. |
| `PR-SALES-006` | Sales Reporting | Report contract status, fulfillment, exposure, and exceptions. |

## Common requirements

- Every record is scoped to tenant, legal/operating company, and applicable mill or shared-service context.
- Contract status transitions, approvals, price rules, allocation periods, product definitions, UOMs, currencies, and tolerance policies are configurable and effective-dated.
- Sales must request inventory availability and dispatch posting through module interfaces; it must not update Inventory tables directly.
- Posted quantities and commercial settlements are corrected through controlled amendment or reversal with audit history.

## UI/API and acceptance baseline

- UI: customer and contract workspaces with line-level products, quantities, UOM, validity, approval state, allocations, and delivery commitments.
- API: versioned `/api/v1/sales-contracts`, allocation, commitment, and approval commands with tenant scope, idempotency, pagination, and standard errors.
- Acceptance: an authorized user can create and submit a valid contract; an unauthorized user cannot cross company or mill scope; over-allocation is rejected; duplicate commands are safely idempotent; posted history remains traceable.

## Traceability

## Detailed requirement blueprint

### FR-SALES-DETAIL — Maintain Sales Contract

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: Customer, SalesContract, ContractLine, Allocation, DeliveryCommitment, PriceRuleSnapshot, ContractAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: contract fulfillment, remaining quantity, overdue commitment, price/quality adjustment exposure.
- Integrations: inventory availability, dispatch, finance/ERP, customer document delivery.
- AI implementation blueprint: SalesContractService, AllocationService, /api/v1/sales-contracts, sales.contract.* permissions, contract/approval/isolation tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Each requirement expands to `BR-SALES-*` business rules, `US-SALES-*` user stories, UI/API contracts, and `AC-SALES-*` acceptance criteria as described in [`../Product_requirement.md`](../Product_requirement.md).
