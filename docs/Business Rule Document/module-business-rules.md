# Module-Wise Business Rules

The rules below are the implementation baseline. Each rule is atomic, testable, scoped, and linked to a functional requirement. Where the product must support different mill practices, the rule identifies configuration rather than a hard-coded value.

## 1. Platform Administration

### BR-PLAT-001 — Tenant lifecycle isolation

| Field | Definition |
|---|---|
| Module / classification | Platform Administration / Data Integrity, Configuration |
| Business rule | A tenant must be provisioned, suspended, archived, or deleted only through a controlled lifecycle; suspended tenants cannot create operational transactions. |
| Trigger / conditions | Tenant lifecycle command; platform administrator and valid tenant state. |
| System behavior / validation | Apply lifecycle transition, feature/plan checks, and tenant predicate to every API, job, file, and event. |
| Exception | Emergency suspension may bypass normal business approval only through audited platform action. |
| Role / status | `platform.tenant.manage`; `PROSPECT → ACTIVE → SUSPENDED → ARCHIVED`. |
| Audit / FRD / priority | Full before/after and reason; Platform requirements; Critical. |

### BR-PLAT-002 — Configuration scope precedence

| Field | Definition |
|---|---|
| Module / classification | Platform Administration / Configuration |
| Business rule | Platform defaults may be overridden only by an authorized tenant, company, mill, or user setting where that setting is defined as overridable. |
| Trigger / conditions | Configuration read or update. |
| System behavior / validation | Resolve `platform → tenant → company → mill → user`; reject unsupported scope and record effective source. |
| Exception | Security and compliance controls marked non-overridable remain platform-owned. |
| Role / status | Platform/tenant/mill configuration permissions; `DRAFT → APPROVED → ACTIVE → RETIRED`. |
| Audit / FRD / priority | Version, scope, actor, effective dates; Platform requirements; High. |

### BR-PLAT-003 — Module entitlement

| Field | Definition |
|---|---|
| Module / classification | Platform Administration / Authorization, Configuration |
| Business rule | A disabled or quota-exceeded module cannot create new transactions, while permitted historical reads remain governed by retention policy. |
| Trigger / conditions | Module command or quota evaluation. |
| System behavior / validation | Check tenant entitlement before command; return stable entitlement error and preserve existing data. |
| Exception | Platform support access requires explicit audited authorization. |
| Role / status | `platform.entitlement.manage`; module `ENABLED → DISABLED` is audited. |
| Audit / FRD / priority | Entitlement, actor, quota, affected tenant; Platform requirements; Critical. |

## 2. Identity, Users & RBAC

### BR-SEC-001 — Server-side permission enforcement

| Field | Definition |
|---|---|
| Module / classification | Identity & RBAC / Authorization |
| Business rule | Every protected command and query must authorize the authenticated principal on server-side scope and action. |
| Trigger / conditions | API, job, export, document, or integration request. |
| System behavior / validation | Resolve identity, role, permission, tenant/company/mill/location scope, record state, and policy before execution. |
| Exception | Health endpoint may be unauthenticated but must expose no business data. |
| Role / status | `security.policy.enforce`; unauthorized request is rejected without mutation. |
| Audit / FRD / priority | Successful critical action and denied security event; RBAC requirements; Critical. |

### BR-SEC-002 — Segregation of duties

| Field | Definition |
|---|---|
| Module / classification | Identity & RBAC / Authorization, Compliance |
| Business rule | A user must not approve, post, release, or reverse a transaction they prepared when the configured SoD policy prohibits it. |
| Trigger / conditions | Approval/post/release/reversal command. |
| System behavior / validation | Compare actor to preparation, prior approval, and delegated authority records; block conflict. |
| Exception | Emergency override requires authorized compliance role, reason, expiry, and audit. |
| Role / status | `security.sod.override`; transaction remains in prior status on failure. |
| Audit / FRD / priority | Actor, conflict, policy version, override; RBAC/workflow requirements; Critical. |

### BR-SEC-003 — Scoped role assignment

| Field | Definition |
|---|---|
| Module / classification | Identity & RBAC / Data Integrity, Configuration |
| Business rule | A role assignment must identify tenant, company, mill, department, location, effective dates, and grantor where scope is applicable. |
| Trigger / conditions | Role grant, update, expiry, or access evaluation. |
| System behavior / validation | Reject incomplete or expired assignment; deny access outside assignment scope. |
| Exception | Platform administrators may manage tenant-level assignments under audited support policy. |
| Role / status | `security.role.manage`; `PENDING → ACTIVE → EXPIRED/REVOKED`. |
| Audit / FRD / priority | Grant, revoke, expiry, actor, scope; RBAC requirements; Critical. |

## 3. Master Data & Configuration

### BR-MAST-001 — Active master dependency

