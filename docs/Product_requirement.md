# Product Requirement Structure

**Status:** Controlled product-requirement standard  
**Scope:** Product capabilities, requirements, business rules, stories, interfaces, and acceptance criteria  
**Related documents:** [`capability-guidelines.md`](capability-guidelines.md), [`module.md`](module.md), [`coding-standards.md`](coding-standards.md)

## Purpose

This document defines the traceability chain for product requirements. Every delivered capability should be traceable from the product outcome through the functional requirement, business rules, user stories, UI/API contracts, and test evidence.

```text
PRD Capability
    ↓
Functional Requirement
    ↓
Business Rule
    ↓
User Story
    ↓
UI / API
    ↓
Test / Acceptance Criteria
```

This structure creates one source of truth for product owners, engineers, testers, auditors, and AI coding agents. Jira or other task tools may track execution, but they must reference these controlled identifiers rather than becoming the only record of product intent.

## Product PRD hierarchy

The product must be managed as a hierarchy of controlled requirement documents and registers rather than one oversized ERP PRD.

```text
Master Product PRD
└─ Palm Oil Mill ERP + MES
   ├─ Sales
   ├─ Procurement
   ├─ Receiving
   ├─ Inventory
   ├─ Production
   ├─ Quality
   ├─ Maintenance
   ├─ Dispatch
   ├─ Sustainability
   └─ Reporting
```

The Master Product PRD defines the product vision, organization hierarchy, shared terminology, cross-module principles, platform capabilities, non-functional requirements, security baseline, and product-wide success measures. Module capability groups define the business outcomes and requirements owned by each domain. Cross-module capabilities must identify one owning group and link to the dependent groups.

### Master Product PRD

```text
Product: Palm Oil Mill ERP + MES
Level: Master Product PRD
Scope: Tenant/group → company → operating company → mill → line → station/machine/storage unit
```

The master document must not duplicate every module requirement. It should contain only product-wide decisions and links to the module-level capability groups.

### Module-level capability groups

| Group | Identifier prefix | Primary scope |
|---|---|---|
| Sales | `PR-SALES-*` | customer demand, sales contracts, allocations, delivery commitments |
| Procurement | `PR-PROC-*` | suppliers, purchase contracts, direct purchase, procurement commitments |
| Receiving | `PR-RECV-*` | gate, weighbridge, delivery, grading, receipt, rejection, reconciliation |
| Inventory | `PR-INV-*` | lots, movements, balances, reservations, storage, reversals |
| Production | `PR-PROD-*` | planning, routes, batches, operations, outputs, by-products, losses |
| Quality | `PR-QUAL-*` | parameters, configurations, observations, evaluation, deviations, reporting |
| Maintenance | `PR-MAINT-*` | equipment, maintenance plans, downtime, work execution, reliability |
| Dispatch | `PR-DISP-*` | loading, outbound movements, documents, delivery handover |
| Sustainability | `PR-SUST-*` | traceability, certification, mass balance, regulatory evidence |
| Reporting | `PR-REPT-*` | KPIs, analytics, exports, audit and operational reporting |

The group names describe product capability areas. Their implementation may be delivered by one or more domain modules, provided ownership, data boundaries, permissions, and integration contracts are explicit.

### Quality capability register

Quality is managed as a capability group with the following initial functional requirements:

| ID | Capability |
|---|---|
| `PR-QUAL-001` | Quality Parameter |
| `PR-QUAL-002` | Quality Configuration |
| `PR-QUAL-003` | Quality Observation |
| `PR-QUAL-004` | Quality Evaluation |
| `PR-QUAL-005` | Quality Deviation |
| `PR-QUAL-006` | Quality Reporting |

Each entry becomes its own controlled requirement record and then expands through the standard chain:

```text
PR-QUAL-002 Quality Configuration
    ↓
BR-QUAL-* Business Rules
    ↓
US-QUAL-* User Stories
    ↓
UI / API Contracts
    ↓
AC-QUAL-* Acceptance Criteria and Test Evidence
```

The Quality group must keep parameters, specifications, sampling plans, methods, limits, evaluation policies, hold/release rules, and deviation workflows configurable and effective-dated by the applicable organization and product scope.

### Recommended document layout

