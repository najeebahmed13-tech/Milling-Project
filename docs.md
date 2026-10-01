# Palm Oil Mill ERP SaaS — Product & Technical Source of Truth

> **Product architecture directive:** ROCKEYE is a modular, configurable, scalable commercial ERP + MES product for small mills, medium operators, large enterprises, and multi-company conglomerates. All modules must support organizational hierarchy, tenant isolation, versioned configuration, extensible workflows, server-enforced permissions, auditability, and growth without customer-specific code forks. Repository implementation rules are maintained in [AGENTS.md](AGENTS.md).

**Status:** ERP+MES current-state assessment completed; implementation is a demo-backed Phase 3–6 prototype with the next gate identified below  
**Date:** 2026-09-30  
**Repository state:** Empty at discovery time; no application code, schema, migrations, tests, or deployment configuration found.

## 1. Product Overview

A multi-tenant ERP SaaS for palm oil mill operations. The product will provide traceability from supplier/customer contracts and FFB receiving through weighbridge, grading, production, quality, storage, dispatch, documents, and audit history.

The first delivery is a requirements baseline and design-system direction. Production implementation is intentionally deferred until the process-flow source and high-risk business rules are confirmed.

## 2. Scope

### In scope

- Tenant/company/mill configuration and user access
- Customers, suppliers, contracts, delivery orders
- FFB receiving, weighbridge, grading, acceptance/rejection, lot traceability
- Production planning, batches, process stages, material transformations
- Quality sampling and configurable specifications
- Inventory/material ledger for FFB, CPO, kernel, shell, EFB, fibre, sludge/recovered oil, and configured materials
- Storage, dispatch, operational documents, audit trail
- Role-relevant dashboards and reports

### Out of scope for the initial baseline

- Engineering formulas, extraction standards, quality limits, regulatory limits, or process tolerances not provided by an authoritative source
- Payroll, HR, maintenance CMMS, laboratory LIMS, fleet telematics, or general accounting beyond explicitly approved integrations
- Full implementation before requirements and source documents are approved

## 3. Discovery Findings (Phase 0)

### Inputs analyzed

1. Master prompt: `PALM OIL MILL ERP SAAS`.
2. ROCKEYE Milling Operations reference screenshot included in the request.
3. Repository contents.

### Process-flow source received

The supplied `SOH Process Flowchart 2023.pdf` is a one-page document titled **“Flow Chart Mill Process Solid or Liquid Holdings Sdn Bhd.”** It is treated as a business/process reference, not as a software-development instruction set. The labels below are confirmed source terms; the PDF does not by itself define engineering formulas, capacities, quality limits, reconciliation tolerances, or authorization rules.

### Confirmed process-flow labels from the PDF

**Equipment/process nodes:** Weighbridge, FFB Ramp, Loading Ramp, Sterilizing, Threshing, Fruitlets, EFB Press, EFB Storage, Digesting, Pressing, Dilution Tank, Sand Trap Tank, Vibrating Screen, Crude Oil Tank, Vertical Clarifier Tank, Pure Oil Tank, Vacuum Dryer, Sludge Tank 1, Sludge Tank 2, Sludge Pit, Reclaim Oil Tank, Decanter, Depericarping, Fibre Cyclone, Fibre Storage, Nut Silo, Ripple Mill, Destoner, Polishing, LTDS, Claybath, Kernel Silo, Kernel Bunker Storage, Shell Storage, Boiler, Condensate Pit, and dispatch points.

**Material/stream labels:** FFB, Fruitlets, EFB, EFB Juice, EFB Fibre, Crude Oil, Diluted Oil, Pure Oil, Oil, Sludge, Wet Kernel, Dry Kernel, Nuts, Nuts + Fibre, Cracked Mixture, Mesocarp Fibre, Fibre, Fine Shell, Shell, Stone, Condensate, Sterilizer Condensate, Fuel, Heavy Phase, Light Phase, Solid Phase, NOS, and reclaim oil.

**Explicit split/ratio labels:** `30% Dry Separation`, `70% Wet Separation`, and associated `30%`/`70%` labels appear in the nut/fibre separation area. Their exact calculation basis, control point, and whether they are design assumptions or observed operating targets are TBD.

The diagram is visually process-connected, but text extraction does not preserve every connector direction. The implementation must use the PDF visual layout as the authoritative route map during Phase 2 review; no material-balance formula should be inferred from label order alone.

### Reference UI observations

- White enterprise shell with a compact top navigation bar.
- ROCKEYE logo/wordmark and “Milling Operations” sub-label on the left.
- Global search centered in the header with an `ALL` scope selector.
- Primary modules represented by icon + short label: Home, Users, Customers, Vendors, Finance, Production, Stock, Configuration.
- Active module uses a pale red background, red top rule, and red icon/text.
- User avatar, name, and email appear on the right.
- Light gray breadcrumb strip below the header.
- Restrained color palette: white, very light gray, charcoal text, muted blue-gray icons, ROCKEYE red for active/attention states.
- Design direction: clean enterprise UI with restrained density; responsive behavior must adapt navigation, tables, forms, and drawers rather than merely scale them.

## 4. Glossary

| Term | Definition |
|---|---|
| Tenant | A logically isolated customer/account using the SaaS. |
| Mill | An operational palm oil mill belonging to a tenant. |
| FFB | Fresh fruit bunches received for processing. |
| FFB lot | Traceable accepted/rejected grouping created from a receiving transaction. |
| Weighbridge | Controlled weighing transaction capturing gross, tare, and net weight. |
| Grading | Quality/acceptance assessment of incoming FFB against configured rules. |
| CPO | Crude palm oil. |
| Kernel | Palm kernel output from nut processing. |
| EFB | Empty fruit bunch by-product. |
| VCT | Term used in the prompt for pure-oil/VCT quality monitoring; exact business meaning is TBD. |
| Process stage | Configurable transformation step such as sterilizing, threshing, pressing, or clarifying. |
| Production batch | Traceable execution unit consuming inputs and producing outputs/by-products/losses. |
| Material ledger | Immutable or controlled-correction record of material quantity movements. |
| Quality sample | Time-stamped observation of one or more parameters for a source, batch, lot, or tank. |
| Storage location | Configured physical or logical place where material is held. |
| Contract balance | Remaining quantity/value available under a purchase or sales contract. |
| Posted transaction | A transaction committed to operational ledgers and subject to controlled reversal/correction. |
| Bi-hourly | A scheduled quality-monitoring interval; exact interpretation and shift calendar are TBD. |

## 5. Actors and Roles

| Role | Primary responsibilities |
|---|---|
| Platform Administrator | Tenant provisioning, platform configuration, support-level administration. |
| Tenant Administrator | Tenant branding, mills, users, roles, numbering, master/configuration data. |
| Mill Manager | Operational oversight, approvals, exceptions, KPIs, reports. |
| Commercial Manager | Customers, suppliers, sales/purchase contracts, delivery orders. |
| Weighbridge Operator | Vehicle/delivery weighing, ticket issuance, receiving capture. |
| Receiving Clerk | FFB receipt, lot creation, grading coordination, rejection handling. |
| Grader/Quality Inspector | FFB grading and quality sampling/results. |
| Production Planner | Capacity, available FFB, batch and sterilizer planning. |
| Production Operator | Process-stage execution, input/output/by-product recording. |
| Storekeeper | Stock receipts, transfers, storage, adjustments, stock verification. |
| Dispatch Officer | Dispatch planning, loading, outbound weighbridge, documents. |
| Finance Officer | Commercial/financial review and approved finance-related postings; exact scope TBD. |
| Auditor/Read-only User | Search, reports, traceability, and audit review without mutation rights. |