| Field | Definition |
|---|---|
| Module / classification | Masters / Validation, Data Integrity |
| Business rule | A transaction may reference only an active master effective for its transaction date and organization scope. |
| Trigger / conditions | Create, submit, approve, or post transaction. |
| System behavior / validation | Validate master status, effective range, tenant/mill scope, and compatible UOM/category. |
| Exception | Historical records may display inactive masters but cannot use them for new postings. |
| Role / status | `master.read`; transaction remains unchanged on failure. |
| Audit / FRD / priority | Failed reference and configuration version; all module FRDs; Critical. |

### BR-MAST-002 — Versioned configuration history

| Field | Definition |
|---|---|
| Module / classification | Masters / Configuration, Compliance |
| Business rule | A change to a route, specification, sampling plan, tolerance, numbering rule, or calculation basis creates a new effective version when historical interpretation can change. |
| Trigger / conditions | Master/configuration edit or activation. |
| System behavior / validation | Close prior version by effective date; reject ambiguous overlap; snapshot version into transactions. |
| Exception | Non-semantic label correction may be allowed with field-level audit if policy permits. |
| Role / status | `configuration.manage`, approval as configured; `DRAFT → APPROVED → ACTIVE → RETIRED`. |
| Audit / FRD / priority | Version diff, approver, dates, reason; platform/module FRDs; Critical. |

### BR-MAST-003 — Dynamic master safety

| Field | Definition |
|---|---|
| Module / classification | Masters / Configuration, Data Integrity |
| Business rule | Dynamic masters may provide reference values but may not replace strongly typed entities needed for foreign keys, calculations, or regulatory traceability. |
| Trigger / conditions | Dynamic master type creation or field configuration. |
| System behavior / validation | Require owner, field schema, data type, lifecycle, scope, and usage restrictions; reject unsafe entity substitution. |
| Exception | Product owner may approve a new typed entity through architecture review. |
| Role / status | `configuration.dynamic_master.manage`; master type `DRAFT → ACTIVE → RETIRED`. |
| Audit / FRD / priority | Schema and usage history; Platform requirements; High. |

## 4. Sales & Customer Management

### BR-SALES-001 — Sales contract validity

| Field | Definition |
|---|---|
| Module / classification | Sales / Validation, Status |
| Business rule | A sales contract line is usable only when the customer, product, UOM, currency, validity period, and approval state are valid for the operating scope. |
| Trigger / conditions | Submit, approve, allocate, or create delivery commitment. |
| System behavior / validation | Validate active masters, dates, positive quantity, price basis, and non-overlapping policy. |
| Exception | Approved exception requires commercial authority and reason. |
| Role / status | `sales.contract.submit/approve`; `DRAFT → SUBMITTED → APPROVED → ACTIVE → COMPLETED`. |
| Audit / FRD / priority | Contract version, approval, exceptions; Sales FRD PR-SALES-002; High. |

### BR-SALES-002 — Contract allocation limit

| Field | Definition |
|---|---|
| Module / classification | Sales / Calculation, Data Integrity |
| Business rule | Allocated and delivered quantity must not exceed approved contract quantity plus configured tolerance. |
| Trigger / conditions | Allocation, delivery commitment, dispatch fulfillment. |
| System behavior / validation | Lock contract utilization, calculate remaining quantity, reject excess, and update utilization atomically. |
| Exception | Authorized over-delivery requires configured approval and records excess separately. |
| Role / status | Commercial approve/override; contract moves to `FULFILLED` only at configured completion condition. |
| Audit / FRD / priority | Quantity before/after and tolerance version; Sales FRD PR-SALES-003; Critical. |

### BR-SALES-003 — Commercial correction

| Field | Definition |
|---|---|
| Module / classification | Sales / Workflow, Compliance |
| Business rule | An approved or fulfilled contract cannot be silently edited; material change creates an amendment version or compensating transaction. |
| Trigger / conditions | Edit of approved contract, price, quantity, customer, or terms. |
| System behavior / validation | Create amendment, re-run approval, preserve prior version and affected fulfillment. |
| Exception | Typographical non-business field correction may use controlled audit edit. |
| Role / status | `sales.contract.amend`; `ACTIVE → AMENDMENT_REVIEW → ACTIVE` or `CANCELLED`. |
| Audit / FRD / priority | Before/after, reason, linked records; Sales FRD PR-SALES-002; Critical. |

## 5. Procurement & Supplier Management

### BR-PROC-001 — Supplier eligibility

