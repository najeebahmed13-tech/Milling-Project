# Production Planning Business Rules

## 1. Purpose and ownership

Production Planning is the decision-support boundary that converts eligible demand and inventory position into versioned production plans. It does not execute production, post inventory, or replace Production Orders. The Production Planning module owns plan identity, planning-period calculations, demand allocation, approval/release lifecycle, plan-vs-actual reporting, and planning audit history.

The module is scoped by tenant, legal/operating company, mill/site, and—when configured—production line. All server rules in this document are authoritative; UI validation is only an interaction aid.

The design must support future process families such as palm oil, kernel, refinery, biodiesel, utilities, and other configurable manufacturing flows without hard-coding a single product, route, mill, or yield model.

## 2. Core terms

| Term | Meaning |
|---|---|
| Planning period | Inclusive date range and granularity (`MONTH`, `WEEK`, or `DAY`) used to calculate demand and supply position. |
| Demand source | An eligible, tenant-scoped demand record such as a Delivery Request line, Sales Contract allocation, forecast, or approved manual demand. |
| Supply source | Opening stock, available stock, reservations, approved production plans, and actual production/inventory postings. |
| Net requirement | Demand remaining after eligible stock, reservations, and already-planned quantity, plus the configured safety-stock requirement. |
| Plan line | Product/material-specific planning result with quantities, UOM, dates, source allocations, and risk status. |
| Release | An immutable planning decision that authorizes downstream Production Order creation or linkage. |
| Snapshot | Stored version of source data and planning assumptions used to preserve historical interpretation. |

## 3. Controlled values

1. Plan statuses are `DRAFT`, `PROPOSED`, `UNDER_REVIEW`, `APPROVED`, `PARTIALLY_RELEASED`, `RELEASED`, `COMPLETED`, `CLOSED`, and `CANCELLED`.
2. Valid transitions are configured by the lifecycle state machine and are enforced on the server.
3. Planning periods use `MONTH`, `WEEK`, or `DAY`; a period must have a valid inclusive start and end date.
4. Demand, stock, planned, actual, safety, and yield values must use an active Item/UOM configuration. Display labels must not be used as stable foreign-key references.
5. Risk statuses are derived (`HEALTHY`, `BELOW_SAFETY_STOCK`, `SHORTFALL_RISK`, `EXCESS_STOCK`) and are not user-entered.
6. Product type, planning method, yield method, safety-stock policy, calendar, and tolerance are configuration/master-data concerns, not code branches for one customer.

## 4. Business rules

### BR-PPLAN-001 — Tenant and operating scope

Every read, calculation, create, update, transition, release, and report query must apply tenant, company, mill/site, and applicable line scope. Cross-tenant or cross-mill source records must be rejected and never exposed.

### BR-PPLAN-002 — Plan identity and numbering

Each plan has a stable database ID and a unique business plan number within tenant, mill, and configured numbering scope. Number allocation must be transaction-safe and must not use count-plus-one logic. Retries must not create duplicate plans when an idempotency key is supplied.

### BR-PPLAN-003 — Planning-period validity

The period start and end are required, valid calendar dates, and the end cannot precede the start. Bucket generation must produce complete, non-overlapping, inclusive month/week/day buckets in the mill calendar/time zone.

### BR-PPLAN-004 — Demand eligibility

Only demand sources that are active/approved, tenant/mill scoped, not cancelled/closed, and have positive remaining quantity may be included. Remaining demand equals source quantity minus fulfilled quantity, existing valid allocations, and other approved commitments according to the configured policy.

### BR-PPLAN-005 — Demand consolidation

Eligible demand is consolidated by stable product/item ID, UOM, required date or configured bucket, mill/site, and applicable customer/contract dimensions. Display names must not be the grouping key when a stable ID exists. Every consolidated quantity retains source allocation links.

### BR-PPLAN-006 — Net requirement

For each plan line: `net requirement = max(0, gross demand - available stock - eligible reservations + safety stock - already planned quantity)`. The calculation must use normalized quantities in a compatible UOM and must retain its input snapshot.

### BR-PPLAN-007 — Planned quantity

Planned quantity must be non-negative, UOM-valid, and within configured tolerance/policy. A user may override the calculated quantity only when the request records the reason, actor, timestamp, and before/after values. Overrides never mutate source demand or stock.

### BR-PPLAN-008 — UOM and precision

Quantity conversions use the active UOM conversion policy. Incompatible UOMs fail with a meaningful domain error. Calculation precision is retained internally according to UOM configuration; presentation rounding must not change persisted quantities or reconciliation results.

### BR-PPLAN-009 — Yield and FFB/input requirement

Required input quantity is calculated only when a valid positive yield or configured process conversion exists. `required input = planned output / yield rate`. Invalid, zero, or negative yield values fail validation unless an explicitly configured alternate method is selected. Manual overrides are auditable.

### BR-PPLAN-010 — Inventory position

Planning reads inventory through the Inventory boundary and applies only eligible, tenant/mill-scoped, posted balances and reservations. It must not write inventory balances. Opening stock, available stock, reserved stock, and projected stock must be distinguishable.

### BR-PPLAN-011 — Projected stock and risk

Projected closing stock is calculated from opening stock plus planned/actual supply minus planned/actual consumption according to the selected view. Risk status is derived from safety stock and net-requirement policy. A plan cannot be marked healthy by manually editing its risk label.

### BR-PPLAN-012 — Plan lifecycle