```text
docs/product-requirements/
├─ master-prd.md
├─ sales.md
├─ procurement.md
├─ receiving.md
├─ inventory.md
├─ production.md
├─ quality.md
├─ maintenance.md
├─ dispatch.md
├─ sustainability.md
└─ reporting.md
```

The current controlled structure is defined in this document. The module files may be split into the layout above when the requirement volume justifies separate ownership and review cycles; identifiers and links must remain stable when documents move.

## Requirement hierarchy

### 1. PRD Capability

A strategic business outcome that may contain several related requirements.

```text
PG-<DOMAIN>-<NNN>
```

Example:

```text
PG-QUAL-01 — Standardize and digitize mill quality management
```

The capability must state the business problem, target users, outcome, scope, measurable success indicators, and out-of-scope decisions.

### 2. Functional Requirement

A single system capability required to deliver the parent product capability.

```text
PR-<DOMAIN>-<NNN>
```

Example:

```text
PR-QUAL-002 — Quality Configuration
```

Functional requirements must be clear, necessary, atomic, verifiable, solution-independent, and configurable for different tenants and mills.

### 3. Business Rule

An invariant, policy, calculation, authorization condition, or state-transition rule that governs one or more functional requirements.

```text
BR-<DOMAIN>-<NNN>
```

Example:

```text
BR-QUAL-007 — An active configuration must have an applicable specification
```

Business rules must identify scope, effective dates, versioning behavior, exceptions, and whether they are configurable master data or fixed product controls.

### 4. User Story

A user- or system-centered expression of the value delivered by a functional requirement.

```text
US-<DOMAIN>-<NNN>
```

Use the format:

```text
As <authorized role>,
I want <business capability>,
so that <business outcome>.
```

Stories must identify the actor, authorized organization scope, preconditions, dependencies, and out-of-scope behavior.

### 5. UI / API

The approved interaction and contract surface that implements the requirement. This section may reference screens, workflows, endpoints, DTOs, error envelopes, permissions, events, and idempotency behavior.

UI and API details must not introduce business rules that are absent from the requirement or business-rule sections. Server-side enforcement is authoritative; frontend checks are presentation controls only.

### 6. Test / Acceptance Criteria

Observable evidence that proves the requirement has been delivered. Use Gherkin scenarios and include success, validation, authorization, concurrency, duplicate-request, tenant-isolation, and reversal cases where applicable.

```text
AC-<DOMAIN>-<FUNCTIONAL-REQUIREMENT-NNN>-<NN>
```

Example:

```text
AC-QUAL-020-01
```

## Standard requirement record

Copy this structure for each product requirement set.

```markdown
# <Requirement title>

**Baseline:** v1.0  
**Status:** Draft | In review | Approved | In delivery | Verified | Retired  
**Owner:** <product/domain owner>  
**Module:** <owning module>  
**Last approved:** <YYYY-MM-DD>  
**Related change requests:** <IDs or None>

## 1. PRD Capability

**ID:** PG-<DOMAIN>-<NNN>  
**Name:** <capability name>

### Business problem
<Problem, risk, cost, control, or compliance need.>

### Desired outcome
<What the organization will be able to accomplish.>

### Users and organization scope
- Primary users: <roles>
- Tenant/company/mill/line scope: <scope and authorization>
- Applicable configurations: <masters, policies, versions>

### Success measures
- <Measurable outcome>

### Out of scope
- <Explicit exclusions>

## 2. Functional Requirement

**ID:** PR-<DOMAIN>-<NNN>  
**Name:** <single logical capability>

<The system must enable an authorized actor to ...>

## 3. Business Rules

### BR-<DOMAIN>-<NNN> — <rule name>

- Rule: <invariant or policy>
- Scope: <tenant/company/mill/line/product/lot/etc.>
- Configuration: <master/configuration and owner, or fixed control>
- Effective/version behavior: <how changes affect historical records>
- Exception/reversal behavior: <defined correction path>

## 4. User Stories

### US-<DOMAIN>-<NNN> — <story name>

As <authorized role>, I want <capability>, so that <outcome>.

- Preconditions: <required state>
- Permissions: <required permission and scope>
- Dependencies: <related requirements or masters>
- Out of scope: <exclusions>

## 5. UI / API

### UI

- Screen/workflow: <name>
- Actions: <actions and required states>
- Validation feedback: <user-visible behavior>
- Accessibility/responsive requirements: <requirements>

### API

- Endpoint: `<METHOD> /api/v1/<resource>`
- Request/response contract: <versioned contract reference>
- Authorization: <server-side permission and scope>
- Idempotency/concurrency: <keys, version checks, conflict behavior>
- Errors: <standard error codes>
- Events/audit: <events and audit records>

## 6. Test / Acceptance Criteria

### AC-<DOMAIN>-<NNN>-01 — <successful scenario>

Given <context and starting state>  
And <configuration/master-data condition>  
When <authorized actor performs one action>  
Then <observable business result>  
And <state, audit, event, or integration result>

### AC-<DOMAIN>-<NNN>-02 — <validation or rejection scenario>

Given <invalid, unauthorized, duplicate, or conflicting context>  
When <actor attempts the action>  
Then <defined error>  
And <no unauthorized or partial posting occurs>

### Evidence

- Unit tests: <references>
- Integration/contract tests: <references>
- Security tests: <tenant isolation, RBAC, injection checks>
- Static checks: <build/type/schema evidence>
- Human review: <review reference>
```