| Field | Definition |
|---|---|
| Module / classification | Procurement / Validation, Compliance |
| Business rule | A supplier may be used only when active, authorized for the tenant/company/mill, and compliant with required supplier documents or risk policy. |
| Trigger / conditions | Contract, direct purchase, delivery instruction, receiving reference. |
| System behavior / validation | Check status, category, validity, risk/hold, and required documents. |
| Exception | Approved emergency supplier use requires reason, expiry, and procurement authority. |
| Role / status | `procurement.supplier.override`; supplier `DRAFT → APPROVED → ACTIVE → SUSPENDED`. |
| Audit / FRD / priority | Eligibility result and override; Procurement FRD PR-PROC-001; High. |

### BR-PROC-002 — Purchase commitment limit

| Field | Definition |
|---|---|
| Module / classification | Procurement / Calculation, Data Integrity |
| Business rule | Purchase receipts and direct purchases must not exceed approved contract commitment, tolerance, or explicitly approved exception. |
| Trigger / conditions | Delivery instruction, receiving, direct purchase, invoice matching. |
| System behavior / validation | Lock commitment, calculate remaining quantity/value, and reject or route excess for approval. |
| Exception | Configured emergency purchase may bypass a contract only with authority and reason. |
| Role / status | `procurement.commitment.override`; contract `ACTIVE → PARTIALLY_RECEIVED → FULFILLED`. |
| Audit / FRD / priority | Utilization and exception; Procurement FRD PR-PROC-004; Critical. |

### BR-PROC-003 — Purchase-to-receipt reconciliation

| Field | Definition |
|---|---|
| Module / classification | Procurement / Integration, Calculation |
| Business rule | A supplier receipt must retain a valid purchase/direct-purchase reference or an approved configured exception and reconcile quantity, UOM, price basis, and quality terms. |
| Trigger / conditions | Receipt confirmation or invoice preparation. |
| System behavior / validation | Cross-module command validates reference and updates utilization; no direct table write. |
| Exception | Exception queue requires procurement approval before settlement. |
| Role / status | Receiving and procurement permissions; receipt remains pending on failure. |
| Audit / FRD / priority | Reference, quantities, mismatch reason; Procurement/Receiving FRDs; Critical. |

## 6. Weighbridge & FFB Receiving

### BR-RECV-001 — Authoritative net weight

| Field | Definition |
|---|---|
| Module / classification | Receiving / Calculation, Integration |
| Business rule | Net weight is derived from the authoritative gross and tare weighments according to the configured direction and UOM precision; users cannot directly override derived net without controlled correction. |
| Trigger / conditions | First/second weighment capture or approved offline reconciliation. |
| System behavior / validation | Validate positive weights, vehicle/ticket identity, device timestamp, duplicate ticket, tolerance, and calculate net. |
| Exception | Manual correction requires weighbridge supervisor, reason, evidence, and audit. |
| Role / status | `weighbridge.capture/correct`; ticket `OPEN → FIRST_WEIGHT → COMPLETE/VOID`. |
| Audit / FRD / priority | Device, readings, derived value, correction; Receiving PR-RECV-002; Critical. |

### BR-RECV-002 — FFB disposition reconciliation

| Field | Definition |
|---|---|
| Module / classification | Receiving / Calculation, Data Integrity |
| Business rule | Accepted quantity plus rejected quantity plus configured adjustment must reconcile to authoritative net weight within configured tolerance. |
| Trigger / conditions | Grade completion or receipt posting. |
| System behavior / validation | Calculate difference using configured basis and precision; block posting beyond tolerance. |
| Exception | Supervisor may approve a configured reason such as moisture basis or sampling adjustment. |
| Role / status | `receiving.grade/approve`; receipt `GRADING_COMPLETED → READY_TO_POST` only when valid. |
| Audit / FRD / priority | Basis, tolerance, values, reason; Receiving PR-RECV-005; Critical. |

### BR-RECV-003 — Receipt posting atomicity

| Field | Definition |
|---|---|
| Module / classification | Receiving / Workflow, Integration |
| Business rule | Confirming an FFB receipt must atomically create the receipt lot, inventory movements, procurement utilization, audit event, and outbox event. |
| Trigger / conditions | Authorized confirm command in READY_TO_POST state. |
| System behavior / validation | Execute one transaction with locks and idempotency; rollback all outcomes on failure. |
| Exception | Failed external delivery is retried from outbox without duplicating source posting. |
| Role / status | `receiving.receipt.post/reverse`; `READY_TO_POST → POSTED → REVERSED`. |
| Audit / FRD / priority | Correlation, command key, all affected IDs; Receiving PR-RECV-006; Critical. |

## 7. Inventory, Warehouse & Storage

### BR-INV-001 — Immutable inventory ledger