Roles are tenant-scoped. A user may hold more than one role where permitted. Permission design must be action-specific, not only screen-specific.

## 6. Module Map

1. Home/Dashboard
2. Identity, tenant context, users, roles, permissions, sessions
3. Commercial: customers, suppliers, sales contracts, purchase contracts, delivery orders
4. FFB receiving: receiving, weighbridge, grading, rejection, lot traceability
5. Production planning: capacity, readiness, planning, batch creation, sterilizer batches
6. Production execution: process stages, material transformations, by-products, losses, process history
7. Quality: parameters, specifications, schedules, samples, results, alerts, certificates
8. Inventory/stock: materials, UOM, locations, tanks, ledger, transfers, adjustments, balances
9. Storage and dispatch: CPO, kernel, shell, by-products, loading, outbound weighing, dispatch
10. Configuration: mills, lines, process stages, numbering, document templates, grading/rejection masters
11. Documents: contracts, tickets, receiving/grading, quality reports, dispatch documents, PDFs
12. Reporting/audit: operational reports, traceability views, audit history, exception views

## 7. End-to-End Workflow

```text
Tenant/Mill setup
  → Customer/Supplier
  → Sales/Purchase Contract
  → Delivery Order / Supplier Delivery
  → Inbound Weighbridge (gross/tare/net)
  → FFB Receiving + Lot
  → Grading + Quality Assessment
  → Accepted / Partial / Rejected outcome
  → Available FFB inventory
  → Production Plan + Batch
  → Process stages and material movements
  → Outputs: CPO, kernel, EFB, fibre, shell, sludge/recovered oil, losses
  → Storage/tank/silo inventory
  → Quality sampling and release/hold status
  → Dispatch planning
  → Outbound weighing + dispatch document
  → Inventory posting + contract update
  → Audit trail and traceability
```

### PDF-confirmed production route (route map pending visual sign-off)

The flowchart confirms these connected process families:

1. **Receiving and sterilization:** Weighbridge → FFB Ramp / Loading Ramp → Sterilizing, with Sterilizer Condensate → Condensate Pit.
2. **Fruit and bunch separation:** Sterilizing → Threshing → Fruitlets and EFB; EFB → EFB Press → EFB Storage, with EFB Juice and EFB Fibre shown as streams.
3. **Oil line:** Fruitlets → Digesting → Pressing → Crude Oil → Dilution Tank → Sand Trap Tank → Vibrating Screen → Crude Oil Tank → Vertical Clarifier Tank → Pure Oil Tank → Vacuum Dryer → CPO Storage Tank → Oil Despatch.
4. **Sludge/recovery:** Clarification-related sludge is shown through Sludge Tank 1, Sludge Tank 2, Sludge Pit, Decanter, and Reclaim Oil Tank. Heavy Phase, Light Phase, Solid Phase, and reclaim-oil routing require visual/process-owner confirmation.
5. **Nut/fibre line:** Fruitlets/nut streams → Depericarping → Nuts + Fibre / Mesocarp Fibre → Fibre Cyclone / Fibre Storage and Nut Silo; fibre/fuel routing to Boiler is shown.
6. **Kernel and shell line:** Nut Silo → Ripple Mill → Cracked Mixture → Destoner / Polishing / LTDS / Claybath → Wet Kernel / Dry Kernel → Kernel Silo → Kernel Bunker Storage → Kernel Despatch; shell streams include Fine Shell and Shell Storage → Shell Despatch, with Stone also shown.
7. **Separation:** The chart explicitly labels 30% Dry Separation and 70% Wet Separation. Basis and ownership of these percentages are TBD.

The exact connector-level route, equipment sequencing, bypasses, and material reconciliation formulas require a visual process-owner walkthrough before they become executable production rules.

## 8. Core Entities and Relationships

### Tenant and access

- Tenant 1—N Mill
- Tenant 1—N User through UserTenant
- UserTenant N—N Role through RoleAssignment
- Role 1—N PermissionAssignment
- Tenant has isolated configuration, numbering, branding, and audit records

### Commercial and receiving

- Supplier 1—N PurchaseContract
- Customer 1—N SalesContract
- Contract 1—N DeliveryOrder / SupplierDelivery
- SupplierDelivery 1—1 or N WeighbridgeTicket according to approved workflow
- WeighbridgeTicket 1—1 ReceivingTransaction
- ReceivingTransaction 1—N FFBLot (supports partial acceptance/rejection)
- FFBLot N—N QualitySample
- FFBLot N—N ProductionBatch through material ledger movements

### Production and inventory

- ProductionPlan 1—N ProductionBatch
- ProductionBatch 1—N ProcessExecution
- ProcessExecution 1—N MaterialMovement
- MaterialMovement references source/destination, material, quantity, UOM, transaction, actor, and timestamp
- Material 1—N InventoryBalance by tenant/mill/location/tank
- MaterialMovement is the source of truth for stock history; balances are derived or transactionally maintained

### Quality and dispatch

- QualityParameter belongs to tenant/configuration and may have QualitySpecification versions
- QualitySample references source type/id, stage, batch/lot/tank, tester, timestamp, and results
- StorageUnit (location/tank/silo) contains material balances
- Dispatch 1—N DispatchLine and 1—N MaterialMovement
- Dispatch references Customer/SalesContract where applicable and outbound WeighbridgeTicket

### Cross-cutting

- Every business record includes tenant_id, identity fields, status, created/updated metadata, and audit references as applicable
- Posted records must use reversal/correction, not silent destructive edits

## 9. Major State Machines (Initial)

### Purchase contract

`DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → PARTIALLY_FULFILLED → FULFILLED`

Terminal/exception states: `REJECTED`, `CANCELLED`, `EXPIRED`.

### FFB receiving

`DRAFT → WEIGHED → GRADING_PENDING → ACCEPTED | PARTIALLY_ACCEPTED | REJECTED → POSTED`

Correction path: `POSTED → REVERSAL_PENDING → REVERSED`. No direct deletion after posting.

### Production batch

`PLANNED → READY → IN_PROGRESS → PAUSED → COMPLETED`

Exception/terminal states: `CANCELLED`, `ABORTED`, `REQUIRES_REVIEW`.

### Quality sample

`SCHEDULED → COLLECTED → IN_TEST → PASSED | FAILED | OUT_OF_SPEC | CANCELLED`

Exact release/hold effect on inventory is TBD.

### Dispatch

`DRAFT → APPROVED → LOADING → WEIGHED → POSTED → COMPLETED`

Exception states: `ON_HOLD`, `CANCELLED`, `REVERSED`.

Transitions require authorization, valid prerequisites, optimistic-concurrency protection, and audit events.

## 10. Master and Configuration Data

Tenant, company, mill, user, role, permission, customer, supplier, supplier type, material, product, by-product, UOM, storage location, tank, silo, production line, mill capacity, process stage, process route, quality parameter, quality specification, grading parameter, rejection reason, vehicle, transporter, contract term, numbering sequence, document template, shift/calendar, sampling schedule, approval policy, and status-reason masters.

