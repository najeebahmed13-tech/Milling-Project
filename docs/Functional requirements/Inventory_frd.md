# Inventory Functional Requirements

**Document ID:** FRD-INVENTORY  
**Parent:** Master Product PRD — Palm Oil Mill ERP + MES  
**Module prefix:** `PR-INV-*`  
**Status:** Baseline v1.0 — Draft

## Scope

Inventory manages material lots, stock ledger movements, balances, reservations, transfers, storage locations, tanks, warehouses, and controlled corrections for FFB, CPO, PK, and configurable by-products.

## Current implementation status

**Overall status:** Partially implemented. Item management, storage areas, and dispatch-related inventory views exist. A complete authoritative lot ledger, reservations, transfer workflow, tenant-scoped balances, and controlled reversals are not yet evidenced as a dedicated inventory implementation.

| Area | Status | Evidence |
|---|---|---|
| Item master | Partially implemented | `../../src/inventory/Items.jsx` |
| Storage areas | Partially implemented | `../../src/inventory/StorageAreas.jsx` |
| Dispatch inventory view | Partially implemented | `../../src/inventory/Dispatch.jsx` |
| Production inventory reference | Partially implemented | `../../apps/api/production.js` |
| Ledger, reservations, transfers, and reversal controls | Planned | No complete dedicated inventory ledger implementation identified |

## Functional requirement register

| ID | Functional requirement | Primary outcome |
|---|---|---|
| `PR-INV-001` | Material and Lot | Maintain traceable material lots with source, UOM, quality, and genealogy references. |
| `PR-INV-002` | Inventory Ledger Posting | Record immutable receipts, issues, transfers, production outputs, losses, and reversals. |
| `PR-INV-003` | Balance and Availability | Calculate tenant/mill/location-scoped balances and available quantity. |
| `PR-INV-004` | Reservation | Reserve and release stock for production, dispatch, quality, or other configured purposes. |
| `PR-INV-005` | Storage and Transfer | Move material between authorized locations, tanks, cages, silos, and warehouses. |
| `PR-INV-006` | Inventory Reconciliation | Identify, approve, and correct physical-to-system differences with audit evidence. |

## Common requirements

- Inventory is the sole owner of stock movements and balances; other modules use commands or interfaces.
- Lots, locations, tanks, UOM conversions, costing attributes, reservation policies, and negative-stock rules are configurable and versioned where historical interpretation matters.
- Ledger records are append-only. Correction uses reversal or compensating movement, preserving genealogy and original posting details.
- Posting locks relevant balances and is idempotent, transaction-safe, and tenant-scoped.

## UI/API and acceptance baseline

- UI: lot inquiry, balance, reservation, transfer, reconciliation, ledger, and reversal workflows with pagination and filters.
- API: versioned `/api/v1/inventory/movements`, `/lots`, `/reservations`, and `/transfers` commands and queries.
- Acceptance: insufficient available stock is rejected; duplicate posting returns the original result; a movement updates ledger and balance atomically; unauthorized cross-tenant queries return no data; reversal preserves the original record and audit trail.

## Traceability

## Detailed requirement blueprint

### FR-INV-DETAIL — Post Inventory Movement

- Actor/preconditions: authorized role for the module; required masters, scope, and prior state are valid.
- Trigger/inputs: business action, relevant identifiers, quantities/UOMs, configuration version, and idempotency key where the action mutates data.
- Processing/validation: enforce tenant/company/mill scope, active masters, state transition, concurrency, configured business rules, and transaction boundary.
- Output/state: transition only through allowed states; posted history is immutable and corrected by controlled reversal or amendment.
- Permission/audit: preparation, approval, posting, reversal, export, and administration are separately permissioned and audited.
- Exceptions: reject invalid scope, missing configuration, duplicate command, stale version, invalid quantity/UOM, unauthorized action, or partial integration failure.
- Acceptance: successful action produces the documented business outcome, audit event, and integration event atomically; retry is safe; failure leaves no partial posting.

### Data, UI, reporting, and integration

- Entities: Material, Lot, LedgerEntry, Balance, Reservation, StorageLocation, Tank, Transfer, InventoryAudit.
- UI: scoped listing with search/filter/pagination, create/edit/detail workflow, status timeline, validation/error/empty/loading states, attachments and audit where applicable.
- Reports: stock by lot/location, reserved/available, movement ledger, variance, aging.
- Integrations: receiving, production, quality holds, dispatch, finance costing, sustainability traceability.
- AI implementation blueprint: InventoryPostingService, BalanceLockPort, /api/v1/inventory/*, inventory permissions, ledger/concurrency/tenant tests.

### Detailed acceptance criteria

Given an authorized actor has valid master data and an applicable configuration version
When the actor submits a valid request
Then the server validates scope, permissions, state, and business rules
And the transaction is committed atomically with audit and event evidence.

Given an unauthorized, duplicate, stale, invalid, or cross-tenant request
When the actor submits the request
Then the server returns a standard error
And no unauthorized or partial business mutation occurs.

Use `BR-INV-*`, `US-INV-*`, and `AC-INV-*` identifiers for detailed rules, stories, and evidence.