| Field | Definition |
|---|---|
| Module / classification | Inventory / Data Integrity, Compliance |
| Business rule | Every stock change is an append-only ledger entry linked to a valid originating command; balances are derived or updated transactionally from ledger entries. |
| Trigger / conditions | Receipt, issue, transfer, production output, reservation release, adjustment, or reversal. |
| System behavior / validation | Require movement type, lot/material, UOM, location, quantity, reference, and scope; prevent unexplained balance edits. |
| Exception | Physical reconciliation creates an approved adjustment movement, never a direct balance update. |
| Role / status | `inventory.post/adjust/reverse`; movement `REQUESTED → POSTED → REVERSED`. |
| Audit / FRD / priority | Before/after balance, source reference, actor; Inventory PR-INV-002; Critical. |

### BR-INV-002 — Negative stock and reservation

| Field | Definition |
|---|---|
| Module / classification | Inventory / Validation, Configuration |
| Business rule | Available stock equals posted balance minus active reservations; negative available stock is blocked unless a mill-scoped policy explicitly permits it. |
| Trigger / conditions | Issue, reservation, dispatch, production consumption, or transfer. |
| System behavior / validation | Lock balance, calculate available quantity at configured precision, and reject or route exception. |
| Exception | Authorized controller override requires reason and policy version. |
| Role / status | `inventory.override_negative`; reservation `REQUESTED → RESERVED → RELEASED/CONSUMED`. |
| Audit / FRD / priority | Balance/reservation and override; Inventory PR-INV-004; Critical. |

### BR-INV-003 — Storage and tank capacity

| Field | Definition |
|---|---|
| Module / classification | Inventory / Validation, Calculation |
| Business rule | A receipt or transfer into a location/tank must not exceed active capacity or compatible-material rules. |
| Trigger / conditions | Put-away, transfer, production output, or tank movement. |
| System behavior / validation | Evaluate current balance, pending reservations, capacity UOM conversion, material compatibility, and effective configuration. |
| Exception | Emergency overflow requires authorized storage exception and immediate reconciliation plan. |
| Role / status | `storage.transfer/override`; transfer `DRAFT → APPROVED → POSTED`. |
| Audit / FRD / priority | Capacity snapshot, compatibility, exception; Inventory PR-INV-005; High. |

## 8. Production Planning, Routing & MES Execution

### BR-PROD-001 — Route version snapshot

| Field | Definition |
|---|---|
| Module / classification | Production / Configuration, Data Integrity |
| Business rule | A production batch executes against a specific approved route version snapshot; later route changes cannot alter historical execution. |
| Trigger / conditions | Batch creation or route activation. |
| System behavior / validation | Require active route, line/work center, effective date, inputs/outputs, quality gates, and snapshot ID. |
| Exception | Replanning before execution may select a new version through controlled approval. |
| Role / status | `production.route.approve`, `production.batch.plan`; route `DRAFT → APPROVED → ACTIVE → RETIRED`. |
| Audit / FRD / priority | Route version and snapshot; Production PR-PROD-001; Critical. |

### BR-PROD-002 — Operation sequence and prerequisites

| Field | Definition |
|---|---|
| Module / classification | Production / Status, Validation |
| Business rule | An operation cannot start or complete until prior configured stages, equipment readiness, required inputs, and quality gates are satisfied. |
| Trigger / conditions | Start, complete, hold, or skip operation. |
| System behavior / validation | Enforce sequence and prerequisite policy; record authorized skip/override if configured. |
| Exception | Emergency bypass requires production authority, reason, and downstream review. |
| Role / status | `production.stage.execute/override`; `PENDING → IN_PROGRESS → COMPLETED → POSTED`. |
| Audit / FRD / priority | Prerequisites and override; Production PR-PROD-003; Critical. |

### BR-PROD-003 — Production mass balance

| Field | Definition |
|---|---|
| Module / classification | Production / Calculation |
| Business rule | For a posted operation, input quantity equals configured output quantities plus by-products, losses, and approved adjustment within configured precision/tolerance. |
| Trigger / conditions | Operation completion/posting. |
| System behavior / validation | Apply versioned balance basis and UOM conversion; block posting when unexplained difference exceeds tolerance. |
| Exception | Process owner may approve a configured loss/measurement exception with reason. |
| Role / status | `production.mass_balance.override`; operation cannot become POSTED until valid/approved. |
| Audit / FRD / priority | Formula version, values, difference, reason; Production PR-PROD-004; Critical. |

### BR-PROD-004 — CPO, kernel, co-product, and waste outputs

| Field | Definition |
|---|---|
| Module / classification | Production / Calculation, Configuration |
| Business rule | CPO, palm kernel, co-products, by-products, and waste are posted as configured output categories with material, UOM, lot, destination, and quality status. |
| Trigger / conditions | Operation completion and output confirmation. |
| System behavior / validation | Require output definition, quantity, lot genealogy, destination, and applicable quality hold; post through Inventory. |
| Exception | Unplanned output requires authorized exception category and later master review. |
| Role / status | `production.output.post`; output `PLANNED → CONFIRMED → POSTED/HOLD`. |
| Audit / FRD / priority | Output category, route version, source lot; Production PR-PROD-004; High. |