Tenant-specific operational values must be configurable and versioned where changes affect historical interpretation.

## 11. Initial Functional Requirements Backlog

These are Phase 1 INVEST-sized stories. IDs are stable and will be expanded before implementation.

### Foundation

#### TEN-FR-001 — Resolve tenant context

- **Actor:** Authenticated user
- **Story:** As a user, I want the system to resolve my active tenant and mill context so that every screen and transaction is scoped correctly.
- **Value:** Prevents cross-tenant access and ambiguous operations.
- **Preconditions/trigger:** Valid session; user has one or more tenant assignments; user signs in or switches context.
- **Rules/validation:** Active tenant/mill must be assigned and enabled; all reads/writes must include tenant scope.
- **Permissions/audit:** Context switching permitted only for assigned contexts; log context changes.
- **Acceptance criteria:**
  - **Scenario:** Resolve assigned context — **Given** an enabled user assignment **When** the user opens the application **Then** the system selects an assigned tenant and mill context and scopes data to it.
  - **Scenario:** Reject unassigned context — **Given** a context is not assigned to the user **When** the user requests it **Then** access is denied and the attempt is audited.
- **Test cases:** valid assignment, disabled tenant, cross-tenant identifier, concurrent context switch.
- **DoD:** service/API tests, authorization test, tenant-isolation test, docs updated.

#### TEN-FR-002 — Manage tenant-scoped users and roles

- **Actor:** Tenant Administrator
- **Story:** As a tenant administrator, I want to assign users to roles so that access follows least privilege.
- **Value:** Controlled operational access.
- **Rules/validation:** Unique user identity; role must belong to tenant; cannot remove the last tenant administrator without replacement.
- **Acceptance criteria:**
  - **Scenario:** Assign a role — **Given** an authorized administrator and active user **When** a tenant role is assigned **Then** permissions apply within that tenant and the change is audited.
  - **Scenario:** Unauthorized assignment — **Given** a non-administrator **When** role assignment is attempted **Then** it is rejected without changing access.
- **Test cases:** valid assignment, duplicate assignment, cross-tenant role, last-admin protection.

### Commercial

#### COM-FR-001 — Maintain suppliers and supplier types

- **Actor:** Commercial Manager
- **Story:** As a commercial manager, I want to maintain estate/dealer suppliers so that receipts can be traced to the correct source.
- **Value:** Accurate supplier and contract traceability.
- **Rules/validation:** Supplier type is required; tenant-scoped supplier code is unique; inactive suppliers cannot start new contracts.
- **Acceptance criteria:**
  - **Scenario:** Create an estate supplier — **Given** valid required fields **When** the user saves **Then** the supplier is active, tenant-scoped, and auditable.
  - **Scenario:** Duplicate code — **Given** an existing code in the tenant **When** it is reused **Then** the system rejects the save with a corrective message.
- **Test cases:** estate, dealer, duplicate code, inactive supplier, cross-tenant lookup.

#### COM-FR-002 — Approve a purchase contract

- **Actor:** Commercial Manager / approver
- **Story:** As an authorized approver, I want to approve a purchase contract so that deliveries can consume its available balance.
- **Value:** Controlled procurement commitments.
- **Rules/validation:** Supplier, material, UOM, effective dates, and contract quantity/terms required; approval cannot occur after expiry or from an invalid state.
- **Acceptance criteria:**
  - **Scenario:** Approve valid draft — **Given** a complete draft **When** an authorized approver approves it **Then** status becomes APPROVED, an audit event is recorded, and its balance becomes available.
  - **Scenario:** Invalid approval transition — **Given** a cancelled contract **When** approval is attempted **Then** the transition is rejected.
- **Test cases:** happy path, missing quantity, expired dates, unauthorized approval, duplicate concurrent approval.

#### COM-FR-003 — Maintain customers and sales contracts

- **Actor:** Commercial Manager
- **Story:** As a commercial manager, I want to maintain customers and approved sales contracts so that dispatches are commercially controlled.
- **Value:** Contract-linked dispatch traceability.
- **Acceptance criteria:**
  - **Scenario:** Activate a sales contract — **Given** valid customer, product, quantity, terms, and dates **When** approved **Then** the contract becomes active and available for delivery-order allocation.
  - **Scenario:** Over-allocate — **Given** insufficient remaining balance **When** a delivery order exceeds it **Then** the system rejects the transaction and leaves the balance unchanged.
- **Test cases:** valid contract, over-allocation, expired contract, unauthorized approval, concurrent allocation.

### FFB receiving

#### FFB-FR-001 — Record an inbound weighbridge ticket

- **Actor:** Weighbridge Operator
- **Story:** As a weighbridge operator, I want to record gross and tare weights so that net delivered FFB quantity is controlled.
- **Value:** Reliable receiving quantity and ticket traceability.
- **Rules/validation:** Gross and tare required; gross must be greater than or equal to tare; vehicle/ticket identity unique per configured sequence; unit and scale source required.
- **Acceptance criteria:**
  - **Scenario:** Record valid weighing — **Given** a known vehicle and valid gross/tare **When** the operator saves the ticket **Then** net is calculated as gross minus tare, the ticket is WEIGHED, and the action is audited.
  - **Scenario:** Invalid weights — **Given** tare exceeds gross **When** the ticket is saved **Then** the system rejects it and explains the correction.
- **Test cases:** valid weights, equal weights, tare greater than gross, duplicate ticket, unauthorized operator.

#### FFB-FR-002 — Grade and accept an FFB delivery

- **Actor:** Grader / Receiving Clerk
- **Story:** As an authorized grader, I want to record grading outcomes so that accepted and rejected quantities are traceable.
- **Value:** Controlled FFB acceptance and downstream availability.
- **Rules/validation:** Grading parameters and rejection reason are configurable; accepted + rejected + other disposition must reconcile to net quantity; posting requires a valid supplier/contract link where required.
- **Acceptance criteria:**
  - **Scenario:** Accept a delivery after grading — **Given** a WEIGHED delivery and valid grading result **When** the authorized user confirms acceptance **Then** the system stores accepted quantity, creates an FFB lot and receipt movement, updates the contract balance, changes status to POSTED, and audits the action.
  - **Scenario:** Partial rejection — **Given** accepted and rejected quantities reconcile to net **When** the user posts the result **Then** separate dispositions and rejection reason are stored.
  - **Scenario:** Reconciliation failure — **Given** dispositions do not equal net weight **When** posting is attempted **Then** the system rejects the post and creates no inventory movement.
- **Test cases:** full acceptance, partial rejection, full rejection, quantity mismatch, missing reason, duplicate post, unauthorized post, concurrent post.

#### FFB-FR-003 — Trace an FFB lot forward

- **Actor:** Mill Manager / Auditor
- **Story:** As an authorized reviewer, I want to trace an FFB lot through batches and outputs so that material provenance is explainable.
- **Value:** Operational, quality, and audit traceability.
- **Acceptance criteria:**
  - **Scenario:** Trace a posted lot — **Given** a lot with downstream movements **When** the user opens traceability **Then** the system shows source contract/supplier, receiving, grading, consuming batch, outputs, storage, and dispatch links.
  - **Scenario:** No downstream movement — **Given** an available lot **When** traceability is opened **Then** the system shows the source and current balance with an empty downstream state.
