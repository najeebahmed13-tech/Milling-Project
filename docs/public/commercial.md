# Phase 5 — Commercial and Procurement

## Scope Implemented

The current frontend prototype provides:

- Sales Contract listing and draft creation
- Purchase Contract listing and draft creation
- Explicit contract state transitions: Draft → Submitted → Approved → Active → Completed, with Rejected/Cancelled terminal states where valid
- Quantity summary: contracted, utilized, remaining
- Contract details drawer with actions
- Planning-only Delivery Orders linked to active Sales Contracts
- Controlled customer, supplier, material, and UOM selections
- Browser demo persistence only

The prototype does not post receiving, dispatch, inventory, or contractual utilization transactions.

## State Transition Matrix

| Current | Action | Permission | Preconditions | Next | Side effect |
|---|---|---|---|---|---|
| DRAFT | Submit | `sales.contract.submit` / `purchase.contract.submit` | Required party, material, quantity, UOM, validity | SUBMITTED | Audit event in backend phase |
| SUBMITTED | Approve | `*.contract.approve` | Valid submitted contract | APPROVED | Approval history |
| SUBMITTED | Reject | `*.contract.approve` | Valid rejection reason when policy is approved | REJECTED | Rejection history |
| APPROVED | Activate | `*.contract.approve` | Valid dates and configuration | ACTIVE | Eligible for planning/use |
| DRAFT/SUBMITTED/APPROVED/ACTIVE | Cancel | `*.contract.cancel` | No disallowed utilization; cancellation policy TBD | CANCELLED | Cancellation audit/reason TBD |
| ACTIVE | Complete | `*.contract.update` | Completion policy satisfied | COMPLETED | Completion history |

The browser implementation uses explicit transition functions rather than arbitrary status edits. Server authorization and database transaction enforcement are still required.

## Quantity Utilization

`quantitySummary()` derives utilized quantity from traceable allocation records rather than relying only on a mutable `used_quantity`. The demo allocation list is empty because the approved event for utilization is unresolved.

### Open business decision

**TBD — Delivery Order utilization timing:** determine whether a Delivery Order reserves quantity, consumes quantity, or remains planning-only until Dispatch. The current prototype deliberately keeps Delivery Orders planning-only and does not reduce remaining contract quantity.

Future purchase utilization boundary:

`Purchase Contract → FFB Receipt confirmation → ContractAllocation`

Future sales utilization boundary:

`Sales Contract → Delivery Order/Dispatch approved event → ContractAllocation`

## Validation

- Party, material, UOM, quantity, and validity dates are required.
- Quantity must be positive.
- Valid-until cannot precede valid-from.
- Delivery Orders require an active Sales Contract and an in-range planned date.
- Customer/supplier/material/UOM values are controlled selections in the current prototype.
- No pricing, tax, freight, discount, penalty, tolerance, or legal clause has been invented.

## Documents

PDF generation is not implemented in Phase 5 because document templates, legal wording, retention, and approval artifact requirements remain unresolved. The document architecture from Phase 2 remains the integration boundary.

## Future API Boundary

```text
GET  /api/v1/sales-contracts
POST /api/v1/sales-contracts
POST /api/v1/sales-contracts/{id}/submit
POST /api/v1/sales-contracts/{id}/approve
POST /api/v1/sales-contracts/{id}/cancel
GET  /api/v1/purchase-contracts
POST /api/v1/purchase-contracts
GET  /api/v1/delivery-orders
POST /api/v1/delivery-orders
```

All critical commands require tenant context, permission checks, optimistic concurrency, idempotency, and database transactions when the backend is connected.