## 9. Quality Management

### BR-QUAL-001 — Applicable specification

| Field | Definition |
|---|---|
| Module / classification | Quality / Configuration, Validation |
| Business rule | An active quality configuration must resolve exactly one applicable specification, method, sampling plan, and release policy for the material/process/scope/date combination. |
| Trigger / conditions | Configuration activation, sample creation, evaluation, or release. |
| System behavior / validation | Resolve effective version; reject missing or ambiguous match; snapshot to sample/evaluation. |
| Exception | Quality Manager may create an approved temporary configuration with expiry. |
| Role / status | `quality.configuration.approve`; config `DRAFT → REVIEW → APPROVED → ACTIVE → RETIRED`. |
| Audit / FRD / priority | Rule/config version and scope; Quality PR-QUAL-002; Critical. |

### BR-QUAL-002 — Result evaluation

| Field | Definition |
|---|---|
| Module / classification | Quality / Calculation, Validation |
| Business rule | Each result is evaluated against configured min/max, warning, exact-match, or categorical rule with the declared UOM, precision, and method version. |
| Trigger / conditions | Observation entry or laboratory result import. |
| System behavior / validation | Normalize value, evaluate PASS/WARNING/FAIL, require mandatory tests, and aggregate result deterministically. |
| Exception | Override requires authorized Quality Approver, reason, evidence, and expiry where applicable. |
| Role / status | `quality.observe/evaluate/override`; `SAMPLED → IN_TEST → EVALUATED`. |
| Audit / FRD / priority | Original/result/threshold/method; Quality PR-QUAL-004; Critical. |

### BR-QUAL-003 — Hold and release

| Field | Definition |
|---|---|
| Module / classification | Quality / Workflow, Authorization |
| Business rule | A failed or incomplete quality evaluation places the configured lot, batch, or dispatch quantity on hold; release requires all mandatory conditions and authorized approval. |
| Trigger / conditions | FAIL, missing test, deviation, or manual hold. |
| System behavior / validation | Create hold, notify configured roles, block downstream operations, and record release decision and specification version. |
| Exception | Conditional release requires documented risk acceptance and configured authority. |
| Role / status | `quality.hold/release`; `HELD → RELEASED` or `HELD → REJECTED/REWORK`. |
| Audit / FRD / priority | Hold reason, approver, conditions, timestamp; Quality PR-QUAL-005; Critical. |

## 10. Sustainability, Mass Balance & Traceability

### BR-SUST-001 — Genealogy completeness

| Field | Definition |
|---|---|
| Module / classification | Sustainability / Compliance, Data Integrity |
| Business rule | A certified or regulated claim must resolve source, transformation, storage, quality, and dispatch links without crossing tenant scope or using unexplained quantities. |
| Trigger / conditions | Trace query, claim creation, certificate report, or dispatch certification. |
| System behavior / validation | Traverse immutable source links and report missing/ambiguous links; block restricted claim if incomplete. |
| Exception | Authorized compliance exception requires evidence and expiry. |
| Role / status | `sustainability.claim.approve`; claim `DRAFT → REVIEW → APPROVED → CLOSED`. |
| Audit / FRD / priority | Source IDs, rule version, exception; Sustainability PR-SUST-002; Critical. |

### BR-SUST-002 — Certified mass balance

| Field | Definition |
|---|---|
| Module / classification | Sustainability / Calculation, Compliance |
| Business rule | Certified output claims cannot exceed certified input availability after configured stock, conversion, loss, and period rules. |
| Trigger / conditions | Certified receipt, production allocation, dispatch claim, adjustment. |
| System behavior / validation | Apply approved scheme/version formula; lock balance ledger; reject over-claim. |
| Exception | Scheme-specific correction requires compliance authority and evidence. |
| Role / status | `sustainability.mass_balance.adjust`; ledger `OPEN → RECONCILED → CLOSED`. |
| Audit / FRD / priority | Inputs, outputs, formula, period, adjustment; Sustainability PR-SUST-004; Critical. |

### BR-SUST-003 — Certificate validity

| Field | Definition |
|---|---|
| Module / classification | Sustainability / Validation, Compliance |
| Business rule | A certificate may support a claim only within its effective dates, scope, scheme, holder, and material/category coverage. |
| Trigger / conditions | Claim, report, dispatch document, or evidence review. |
| System behavior / validation | Check validity and scope; flag upcoming expiry; block expired/invalid use. |
| Exception | None for restricted claims unless compliance policy explicitly permits retrospective evidence. |
| Role / status | `sustainability.certificate.manage`; `DRAFT → VERIFIED → ACTIVE → EXPIRED`. |
| Audit / FRD / priority | Certificate version and verification; Sustainability PR-SUST-003; High. |