- **Test cases:** one batch, split consumption, reversed movement, unauthorized tenant access.

### Production and material ledger

#### PROD-FR-001 — Create a production plan and batch

- **Actor:** Production Planner
- **Story:** As a production planner, I want to plan eligible FFB against mill capacity and create a batch so that execution is scheduled and traceable.
- **Value:** Controlled conversion of available FFB into production work.
- **Rules/validation:** Eligible stock, capacity, date/shift/line, and route required; planned quantity cannot exceed eligible available quantity or configured capacity unless an approved override exists.
- **Acceptance criteria:**
  - **Scenario:** Create a valid batch — **Given** available FFB and configured capacity **When** the planner confirms a plan **Then** a PLANNED batch is created with planned inputs, line, route, date, and audit event.
  - **Scenario:** Exceed capacity — **Given** planned quantity above capacity **When** save is attempted **Then** the system rejects it or requires the configured override permission.
- **Test cases:** valid batch, insufficient stock, over-capacity, inactive line, duplicate plan/concurrency.

#### PROD-FR-002 — Post a process execution with material movements

- **Actor:** Production Operator
- **Story:** As a production operator, I want to record process inputs, outputs, by-products, and losses so that production is represented as traceable material movements.
- **Value:** End-to-end inventory and process traceability.
- **Rules/validation:** Batch must be READY/IN_PROGRESS; material/UOM/source/destination required; available input stock must be sufficient; quantities must satisfy approved reconciliation rules once defined.
- **Acceptance criteria:**
  - **Scenario:** Post a valid execution — **Given** an active batch and available inputs **When** the operator records an execution **Then** input consumption and outputs/by-products/losses are posted atomically, stock updates, and audit history is recorded.
  - **Scenario:** Insufficient input — **Given** input stock below requested quantity **When** posting is attempted **Then** no movement is posted and the user receives a corrective message.
- **Test cases:** valid execution, insufficient stock, invalid state, partial failure/transaction rollback, duplicate post, unauthorized user.

### Quality

#### QLTY-FR-001 — Configure a quality parameter and specification

- **Actor:** Tenant Administrator / Quality Manager
- **Story:** As a quality manager, I want versioned parameters and specifications so that sampling rules are configurable without code changes.
- **Value:** Tenant-specific quality control.
- **Acceptance criteria:**
  - **Scenario:** Activate a specification — **Given** a parameter, unit, limits/rule, and effective date **When** authorized user activates it **Then** it is used for eligible future samples and historical versions remain readable.
  - **Scenario:** Overlapping active versions — **Given** an active specification for the same scope and effective period **When** another overlapping version is saved **Then** the system rejects it.
- **Test cases:** valid version, overlap, missing unit, expired version, unauthorized change.

#### QLTY-FR-002 — Record a quality sample and result

- **Actor:** Quality Inspector
- **Story:** As a quality inspector, I want to record timestamped sample results against a lot, batch, tank, or process point so that quality status is auditable.
- **Value:** Detect and manage out-of-spec material.
- **Rules/validation:** Source and parameter required; value must match unit/type; tester and timestamp required; pass/fail calculated from active specification when configured.
- **Acceptance criteria:**
  - **Scenario:** Record an in-spec result — **Given** a scheduled or permitted sample and active specification **When** a valid result is saved **Then** the result is stored with PASS status and linked to source and tester.
  - **Scenario:** Out-of-spec result — **Given** a value outside the active limit **When** saved **Then** status is OUT_OF_SPEC, an alert/hold behavior follows configured policy, and the event is audited.
- **Test cases:** pass, fail, missing source, wrong unit, no active spec, unauthorized entry, duplicate scheduled sample.

### Stock and dispatch

#### STOCK-FR-001 — Record a stock transfer

- **Actor:** Storekeeper
- **Story:** As a storekeeper, I want to transfer material between configured locations so that stock location and quantity remain accurate.
- **Value:** Reliable storage visibility.
- **Rules/validation:** Source and destination differ and are active; source balance sufficient; material/UOM compatible; posting atomic.
- **Acceptance criteria:**
  - **Scenario:** Transfer available stock — **Given** sufficient source balance **When** an authorized storekeeper posts a transfer **Then** source decreases, destination increases, and a ledger entry is created.
  - **Scenario:** Insufficient balance — **Given** insufficient source stock **When** posting is attempted **Then** no balance changes occur.
- **Test cases:** valid transfer, same location, insufficient stock, inactive destination, concurrent transfer.

#### DISP-FR-001 — Dispatch approved finished material

- **Actor:** Dispatch Officer
- **Story:** As a dispatch officer, I want to dispatch approved CPO/kernel/shell or configured finished material against a valid sales contract so that outbound stock and commercial balances remain aligned.
- **Value:** Controlled, traceable outbound movement.
- **Rules/validation:** Contract active and balance available; material released where quality policy requires; loading and outbound weighing complete; dispatch quantity available.
- **Acceptance criteria:**
  - **Scenario:** Complete a valid dispatch — **Given** approved contract, released material, available stock, and valid outbound weights **When** the dispatch is posted **Then** stock and contract balances reduce atomically, a dispatch document is generated, and audit history is recorded.
  - **Scenario:** Dispatch on hold material — **Given** quality status HOLD/OUT_OF_SPEC and no override **When** posting is attempted **Then** it is rejected with the reason.
- **Test cases:** valid dispatch, insufficient stock, contract overrun, quality hold, invalid weights, duplicate post, unauthorized dispatch.

## 12. Permission Matrix (Initial)

| Capability | Tenant Admin | Mill Manager | Commercial | Weighbridge | Grader/Quality | Planner | Production | Storekeeper | Dispatch | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Tenant/configuration | R/W | R | R | - | R | R | R | R | R | R |
| Users/roles | R/W | R | - | - | - | - | - | - | - | R |
| Customers/suppliers/contracts | R/W | Approve/R | R/W | R | R | R | R | R | R | R |
| Weighbridge | R/W | Approve/R | R | R/W | R | R | R | R | R | R |
| Grading/quality | R/W | Approve/R | R | R | R/W | R | R | R | R | R |
| Production plans/batches | R/W | Approve/R | R | R | R | R/W | R/W | R | R | R |
| Material ledger/stock | R/W | Approve/R | R | R | R | R | R | R/W | R | R |
| Dispatch | R/W | Approve/R | R/W | R | R | R | R | R | R/W | R |
| Audit/reporting | R/W | R | R | R | R | R | R | R | R | R |

`R` = read, `W` = create/edit within policy, `Approve` = approve/post/override where specifically granted. Final matrix must be action-level and tenant-scoped.

## 13. Dashboard KPI Definitions (Initial)

Only metrics with approved source and formula may be implemented.