## Worked example

```text
PG-QUAL-01
Standardize and digitize mill quality management
        ↓
PR-QUAL-002
Quality Configuration
        ↓
BR-QUAL-007
An active configuration must have an applicable specification
        ↓
US-QUAL-014
As Quality Manager, I want to maintain an approved quality configuration
for my authorized mill so that sampling and evaluation use the correct rules.
        ↓
UI: Quality Configuration Form
API: /api/v1/quality-configurations
        ↓
AC-QUAL-020-01
Given an authorized Quality Manager has entered a complete configuration
with an applicable specification and effective date
When the manager submits it for approval
Then the system validates it, records its version and mill scope,
and moves it to the configured approval state.
```

The example does not hard-code one mill's specification, sampling plan, measurement point, approval path, or process route. Those are scoped and versioned configuration or master data.

## Baseline and change control

Requirements are not frozen forever. They are approved and controlled baselines.

### Baseline lifecycle

```text
Draft → In review → Approved baseline → In delivery → Verified
                                      ↘ Change requested
```

After approval, do not silently edit the requirement. Create a change request:

```text
CR-<DOMAIN>-<NNN>
```

Every change request must include:

- the affected baseline and requirement identifiers;
- the requested change and business reason;
- impact assessment for domain model, UI, API, database, migration, reporting, integrations, permissions, audit, tests, and operations;
- affected tenants, companies, mills, lines, historical records, and configuration versions;
- compatibility and rollout strategy;
- decision, approver, date, and resulting baseline version.

Example:

```text
Baseline: Quality Configuration v1.0
Change: Add required measurement-point traceability
ID: CR-QUAL-004
Reason: Certain mills require equipment sampling-point traceability
Impact: Domain model, UI, observation entry, reporting, migration, integrations
Decision: Approved for Phase 2
Result: Quality Configuration v1.1
```

Historical transactions must remain interpretable under the rule and configuration version that was active when they were created or posted. A change must not rewrite history without an explicitly approved migration and audit trail.

## Traceability matrix

Maintain a matrix for every capability delivered:

| Product capability | Functional requirement | Business rule | User story | UI/API | Acceptance criteria | Evidence |
|---|---|---|---|---|---|---|
| PG-QUAL-01 | PR-QUAL-002 | BR-QUAL-007 | US-QUAL-014 | Quality Form / `/quality-configurations` | AC-QUAL-020-01 | Test and review links |

No implementation task is complete until its chain is traceable and its baseline or approved change request is identified.

## Quality gate

Before a requirement is marked **Approved**, confirm:

- it is clear, necessary, atomic, verifiable, solution-independent, and configurable;
- the owning domain and module boundary are identified;
- tenant, company, mill, line, permission, and audit scope are explicit;
- state transitions, corrections, reversals, and concurrency behavior are defined;
- configurable Palm Oil ERP/MES practices are versioned rather than hard-coded;
- UI/API contracts and acceptance criteria are linked;
- unresolved decisions are recorded;
- the baseline version and approver are recorded.

Approved requirements proceed through the repository pipeline: contract, architecture boundary, implementation, tests, static checks, security checks, human review, and merge.