## 11. Maintenance, Equipment & OEE

### BR-MAINT-001 — Equipment identity and scope

| Field | Definition |
|---|---|
| Module / classification | Maintenance / Data Integrity |
| Business rule | Equipment has one stable identity, hierarchy location, owning mill, status, criticality, and effective lifecycle; transactions cannot reference retired equipment. |
| Trigger / conditions | Equipment creation, move, service, downtime, production, or work order. |
| System behavior / validation | Enforce unique code within configured scope and preserve history when moved or retired. |
| Exception | Temporary unregistered equipment requires controlled placeholder and expiry. |
| Role / status | `maintenance.equipment.manage`; `DRAFT → ACTIVE → OUT_OF_SERVICE → RETIRED`. |
| Audit / FRD / priority | Identity, hierarchy, status, changes; Maintenance PR-MAINT-001; High. |

### BR-MAINT-002 — Preventive maintenance schedule

| Field | Definition |
|---|---|
| Module / classification | Maintenance / Workflow, Configuration |
| Business rule | A due preventive task is generated according to the active strategy, interval, meter, calendar, and equipment scope; completion updates the next due basis. |
| Trigger / conditions | Calendar/meter threshold or manual schedule generation. |
| System behavior / validation | Create idempotent work request/order, notify responsible role, and prevent duplicate active task for same basis. |
| Exception | Authorized deferment requires reason, new due date, risk review, and audit. |
| Role / status | `maintenance.plan.manage/defer`; plan `DRAFT → ACTIVE → SUSPENDED/RETIRED`. |
| Audit / FRD / priority | Schedule version, due basis, deferment; Maintenance PR-MAINT-002; High. |

### BR-MAINT-003 — Return to service

| Field | Definition |
|---|---|
| Module / classification | Maintenance / Status, Authorization |
| Business rule | Equipment remains unavailable until required work, safety/permit checks, test results, and authorized return-to-service approval are complete. |
| Trigger / conditions | Work completion or breakdown repair. |
| System behavior / validation | Validate checklist, parts/labor, test, calibration, and approval before availability changes. |
| Exception | Emergency return requires authorized maintenance manager and post-return review. |
| Role / status | `maintenance.return_to_service`; equipment `DOWN → UNDER_REPAIR → READY → AVAILABLE`. |
| Audit / FRD / priority | Checklist, test, approver, time; Maintenance PR-MAINT-003; Critical. |

### BR-MAINT-004 — OEE calculation basis

| Field | Definition |
|---|---|
| Module / classification | Maintenance / Calculation, Configuration |
| Business rule | OEE is calculated only from configured planned production time, availability loss, performance basis, and quality basis; undefined formulas remain unavailable rather than guessed. |
| Trigger / conditions | OEE report refresh. |
| System behavior / validation | Identify formula version, source events, missing data, and confidence/status; do not present incomplete data as authoritative. |
| Exception | Analyst may publish a clearly labeled provisional view. |
| Role / status | `report.kpi.publish`; KPI `DRAFT → APPROVED → PUBLISHED`. |
| Audit / FRD / priority | Formula, sources, missing-data indicator; Maintenance PR-MAINT-006; High. |

## 12. Dispatch & Delivery

### BR-DISP-001 — Dispatch authorization

| Field | Definition |
|---|---|
| Module / classification | Dispatch / Workflow, Authorization |
| Business rule | A dispatch order may be approved only when customer commitment, product, quantity, destination, vehicle, and required documents are valid. |
| Trigger / conditions | Dispatch creation or approval. |
| System behavior / validation | Resolve contract allocation, active masters, credit/hold policy where enabled, and approval workflow. |
| Exception | Authorized exception requires reason and expiry. |
| Role / status | `dispatch.order.approve`; `DRAFT → APPROVED → LOADING`. |
| Audit / FRD / priority | Preconditions and approver; Dispatch PR-DISP-001; High. |

### BR-DISP-002 — Quality and weighing clearance

| Field | Definition |
|---|---|
| Module / classification | Dispatch / Validation, Integration |
| Business rule | Dispatch cannot post until required quality release, vehicle validation, loading quantity, and outbound weighment tolerance are satisfied. |
| Trigger / conditions | Loading completion or post command. |
| System behavior / validation | Evaluate active release policy and authoritative weighment; block on hold/mismatch. |
| Exception | Authorized conditional release or weighment correction requires reason and audit. |
| Role / status | `dispatch.release/post/override`; `QUALITY_PENDING → READY_TO_POST`. |
| Audit / FRD / priority | Results, tolerances, device, approver; Dispatch PR-DISP-004; Critical. |

### BR-DISP-003 — Dispatch posting and delivery