| Metric | Formula | Source | Filters | Refresh |
|---|---|---|---|---|
| FFB received | Sum of posted accepted FFB receipt quantities | Posted receiving/material ledger | Tenant, mill, date, supplier | Near real-time or documented cache |
| FFB rejected | Sum of posted rejected FFB dispositions | Receiving/grading records | Tenant, mill, date, reason | Near real-time |
| CPO production | Sum of posted CPO process outputs | Material ledger | Tenant, mill, date, batch | Near real-time |
| Current stock | Ledger-derived balance by material/location | Material ledger | Tenant, mill, material, location | Transactional/near real-time |
| Pending quality samples | Scheduled samples not collected or completed | Quality schedule/sample tables | Tenant, mill, shift/date | Near real-time |
| Dispatch status | Count/quantity by dispatch state | Dispatch tables | Tenant, mill, customer, date | Near real-time |

Extraction rate, utilization, planned-vs-actual, and quality trend KPIs remain TBD until formulas and authoritative source data are approved.

## 14. Business, System, and Validation Rules

### Confirmed from the prompt

- Tenant isolation and server-side authorization are mandatory.
- Critical inventory, quality, weighbridge, contract, production, and dispatch records are auditable.
- Material movements require material, quantity, UOM, source, destination, timestamp, reference, and responsible user.
- Invalid stock movements must be blocked server-side.
- Posted transactions use controlled reversal/correction rather than silent deletion.
- Quality rules and limits must be configurable where appropriate.

### Initial system rules

- Every tenant-scoped query includes tenant context derived from the authenticated session, never only from a client-provided filter.
- Multi-record posts use a database transaction and fail atomically.
- State transitions are explicit and server-validated.
- Unique numbering is tenant/mill scoped and concurrency-safe.
- Historical configuration versions remain available for interpreting historical records.
- All list screens support loading, empty, error, search/filter, and pagination states.

### Validation message standard

Messages identify the field/business object, explain the problem, and tell the user how to correct it. Technical exception details are logged securely, not exposed to end users.

## 15. Security and Audit Baseline

- Tenant-aware authorization at API/service and data-access boundaries.
- RBAC with least privilege and explicit posting/approval permissions.
- Secure session/token handling, password hashing if local credentials are used, CSRF/XSS/injection protections, rate limiting where appropriate, security headers, safe uploads, and encrypted transport.
- Audit events for creation, edits to sensitive fields, approvals, rejections, status transitions, postings, reversals, permission changes, context switches, and failed authorization attempts.
- Audit records include actor, tenant, timestamp, action, entity/reference, old/new values where appropriate, and correlation/transaction reference.

## 16. Architecture Decisions Required Before Phase 2

1. **Application shape:** Recommended modular monolith with clear domain modules; avoid premature microservices.
2. **Runtime/database:** Choose framework, relational database, migration tool, object storage, and background-job approach.
3. **Tenant isolation:** Decide shared schema with mandatory tenant keys versus schema/database per tenant; document migration and backup implications.
4. **Identity:** Decide external identity provider versus local auth and required MFA/SSO.
5. **Weighbridge integration:** Decide manual capture, device/API integration, or staged adapter.
6. **Accounting integration:** Confirm whether finance is operational only or must post to an accounting system.
7. **Units/precision:** Confirm weight units, decimal precision, timezone, currency, and rounding policy.
8. **Quality release policy:** Define which failed/held results block storage or dispatch and who can override.
9. **Process model:** Approve the actual process-flow PDF, routes, stages, and material reconciliation rules.
10. **Document/legal requirements:** Confirm mandatory fields, numbering, signatures, tax/legal content, and PDF retention.

## 17. Assumptions

- **ASSUMPTION:** The product is browser-based SaaS with desktop-first enterprise workflows and responsive tablet/mobile support.
- **ASSUMPTION:** One tenant may operate multiple mills; mill is the primary operational scope below tenant.
- **ASSUMPTION:** A relational database is appropriate for transactional integrity and ledger relationships.
- **ASSUMPTION:** The ROCKEYE screenshot is visual direction, not a pixel-perfect specification or complete navigation inventory.
- **ASSUMPTION:** The initial dashboard uses only verified ledger/transaction sources and avoids fabricated values.

## 18. Open Questions / TBDs

1. Confirm whether `SOH Process Flowchart 2023.pdf` is the authoritative mill production-process source, and complete a visual process-owner walkthrough of all connector directions and bypasses.
2. What country/jurisdiction, currency, timezone, tax, weighing, and document requirements apply?
3. What are the exact FFB grading parameters, acceptance rules, and rejection reasons?
4. What does VCT mean in this operation, and which pure-oil parameters/specifications apply?
5. What are approved input/output reconciliation rules for each process stage?
6. Are quantities mass-only, or also volume/count/energy? What UOM conversion rules apply?
7. Are contracts quantity-based, value-based, or both? How are pricing, deductions, and partial deliveries handled?
8. What quality results place material on hold, and what approvals release it?
9. How are shifts, holidays, bi-hourly sampling schedules, and downtime represented?
10. What weighbridge hardware/API and offline behavior are required?
11. Which users can approve, post, reverse, or override transactions?
12. Which operational finance functions are required, and what external accounting system is involved?
13. What retention, export, backup, and audit-log immutability requirements apply?
14. What are target volumes, concurrency, availability, and performance SLOs?

## 19. Change Log

| Date | Change |
|---|---|
| 2026-09-30 | Created Phase 0 discovery and Phase 1 requirements baseline from master prompt and ROCKEYE reference screenshot. Recorded missing process-flow PDF, initial glossary, actors, module map, workflow, entities, state machines, backlog, security baseline, assumptions, and open questions. |
| 2026-09-30 | Analyzed supplied `SOH Process Flowchart 2023.pdf`; recorded confirmed process/equipment/material labels, route families, 30%/70% separation labels, and remaining visual/engineering TBDs. |

## 20. Recommended Next Phase

Phase 2 should begin only after the process-flow PDF and high-risk questions above are resolved. It should produce the approved architecture, tenant model, ERD/schema, audit model, state/transaction model, material ledger design, quality model, API conventions, and ADRs. After that gate, Phase 3 can implement the ROCKEYE-inspired application shell and reusable design system.

## 21. First Version Implementation (Phase 3 Foundation)

The first browser-based software version is implemented as a lightweight Vite frontend prototype because the repository had no existing application stack.

### Implemented

- ROCKEYE-inspired responsive top navigation, global search, profile area, breadcrumb, active module state, and mobile navigation.
- Operational dashboard with FFB received, CPO produced, mill utilization, quality samples, process overview, attention items, recent receiving, and stock snapshot.
- Production view aligned to the SOH process families with batch progress, route stages, and by-product summary.
- Receiving, Stock, Quality, and Dispatch listing screens with search, tabs, status badges, pagination shell, and empty state.
- Reusable record detail drawer with status, details, timeline, and actions.
- Responsive layouts for desktop, tablet, and mobile widths.
- Demo-only interactions: module navigation, search filtering, date-range toggle, detail drawer, and staged create actions.
- Functional first receiving flow: gross/tare capture, automatic net calculation, client validation, `WEIGHED`-equivalent `Grading` record creation, and browser persistence using local storage.

### Demo-data boundary

The current UI uses clearly identifiable demo data, with newly created receiving tickets persisted only in the browser's local storage. It does not yet provide authentication, tenant isolation, server-side authorization, a server database, migrations, real weighbridge integration, material-ledger posting, quality rules, or production APIs. Those are required before operational use.

### Run and verify

```text
npm install
npm run dev
npm run build
```

The production build was verified successfully on 2026-09-30. The local dev server responded successfully at `http://localhost:5173/`.

### Files