Only valid state transitions are accepted. Approval requires the configured planning approval permission and records approver/time. Closed and cancelled plans are immutable except for controlled correction/reversal workflows. Rejected transitions leave the plan and audit history unchanged.

### BR-PPLAN-013 — Release and Production Order integration

Only approved or otherwise policy-authorized plans may be released. Release creates an auditable linkage to downstream Production Orders and does not silently create or edit orders. Released quantities cannot exceed the plan line quantity or eligible demand allocation without an explicit controlled exception.

### BR-PPLAN-014 — Plan-versus-actual

Actual values come from posted Production and Inventory records, not browser state or draft orders. Variance is `actual - planned`; remaining is never negative for display. Reports must identify the source posting period and UOM.

### BR-PPLAN-015 — Concurrency and stale data

Mutating commands must use a revision/version or equivalent optimistic-concurrency check. A stale plan update, approval, or release returns a conflict and does not overwrite newer work. Source data used for calculation must be snapshotted or revalidated inside the transaction.

### BR-PPLAN-016 — Audit and traceability

Create, edit, calculation override, allocation, submit, approve, release, cancel, close, correction, and authorization failure events are append-only and include tenant, mill, actor, entity, action, timestamp, request/idempotency reference, and changed values or source snapshot reference.

### BR-PPLAN-017 — Authorization

The API authorizes named actions at the server boundary. At minimum, planning read, create/edit, submit, approve, release, cancel/close, and report actions are distinct permissions. UI visibility is not an authorization control.

### BR-PPLAN-018 — Pagination and filtering

List and report APIs must support bounded pagination, validated sorting, period/status/product/mill filters, and stable ordering. No endpoint may load an unbounded plan, demand, stock, or audit collection by default.

### BR-PPLAN-019 — Failure atomicity

Plan creation, line creation, demand allocation, snapshot creation, and audit emission are one transaction. Validation, duplicate, conflict, source-unavailable, and persistence errors return stable error codes and leave no partial plan.

### BR-PPLAN-020 — Historical interpretation

A plan preserves the item/UOM, demand, inventory, route/yield, policy, and organizational context used at calculation and release time. Later master-data changes must not rewrite historical plan meaning.

## 5. API contract direction

The implementation will expose versioned DTOs and standard error envelopes for:

- `GET /api/v1/production-plans`
- `GET /api/v1/production-plans/context`
- `POST /api/v1/production-plans`
- `PATCH /api/v1/production-plans/:id`
- `POST /api/v1/production-plans/:id/submit`
- `POST /api/v1/production-plans/:id/approve`
- `POST /api/v1/production-plans/:id/release`
- `POST /api/v1/production-plans/:id/cancel`
- `GET /api/v1/production-plans/:id/audit`
- `GET /api/v1/production-plans/reports/plan-vs-actual`

Commands will accept an idempotency key and expected revision. Error responses will include a stable `code`, human-readable `message`, field errors where applicable, and correlation/request ID.

## 6. Executable mapping

| Rule range | Owning code boundary | Required automated coverage |
|---|---|---|
| BR-PPLAN-001, 017 | request context and authorization middleware | cross-tenant, missing permission, mill-scope tests |
| BR-PPLAN-002, 015, 019 | planning application service and persistence transaction | concurrent numbering, idempotent retry, stale revision, rollback tests |
| BR-PPLAN-003, 005–009, 011 | planning domain services | boundary quantity, date bucket, UOM, yield, rounding, risk tests |
| BR-PPLAN-004, 010, 020 | demand/inventory integration adapters | eligibility, reservation, source failure, snapshot tests |
| BR-PPLAN-012, 013, 016 | lifecycle/release application services | transition matrix, approval, release linkage, audit tests |
| BR-PPLAN-014, 018 | reporting query/application boundary | period filtering, pagination, actual-source, variance tests |

The rule IDs must be referenced by test names or test comments when the production implementation is added so that every rule has an executable verification path.

## 7. Initial acceptance criteria

### Plan creation

**Given** valid tenant, mill, period, eligible demand, and compatible stock/UOM data  
**When** an authorized planner submits a plan with a unique idempotency key  
**Then** one draft plan, its source allocations, calculation snapshot, revision, and audit event are committed atomically.

### Cross-tenant isolation

**Given** a plan or source record belonging to another tenant or mill  
**When** a user requests, calculates, updates, approves, or releases it  
**Then** the API returns a not-found or authorization response without exposing or mutating the record.

### Approval conflict

**Given** a planner has an outdated plan revision  
**When** the planner submits an approval or update  
**Then** the API returns a conflict and preserves the newer revision and audit history.

### Release boundary

**Given** a plan is not approved or contains an over-allocation  
**When** a user attempts release  
**Then** release is rejected, no Production Order linkage is created, and the rejection is auditable.

### Plan versus actual

**Given** a released plan and posted production/inventory records  
**When** an authorized user requests the report for a bounded period  
**Then** the report returns planned, actual, variance, remaining, UOM, source period, and risk values with pagination.

## 8. Current implementation gap baseline

The existing Phase-1 implementation provides useful domain helpers and draft/status endpoints, but the next implementation increment must address: versioned contracts, named server-side permissions, transaction-safe plan numbering, revision/concurrency control, explicit release records, source adapters for Delivery Requests and Inventory, UOM validation, immutable calculation snapshots, bounded pagination, and decomposition of the large planning UI into shared screens/components. Existing behavior must be preserved through migration-safe changes and regression tests.