| Field | Definition |
|---|---|
| Module / classification | Dispatch / Integration, Status |
| Business rule | Posting issues released inventory, updates sales fulfillment, creates document history, and establishes delivery/POD status atomically. |
| Trigger / conditions | READY_TO_POST and valid idempotency command. |
| System behavior / validation | Lock order/stock, post movement, update allocation, create document job, and emit event. |
| Exception | Failed downstream document/notification retries from outbox without duplicating stock issue. |
| Role / status | `dispatch.post/reverse`; `READY_TO_POST → POSTED → DELIVERED`, or `REVERSED`. |
| Audit / FRD / priority | All linked IDs, quantities, documents, POD; Dispatch PR-DISP-005; Critical. |

## 13. Documents & Notifications

### BR-DOC-001 — Template and document version

| Field | Definition |
|---|---|
| Module / classification | Documents / Configuration, Compliance |
| Business rule | A generated document uses one approved template version, numbering scope, branding configuration, and source-record snapshot. |
| Trigger / conditions | Document generation, print, reprint, or download. |
| System behavior / validation | Resolve template/version, render securely, store metadata/checksum, and link document to source. |
| Exception | Reprint uses the original version unless an authorized regeneration policy applies. |
| Role / status | `document.template.manage/generate/download`; template `DRAFT → APPROVED → ACTIVE → RETIRED`. |
| Audit / FRD / priority | Template, source, renderer, actor, checksum; Document requirements; High. |

### BR-DOC-002 — Secure attachment access

| Field | Definition |
|---|---|
| Module / classification | Documents / Authorization, Data Integrity |
| Business rule | An attachment is accessible only to an authorized principal within the source record's tenant and scope, through a time-limited secure URL. |
| Trigger / conditions | Upload, preview, download, or deletion request. |
| System behavior / validation | Validate MIME, size, checksum, malware status, retention, and scope before access. |
| Exception | Quarantine suspicious file; never execute or expose it. |
| Role / status | `document.read/upload/delete`; attachment `UPLOADED → SCANNED → AVAILABLE/QUARANTINED`. |
| Audit / FRD / priority | Access, scan, download, deletion; Document requirements; Critical. |

### BR-DOC-003 — Notification delivery

| Field | Definition |
|---|---|
| Module / classification | Notifications / Integration, Configuration |
| Business rule | Notifications are generated from configured events, recipient rules, templates, preferences, and escalation policy; delivery failure must not roll back the source transaction. |
| Trigger / conditions | Business event and notification rule match. |
| System behavior / validation | Persist notification/outbox, resolve recipients, deliver asynchronously, retry boundedly, and expose failure. |
| Exception | Dead-letter after retry policy and notify support/owner. |
| Role / status | `notification.template.manage`; `QUEUED → SENT/FAILED/READ`. |
| Audit / FRD / priority | Event, recipients, provider, attempts; Platform requirements; High. |

## 14. Reporting & Dashboards

### BR-REPT-001 — KPI definition integrity

| Field | Definition |
|---|---|
| Module / classification | Reporting / Calculation, Configuration |
| Business rule | A published KPI must identify formula, source, scope, UOM, date basis, timezone, version, owner, refresh time, and data quality state. |
| Trigger / conditions | KPI creation, revision, publication, or report execution. |
| System behavior / validation | Reject missing formula metadata; preserve version; expose refresh and incomplete-data state. |
| Exception | Provisional KPI must be labeled and restricted from compliance reporting. |
| Role / status | `report.kpi.define/approve/publish`; `DRAFT → REVIEW → PUBLISHED → RETIRED`. |
| Audit / FRD / priority | Formula/version/approver; Reporting PR-REPT-001; High. |

### BR-REPT-002 — Scoped report access

| Field | Definition |
|---|---|
| Module / classification | Reporting / Authorization, Data Integrity |
| Business rule | A report, drill-down, export, or scheduled delivery must apply the requesting user's authorized tenant/company/mill/location scope to every source query. |
| Trigger / conditions | Query, export, schedule, or shared link. |
| System behavior / validation | Enforce scope server-side; reject unauthorized filter widening; audit export. |
| Exception | Cross-mill consolidated report requires explicit group-level permission. |
| Role / status | `report.read/export/schedule`; job `QUEUED → RUNNING → COMPLETED/FAILED`. |
| Audit / FRD / priority | Filters, scope, recipient, file; Reporting PR-REPT-005; Critical. |

### BR-REPT-003 — Asynchronous export

| Field | Definition |
|---|---|
| Module / classification | Reporting / Workflow, Integration |
| Business rule | An export exceeding configured size/time limits runs asynchronously and produces a time-limited secure download. |
| Trigger / conditions | Export request and size estimate. |
| System behavior / validation | Queue job, show progress, retry boundedly, expire file, and record result. |
| Exception | Failed job exposes reason and retry action without duplicating source data. |
| Role / status | `report.export`; export `REQUESTED → RUNNING → COMPLETED/FAILED/EXPIRED`. |
| Audit / FRD / priority | Requester, filters, rows, file, expiry; Reporting PR-REPT-005; High. |