- `index.html` — application entry point
- `src/app.js` — UI state, navigation, demo data, views, and interactions
- `src/styles.css` — responsive design system and ROCKEYE-inspired visual language
- `package.json` — Vite scripts and build dependency

## 22. Change Log (Implementation)

| Date | Change |
|---|---|
| 2026-09-30 | Implemented the first ROCKEYE-inspired browser application shell and operational prototype with dashboard, production, receiving, stock, quality, dispatch, responsive layout, search, and detail drawer. Verified `npm run build` and local dev-server response. |
| 2026-09-30 | Added the first working receiving transaction form with gross/tare validation, calculated net weight, new record creation, and browser persistence. Verified `npm run build`. |

## 23. Phase 2 Architecture Documents

The Phase 2 architecture package is split into focused documents:

- [Solution Architecture](docs/architecture.md)
- [Logical Data Model](docs/data-model.md)
- [Security and Threat Model](docs/security.md)
- [Permission Architecture](docs/permissions.md)
- [Traceability, Validation, and Test Architecture](docs/traceability.md)
- [Coding Standards & Disciplined Vibe Coding](docs/coding-standards.md)
- [ADR-001 — Modular Monolith](docs/adr/ADR-001-modular-monolith.md)
- [ADR-002 — Shared Schema Tenancy](docs/adr/ADR-002-shared-schema-tenancy.md)
- [ADR-003 — Ledger and Genealogy](docs/adr/ADR-003-ledger-genealogy.md)
- [ADR-004 — Action RBAC and Audit](docs/adr/ADR-004-action-rbac-and-audit.md)

### Phase 2 status

**Partially complete / architecture-ready for review.** The logical architecture, module boundaries, tenancy, RBAC, core entities, ERDs, ledger, genealogy, state/transaction approach, security model, test architecture, traceability, seed strategy, migration strategy, and critical scenario walkthroughs are documented. The quality gate remains open for business decisions that cannot safely be invented: authoritative process connector directions, grading/specification/hold rules, VCT meaning, 30%/70% basis, weighing integration, jurisdiction/document rules, finance scope, and operational SLOs.

### Change log

| 2026-09-30 | Created Phase 2 architecture package with modular-monolith decision, dependency map, logical schema, ERDs, tenant/RBAC/security design, ledger/genealogy model, threat model, traceability matrix, test architecture, seed/migration strategy, and ADRs. |

## 24. Phase 3 Foundation Documents

- [UI Design System](docs/ui-design-system.md)
- [Frontend Architecture](docs/frontend-architecture.md)

### Phase 3 implementation status

The reusable foundation now includes configuration-driven navigation, permission-aware navigation metadata, centralized quantity/percentage/date/status formatting, normalized application errors, a centralized API client, environment placeholders, responsive list/form/drawer/toast patterns, and a low-risk Rejection Reasons reference master demonstrating list → add → validation → details drawer.

Authentication and tenant isolation are not connected to a backend yet because the Phase 2 identity-provider decision is unresolved. The browser demo context is explicitly non-production and does not claim server-side authorization.

### Phase 3 change log

| Date | Change |
|---|---|
| 2026-09-30 | Added Phase 3 frontend foundation modules, API/error/permission helpers, centralized formatters, environment example, reference Rejection Reasons slice, foundation tests, and UI/frontend architecture documentation. Verified `npm test` and `npm run build`. |

## 25. Phase 4 Master Data Documents

- [Master Data Matrix](docs/master-data.md)
- [Configuration Matrix](docs/configuration.md)

### Phase 4 implementation status

Implemented a reusable master-data center with explicit typed definitions and browser-persisted demo records for UOM, Materials, Customers, Suppliers, Transporters, Vehicles, Storage Locations, Tanks/Storage Units, Production Lines, Process Definitions, Quality Parameters, Sampling Plans, Grading Parameters, Grading Rules, Rejection Reasons, and Numbering Sequences.

The configuration center supports dependency-family grouping, search, pagination shell, add/edit forms, required validation, select/number/date/textarea/checkbox controls, duplicate-code prevention, active/inactive lifecycle, details drawer, and demo scope messaging. It does not yet claim backend tenancy, database foreign keys, server RBAC, audit persistence, or production migrations.

### Phase 4 change log

| Date | Change |
|---|---|
| 2026-09-30 | Added explicit master-data definitions, configuration center, reusable master CRUD reference pattern, master/configuration matrices, and scope/dependency documentation. Verified tests and production build. |

## 26. Phase 5 Commercial Documents

- [Commercial and Procurement](docs/commercial.md)

### Phase 5 implementation status

Implemented browser-persisted demo Sales Contracts, Purchase Contracts, and planning-only Delivery Orders. Contract forms use controlled masters, explicit state transitions, quantity summaries, detail drawers, and permission metadata. Delivery Orders intentionally do not reserve or consume contract quantity because the approved utilization event is unresolved.

No FFB Receiving, transactional Weighbridge, Inventory Posting, Production, Quality execution, or Dispatch execution was added.

### Phase 5 change log

| Date | Change |
|---|---|
| 2026-09-30 | Added explicit commercial domain transition/validation helpers, Sales/Purchase Contract and planning-only Delivery Order UI, demo persistence, contract quantity summaries, commercial permissions, tests, and documentation. Verified 7 tests and production build. |

## 27. Phase 6 Receiving Documents

- [FFB Receiving and Lot Traceability](docs/ffb-receiving.md)
- [Inbound Weighbridge](docs/weighbridge.md)

### Phase 6 implementation status

Implemented the inbound receiving workflow through `READY_TO_POST`: supplier and Purchase Contract selection, vehicle selection, first/second weighments, gross/tare/net calculation, configured rejection reason selection, grading completion validation, accepted/rejected reconciliation, receipt list, receipt details drawer, and traceability presentation.

Final Purchase Contract allocation, FFB lot creation, inventory receipt movement, FFB Ramp availability, and `POSTED` state remain blocked pending the authoritative utilization basis and backend atomic transaction implementation. No production execution was started.

### Phase 6 change log

| Date | Change |
|---|---|
| 2026-09-30 | Added receiving domain helpers, two-direction weighment validation, disposition reconciliation, FFB Receiving UI, traceability drawer, controlled rejection reasons, tests, and Phase 6 documentation. Verified 10 tests and production build. |
# Phase 6 implementation note (2026-09-30)

The live application now includes the server-backed Stock → FFB Receiving workflow through `READY_TO_POST`. One `ffb_receipts` ticket links first weighing, grading, and vehicle exit; gross/tare/net are stored and validated server-side. Final Purchase Contract allocation, FFB Lot creation, and Material Ledger posting remain blocked pending the open business rules documented in `docs/ffb-receiving.md`.

## 28. ERP + MES Current-State Assessment

### Existing ERP Capabilities

The current application provides a usable browser shell and a limited operational prototype:

- ROCKEYE-inspired responsive header, `DEMO` environment label, breadcrumb, global search, dashboard, permissions-aware navigation, and the requested menu hierarchy: Customers → Sales Contracts/Delivery Orders, Suppliers → Purchase Contracts, and Stock → FFB Receiving.
- Customer and supplier master screens with forms, list/detail presentation, validation, and SQLite-backed create operations.
- Sales-contract screen and API with contract/product/document JSON storage, basic required-field validation, and draft creation.
- Purchase-contract and Delivery Order domain/UI definitions exist in the frontend foundation, but they are not represented by equivalent server tables and are not transactional.
- Item/material master screen and API with type, UOM, reorder level, location, storage condition, tracking method, quality-inspection flag, and specification fields.
- Dashboard and list endpoints for users, receiving, stock, quality, and dispatch using seeded demo data.
- Basic error normalization, quantity/date/status formatters, permission metadata, and reusable UI patterns.

These are prototype capabilities, not production ERP controls. Most server tables lack tenant, mill, actor, version, approval, audit, and posting metadata.

### Existing MES Capabilities

MES coverage is currently representational rather than executable:

- The dashboard and Production view show process families, progress, utilization, and by-product concepts.
- The process flow and production-stage vocabulary from the SOH PDF are documented.
- FFB receiving has an actual server-backed workflow through first weighing, grading, vehicle exit, calculated net weight, and `READY_TO_POST`.
- No production plan, batch, sterilizer batch, process execution, equipment event, downtime, input/output movement, yield calculation, stage reconciliation, shift, or operator execution record exists in the database/API.
- CPO, kernel, EFB, fibre, shell, sludge, recovered oil, losses, and condensate are not generated from production transactions; dashboard values such as CPO produced and utilization remain seeded/static prototype values.

### Existing Quality Capabilities

- A seeded `quality` table and dashboard/list presentation exist.
- Item master records can carry a quality-inspection flag and free-text specification.
- Master-data definitions include quality parameters, specifications, sampling plans, grading parameters, grading rules, and rejection reasons at the frontend configuration level.
- FFB grading captures ripeness, ramp, grader, and a configurable result text.

There is no server-side quality parameter/specification versioning, sample/result entity, laboratory workflow, pass/fail calculation, hold/release action, certificate, approval, or quality-to-inventory gate. The current quality list is demo data, not a quality system.

### Existing Inventory Capabilities

- Item/material master and a seeded stock snapshot exist.
- Inventory-facing navigation and Stock → FFB Receiving are available.
- FFB receiving calculates and validates gross, tare, and net weight and stores the receiving ticket in SQLite.
- Tracking method and storage metadata are captured on item definitions.

There is no material ledger, lot/batch balance, storage-unit balance, transfer, adjustment, reservation, stock count, availability calculation, UOM conversion, quality hold balance, or atomic posting. `stock` is a display table with manually seeded balances and must not be treated as a source of truth.

### Material Genealogy Assessment

The conceptual genealogy is documented in `docs/traceability.md` and the receiving UI presents supplier, contract, vehicle, weighbridge, grading, and receipt references. The SOH route families and intended outputs are also documented.

Actual persisted genealogy currently stops at the FFB receiving ticket. There is no `FFBLot`, material movement, production batch, process execution, quality sample linkage, storage balance, dispatch line, or immutable audit-event chain. The application therefore cannot yet answer a reliable end-to-end question such as “which supplier lots and process executions produced this CPO tank quantity?”

### Architecture Assessment

The prototype uses React 19/Vite on the client and Express 5 with better-sqlite3 on the server. This is consistent with the documented modular-monolith direction and is suitable for the next vertical slice. The database is initialized by ad-hoc `CREATE TABLE`/`ALTER TABLE` statements in `server.js`; there are no migrations, service/domain boundaries, repository layer, transaction orchestration for business posts, or API versioning in the running server.

There is an important integration defect to resolve: `src/services/apiClient.js` defaults to `/api/v1`, while the active server routes are `/api/...`; active screens mostly bypass the shared client and call `fetch` directly. The server also has no authentication middleware, tenant resolution, authorization enforcement, request correlation, or audit middleware. CORS is open and the demo database is a local file.

### Missing Capabilities

- Identity, sessions, tenant/mill context, server-side RBAC, MFA/SSO integration point, and authorization tests.
- Versioned migrations, tenant-scoped keys/constraints, foreign keys, indexes, seed separation, backup/restore, and data-retention controls.
- Purchase contract persistence and approved utilization basis for receiving allocation.
- Delivery-order and supplier-delivery persistence with workflow/state transitions.
- FFB lot creation, accepted/rejected inventory posting, reversals, and contract utilization posting.
- Material ledger, storage units, lot balances, UOM conversion, reservations, transfers, adjustments, and stock reconciliation.
- Production plans/batches, route/stage masters, execution events, input/output/by-product/loss movements, yield and mass-balance rules.
- Quality samples, result entry, specifications, hold/release, certificates, and dispatch blocking.
- Outbound weighing, dispatch posting, customer contract allocation, and dispatch genealogy.
- Immutable audit events, document storage/metadata, numbering, approvals, notifications, reporting, and operational observability.

### Business-Rule Gaps

The following rules must be confirmed before posting logic is enabled:

- Purchase-contract utilization basis: gross, net, accepted quantity, or another approved basis; treatment of partial rejection and deductions.
- Authoritative connector directions, bypasses, mass-balance formulas, loss tolerances, and the meaning/basis of the PDF’s 30% dry and 70% wet separation labels.
- FFB grading parameters, rejection reasons, tolerance/rounding, and who may override a grading outcome.
- VCT meaning and pure-oil/CPO quality specifications, including hold/release effects.
- UOM, precision, timezone, weighing-device integration, offline operation, and duplicate-ticket behavior.
- Approval/post/reverse authority, correction model, shift calendar, sampling frequency, downtime, and production completion rules.
- Contract pricing, currency/tax/document rules, delivery allocation, and finance/accounting integration scope.

### Data-Model Gaps

The live SQLite schema is a prototype subset and currently has no tenant/mill columns. Missing core aggregates include `tenants`, `mills`, `user_tenants`, `roles`, `permissions`, `role_assignments`, `purchase_contracts`, `delivery_orders`, `supplier_deliveries`, `weighbridge_tickets`, `ffb_lots`, `materials` as a governed master, `storage_units`, `material_movements`, `inventory_balances`, `production_plans`, `production_batches`, `process_executions`, `quality_parameters`, `quality_specifications`, `quality_samples`, `quality_results`, `holds/releases`, `dispatches`, `documents`, `audit_events`, numbering sequences, and outbox/integration records.

Several existing tables also need normalization before production use: JSON blobs for contacts/products/documents should become governed child records or validated versioned payloads; `supplier` and `customer` references should use IDs rather than display strings; status transitions and effective dates need constraints; and all posted quantities need immutable movement references and decimal/rounding policy.

### Security/RBAC Gaps

The frontend has deny-by-default permission metadata, but this is not security enforcement. The `demoUserContext` is hard-coded, the server trusts any request, there is no authenticated identity, no tenant/mill authorization, no action-level server permission check, no audit trail, no rate limit/security headers, no upload policy, and no protection against cross-tenant access because tenant scope does not exist in the running schema. The current `DELETE /api/items/:id` endpoint is especially unsuitable for posted/master records without lifecycle and audit rules.

### Test Coverage Gaps

The current automated suite has 10 passing unit tests covering formatters, permission helpers, error normalization, master-definition shape, contract helper transitions, weighbridge calculations, FFB disposition reconciliation, and receipt helper transitions. The production build also passes.

