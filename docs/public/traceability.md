# Phase 2 — Traceability, Validation, and Test Architecture

## Requirements to Architecture Matrix

| Requirement | Module | Entity/service | API/command | Permission | Test concern |
|---|---|---|---|---|---|
| TEN-FR-001 | Platform | TenantContext / Membership | `GET /me/context`, context switch | `tenant.read` | cross-tenant denial; mill access |
| TEN-FR-002 | Platform | Membership / RoleAssignment | `POST /memberships/{id}/roles` | `user.manage`, `role.manage` | last-admin and privilege escalation |
| COM-FR-001 | Master Data | Supplier | `POST /suppliers` | `supplier.create` | tenant uniqueness; inactive supplier |
| COM-FR-002 | Commercial | PurchaseContract | `POST /purchase-contracts/{id}/approve` | `purchase_contract.approve` | invalid state; concurrent balance |
| COM-FR-003 | Commercial | SalesContract / Fulfilment | `POST /sales-contracts/{id}/approve` | `sales_contract.approve` | over-allocation |
| FFB-FR-001 | Weighbridge | WeighbridgeTransaction | `POST /weighbridge-tickets` | `weighbridge.record` | server net calculation; duplicate ticket |
| FFB-FR-002 | Receiving | FFBReceipt / Grading / MaterialMovement | `POST /ffb-receipts/{id}/confirm` | `ffb_receipt.confirm` | atomic posting; reconciliation |
| FFB-FR-003 | Receiving/Inventory | MaterialLot / Genealogy | `GET /traceability/lots/{id}` | `ffb_lot.read` | split/merge lineage; tenant isolation |
| PROD-FR-001 | Planning | ProductionPlan / Batch | `POST /production-batches` | `production_plan.create` | capacity and available stock |
| PROD-FR-002 | Execution/Inventory | ProcessOperation / Movement | `POST /operations/{id}/post` | `production_operation.post` | atomic input/output; insufficient stock |
| QLTY-FR-001 | Quality | QualitySpecification | `POST /quality-specifications` | `quality_spec.manage` | overlapping versions |
| QLTY-FR-002 | Quality | Sample / TestResult | `POST /quality-samples/{id}/results` | `quality_sample.record` | active spec; hold/release policy |
| STOCK-FR-001 | Inventory | MaterialMovement / Balance | `POST /inventory/transfers` | `inventory.transfer` | ledger consistency; concurrency |
| DISP-FR-001 | Dispatch | Dispatch / Movement / Fulfilment | `POST /dispatches/{id}/post` | `dispatch.post` | quality hold; stock/contract atomicity |

## Test Architecture

- **Domain unit tests:** state transitions, quantity reconciliation, UOM rules, specification evaluation, idempotency decisions.
- **Application-service tests:** permission checks, transaction boundaries, event/outbox creation, error codes.
- **Database integration tests:** foreign keys, unique constraints, RLS policies, ledger/balance reconciliation, row locking.
- **API contract tests:** request validation, stable response/error format, pagination, optimistic concurrency.
- **Authorization tests:** every critical command with allowed, denied, wrong mill, wrong tenant, and wrong state cases.
- **E2E tests:** receipt, production, quality, transfer, dispatch, and tenant-isolation journeys.
- **Security/static checks:** dependency audit, secret scan, SAST, upload tests, header/CORS/CSRF checks.

## Architecture Walkthroughs

### Scenario A — FFB receipt

Supplier and purchase contract are owned by Commercial. Vehicle and weighbridge are owned by Master Data/Weighbridge. Receipt and grading are owned by Receiving. Confirmation calls Inventory to create FFB material lot and receipt/rejection movements. Contract fulfilment is committed in the same transaction. **Result: supported**, subject to approval of grading/reconciliation rules.

### Scenario B — Production

Eligible FFB lots are reserved through Inventory for a Production Batch. Each Process Operation references a versioned route stage and creates input/output movements. Genealogy edges connect consumed FFB lots to Fruitlets, Crude Oil, CPO, and downstream lots. **Result: supported**, with route connector confirmation pending.

### Scenario C — By-products

One operation can post multiple outputs and by-products: EFB, fibre, kernel, shell, sludge/recovered oil, and loss/waste. Each output gets a material lot and destination movement. **Result: supported**; engineering balance tolerances remain TBD.

### Scenario D — Quality

SamplingPlan schedules samples for a process point, tank, batch, or lot. Sample results evaluate against effective specifications and create pass/fail/out-of-spec state. Quality release policy can block dispatch. **Result: structurally supported**; exact bi-hourly calendar and hold policy pending.

### Scenario E — CPO dispatch

Sales contract and delivery order authorize dispatch. Dispatch loads released CPO inventory, references outbound weighing, locks stock and contract availability, posts a dispatch movement, and emits document work. **Result: supported**; legal document and weighing rules pending.

### Scenario F — Tenant isolation

Authenticated context derives tenant/mill scope; repositories and RLS enforce it. A Tenant A user cannot read or modify Tenant B records even with guessed IDs. **Result: design supported; must be proven by integration tests before release.**

### Scenario G — Concurrent contract usage

Contract line is locked during fulfilment allocation; a version/unique constraint prevents double consumption. One transaction succeeds and the other receives a conflict/quantity error. **Result: supported.**

### Scenario H — Duplicate posting

Critical commands require idempotency keys. A retry returns the original result and cannot create a second ledger movement. **Result: supported.**

## Seed Data Strategy

- **System seed:** permission catalog, system UOMs only when approved, workflow state codes, document types.
- **Development seed:** isolated tenant, mill, demo masters, and clearly marked demo transactions for local development only.
- **Test fixtures:** deterministic isolated tenants and transactions created per test; no production seed reuse.

Production deployments must never receive fabricated operational receipts, batches, quality results, or stock balances.

## Migration Strategy

Use forward, versioned migrations in dependency order: platform → masters → commercial/weighbridge → receiving → production → quality/inventory → dispatch → projections. Deploy additive schema changes first, backfill in controlled jobs, then enable code paths. Rollback is preferred through a forward corrective migration for destructive/posted data; never manually edit production schema as routine practice.