## 15. Integration Management

### BR-INT-001 — Integration contract version

| Field | Definition |
|---|---|
| Module / classification | Integration / Integration, Data Integrity |
| Business rule | Each external adapter uses an explicit versioned payload, authentication method, correlation ID, idempotency key, and mapping configuration. |
| Trigger / conditions | Inbound/outbound message or adapter configuration. |
| System behavior / validation | Validate contract/version before processing; route unsupported payload to failure queue. |
| Exception | Manual replay requires authorized support role and preserves original message. |
| Role / status | `integration.manage/replay`; adapter `DRAFT → TEST → ACTIVE → SUSPENDED`. |
| Audit / FRD / priority | Message metadata, mapping, result; Integration requirements; Critical. |

### BR-INT-002 — Retry and dead-letter handling

| Field | Definition |
|---|---|
| Module / classification | Integration / Integration, Reliability |
| Business rule | Transient integration failure is retried with bounded backoff; permanent or exhausted failures enter a visible dead-letter state and do not silently disappear. |
| Trigger / conditions | Timeout, provider error, malformed payload, or mapping failure. |
| System behavior / validation | Classify failure, retry as policy permits, correlate attempts, alert owner, and support replay. |
| Exception | Security/authentication failures require credential/configuration remediation before replay. |
| Role / status | `integration.replay`; message `QUEUED → SENT/RETRYING/DEAD_LETTER`. |
| Audit / FRD / priority | Attempt/error/provider/correlation; Integration requirements; High. |

### BR-INT-003 — Reconciliation

| Field | Definition |
|---|---|
| Module / classification | Integration / Calculation, Compliance |
| Business rule | External and internal totals, identifiers, and status must be reconcilable for every financial, weighbridge, inventory, quality, and production interface. |
| Trigger / conditions | Scheduled reconciliation, inbound acknowledgement, or exception. |
| System behavior / validation | Compare counts/quantities/status, create exception, assign owner, and prevent silent correction. |
| Exception | Approved adjustment links both source records and reason. |
| Role / status | `integration.reconcile/resolve`; reconciliation `OPEN → INVESTIGATING → RESOLVED`. |
| Audit / FRD / priority | Compared values, owner, resolution; Integration requirements; Critical. |

## 16. Finance Interface

### BR-FIN-001 — Invoice source integrity

| Field | Definition |
|---|---|
| Module / classification | Finance Interface / Integration, Data Integrity |
| Business rule | An operational invoice must reference approved source transactions, customer/supplier, currency, tax/price configuration, and unique number within scope. |
| Trigger / conditions | Invoice creation, approval, export, or posting. |
| System behavior / validation | Validate source, lines, quantities, prices, tax basis, currency, and duplicate invoice number. |
| Exception | Manual invoice requires finance authority and source exception reason. |
| Role / status | `finance.invoice.create/approve/post`; `DRAFT → APPROVED → POSTED → VOIDED`. |
| Audit / FRD / priority | Source links, calculations, approver; Sales/Procurement FRDs; Critical. |

### BR-FIN-002 — Payment integrity

| Field | Definition |
|---|---|
| Module / classification | Finance Interface / Validation, Authorization |
| Business rule | A payment must identify party, date, currency, positive amount, method, reference, authorization, and applicable invoice/settlement basis. |
| Trigger / conditions | Payment creation, approval, export, or reversal. |
| System behavior / validation | Validate duplicate number, amount, party scope, approval threshold, and accounting mapping. |
| Exception | Unapplied payment requires finance approval and suspense tracking. |
| Role / status | `finance.payment.create/approve/reverse`; `DRAFT → APPROVED → POSTED → REVERSED`. |
| Audit / FRD / priority | Amount, method, account, approver; Finance interface; Critical. |

### BR-FIN-003 — Finance integration reconciliation

| Field | Definition |
|---|---|
| Module / classification | Finance Interface / Integration, Calculation |
| Business rule | Exported invoices, purchases, and payments must reconcile by source ID, number, amount, currency, and status with the accounting system. |
| Trigger / conditions | Export acknowledgement or scheduled reconciliation. |
| System behavior / validation | Match records, flag differences, block duplicate export, and support controlled correction. |
| Exception | Finance-approved mapping exception is retained with expiry and resolution owner. |
| Role / status | `finance.reconcile/resolve`; interface `SENT → ACKNOWLEDGED/EXCEPTION`. |
| Audit / FRD / priority | Comparison and resolution; Finance interface; High. |