Missing tests include API integration tests, schema/migration tests, authorization and tenant-isolation tests, state-transition concurrency tests, transaction atomicity/rollback tests, duplicate/idempotency tests, contract-allocation tests, lot and ledger invariants, production mass balance, quality hold/release, dispatch blocking, audit completeness, security headers/input validation, accessibility, responsive browser workflows, and backup/restore or failure-recovery tests.

### Recommended Changes

1. Freeze the present UI as the reference prototype and stop adding display-only operational screens until their posting semantics are defined.
2. Add a real migration layer and normalize the foundation around tenant, mill, user/session, role/permission, master, status-history, audit, and numbering entities.
3. Implement server-side auth/context/RBAC middleware and route all API access through one versioned client contract; fix the `/api/v1` versus `/api` mismatch.
4. Build one transactionally complete vertical slice: Purchase Contract → Supplier Delivery → inbound Weighbridge → FFB Grading → FFB Lot → accepted/rejected inventory movements → contract utilization → audit event.
5. Add immutable material movements and derived balances before implementing production outputs or dispatch.
6. Implement the first MES slice only after the process-owner confirms the route: production batch, stage execution, input/output/by-product/loss posting, reconciliation, and genealogy.
7. Add quality specification/sample/hold-release gates and make inventory/dispatch respect them.
8. Expand tests around invariants and authorization before enabling destructive or posting actions.

### Updated Phase Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0–2 | Discovery, process reference, requirements, architecture, security, data-model and ADR package | Documented; business-rule gate remains open |
| 3 | Application shell, design system, navigation, reusable frontend/API/error/permission helpers | Implemented as demo foundation |
| 4 | Master data and configuration center | Implemented in UI/demo scope; server governance incomplete |
| 5 | Commercial screens and planning workflows | Implemented partly; Sales Contract API exists, Purchase Contract/Delivery Order posting incomplete |
| 6 | FFB receiving and inbound weighbridge | Implemented server-backed through `READY_TO_POST`; posting/genealogy incomplete |
| 7 | Production-grade foundation and first posted receiving slice | Recommended next phase; migrations, auth/context/RBAC, audit, contract utilization, lots, ledger, atomic posting |
| 8 | Production execution/MES | Plans, batches, route stages, execution, mass balance, outputs/by-products/losses, genealogy |
| 9 | Quality and release control | Specifications, samples, results, holds/releases, certificates, quality gates |
| 10 | Storage, dispatch, outbound weighing and fulfillment | Inventory operations, dispatch posting, customer contracts, documents, end-to-end genealogy |
| 11 | Hardening and operations | Reporting, integrations, observability, performance, security, backup/restore, UAT and deployment |

### Recommended Next Implementation Phase

Proceed with **Phase 7 — transactional ERP foundation and posted FFB receiving vertical slice**. This is the smallest phase that converts the current receiving prototype into a trustworthy ERP transaction and creates the ledger/genealogy foundation required by MES.

Phase 7 should deliver:

- migrations and a normalized tenant/mill-aware schema;
- authenticated demo identity boundary with server-side action permissions;
- Purchase Contracts, Supplier Deliveries, Weighbridge Tickets, FFB Lots, Material Movements, Inventory Balances, Status History, and Audit Events;
- an explicit configurable utilization basis, with the unresolved choice surfaced as a configuration decision rather than hidden in code;
- atomic `POST` and controlled reversal paths for accepted/rejected FFB;
- API contract/version alignment and integration tests for authorization, idempotency, rollback, and genealogy;
- UI changes limited to showing posted status, lot references, contract utilization, inventory movement, and audit history.

No new production-output formulas should be implemented until the route and mass-balance rules are approved. This assessment is the gate for the next phase; it does not claim that the current demo is production-ready.

### Assessment Verification

- `npm test`: 10 tests passed.
- `npm run build`: Vite production build passed.
- Repository inspection confirmed active files: `src/app.jsx`, `server.js`, `rockeye.sqlite`, commercial/master/receiving/inventory modules, and the Phase 2–6 documentation set.

| Date | Change |
|---|---|
| 2026-10-01 | Added ERP+MES current-state assessment, capability boundary, architecture/security/data-model gaps, test gaps, updated roadmap, and recommended Phase 7 gate after repository audit. |

## 29. Production Routing and Execution

- [Production Routing and Execution](docs/production-routing.md)

Implemented the core configurable manufacturing flow for FFB to CPO and Palm Kernel: production line and machine masters, versioned routings and ordered route steps, FFB/capacity readiness checks, production-run creation, sequential stage execution, input/output/loss capture, process quality sampling, run completion, and CPO/PK inventory updates.

The live module is available under **Production → Production Runs**, **Production → Routing**, and **Production → Production Configuration**. Engineering yields, stage reconciliation tolerances, authoritative quality limits, hold/release rules, and connector-level mass-balance formulas remain configurable business decisions.

| Date | Change |
|---|---|
| 2026-10-01 | Added server-backed production routing, configuration masters, production-start workflow, sequential execution, periodic process-quality capture, and finished-goods inventory posting. |

## 30. Master-Data Navigation Policy

All master-data creation and maintenance screens must be exposed beneath the main **Masters** menu. Operational modules may consume master data but should not provide separate master-creation entry points.

The current Masters menu includes Item, Production Line, Station, Machine, Unit of Measure, Transporter, Vehicle Type, Vehicle, Storage Location, Tank/Storage Unit, Process Definition, Quality Parameter, Sampling Plan, Grading Parameter, Grading Rule, Rejection Reason, and Numbering Sequence masters. Production now contains routing and production-run execution only; Stock contains inventory operations and FFB receiving only.

| Date | Change |
|---|---|
| 2026-10-01 | Centralized current master-data creation under the Masters main menu and moved Item, Production Line, and Machine masters out of operational menus. |
| 2026-10-01 | Added server-backed Station Master for physical and functional palm oil mill sections and linked Machine Master station selection to configured stations. |
| 2026-10-01 | Added Vehicle Type Master before Vehicle Master with usage, default capacity, UOM, tare requirement, lifecycle, and controlled Vehicle Master selection. |
| 2026-10-01 | Added smart FFB Receiving entry: vehicle registration lookup prefills linked supplier data, driver identity lookup prefills repeat-driver details, and first weighing records gate authorization for mill entry. |

## 31. Coding Standards & Disciplined Vibe Coding Pipeline

- [Coding Standards & Disciplined Vibe Coding Pipeline](docs/coding-standards.md)
- [Repository Engineering Rules](AGENTS.md)

All engineering work in this repository—whether authored by human engineers or AI agents ("vibe coding")—must adhere to the sequential 9-stage engineering pipeline:

```
Requirement
   ↓
Contract
   ↓
Architecture boundary
   ↓
Implementation
   ↓
Tests
   ↓
Static checks
   ↓
Security checks
   ↓
Human review
   ↓
Merge
```

Unstructured prompting and premature code generation without explicit requirements, contracts, architectural boundaries, and test validation are strictly prohibited. Every change must be validated against automated unit tests (`npm test`), static bundle compilation (`npm run build`), multi-tenant security invariants, and human review before merging.

| Date | Change |
|---|---|
| 2026-10-01 | Codified the 9-stage Disciplined Vibe Coding Pipeline in `AGENTS.md` and created comprehensive coding standards in `docs/coding-standards.md`. |

