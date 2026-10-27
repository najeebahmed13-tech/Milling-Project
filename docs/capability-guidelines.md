# Capability and Requirement Guidelines

**Status:** Engineering guideline  
**Scope:** ERP + MES capabilities, module changes, and AI-assisted delivery  
**Related documents:** [`module.md`](module.md), [`coding-standards.md`](coding-standards.md), [`architecture.md`](architecture.md)

## Purpose

Every new functionality must begin as a clearly defined business capability before contracts, architecture, or implementation are produced. A capability describes an outcome that a user or system needs from ROCKEYE ERP + MES. It does not prescribe screens, classes, tables, vendors, or other implementation details unless those details are themselves an approved constraint.

This discipline is especially important for Palm Oil ERP/MES because mills differ in process routes, grading practices, equipment, shift patterns, quality limits, approval paths, units of measure, regulatory obligations, and product configurations.

## Capability versus implementation

A capability describes what the organization must be able to accomplish and under which business conditions.

```text
Capability: Record and reconcile an FFB delivery against an authoritative weighment.

Implementation detail: Add a React form with a `Confirm Receipt` button that writes
to the `ffb_receipts` table.
```

The capability is suitable for requirements analysis. The implementation detail belongs later in the contract and architecture stages.

## Six quality tests

Every requirement must pass all six tests before implementation begins.

### 1. Clear

A requirement is clear when two people reach the same interpretation without relying on undocumented assumptions.

Check for:

- one defined actor or system role;
- explicit business terms, identifiers, units, and statuses;
- a stated scope such as tenant, company, mill, line, shift, or lot;
- defined exceptions and expected outcomes;
- no vague terms such as “quickly,” “properly,” “as needed,” or “user-friendly.”

Weak:

> The system should handle receiving properly.

Strong:

> A Receiving Clerk may record an FFB delivery for a selected mill when the truck, supplier, weighment, material, and quantity are valid for that mill; the system must show the accepted quantity, rejected quantity, UOM, and reconciliation result before the receipt can be submitted.

### 2. Necessary

A requirement is necessary when it solves a documented business problem, risk, legal obligation, control, or measurable operational need.

Record the reason for the capability:

```text
Problem: Receipts are currently reconciled manually, causing differences between
weighbridge tickets, supplier settlement, and stock balances.

Outcome: The organization can trace and reconcile every accepted and rejected
quantity back to the authoritative delivery and weighment.
```

If removing the requirement would not harm an identified outcome, it is probably a preference or solution detail rather than a requirement.

### 3. Atomic

A requirement is atomic when it describes one logical capability with one primary outcome. It may include necessary validation and failure behavior, but it must not hide several independent capabilities behind “and.”

Split requirements when they contain separate outcomes, such as:

- receiving a delivery;
- grading the FFB;
- approving a quality result;
- posting inventory;
- generating a supplier invoice.

These may be part of one business workflow, but each must have its own requirement, state transition, permission, and acceptance criteria.

### 4. Verifiable

A requirement is verifiable when delivery can be proven by an observable result, test, report, audit event, or controlled user action.

Include measurable acceptance criteria:

- given a known starting state;
- when a defined actor performs a defined action;
- then the system produces a defined result;
- and invalid, unauthorized, duplicate, or conflicting actions have defined outcomes.

Avoid acceptance criteria that only say “works,” “looks good,” or “is easy to use.”

### 5. Solution-independent

A requirement is solution-independent when it expresses the business outcome without prematurely selecting a UI pattern, framework, database table, device, API shape, or algorithm.

Weak:

> Add a PostgreSQL column and a React dropdown for the mill code.

Strong:

> The system must associate each receipt with one authorized operating mill and prevent users from viewing or posting receipts outside their permitted scope.

Approved constraints may still be stated when they are genuine requirements, such as a regulatory document format, an existing weighbridge protocol, or an organization-wide security standard.

### 6. Configurable

A requirement is configurable when it identifies operating rules that can vary by tenant, company, mill, line, shift, product, season, contract, or effective date instead of embedding one customer's practice in code.

Ask:

- Can another mill use a different route, station, shift, capacity, tolerance, grade, or approval path?
- Can the rule change without changing application code?
- Must historical transactions retain the rule version used at posting time?
- Is the rule maintained under Masters or configuration with ownership and audit history?

If the answer is yes, define the rule as scoped, versioned configuration or master data. Do not hide it in conditionals, display labels, seed data, or frontend validation only.

## Palm Oil ERP/MES configurability checklist

Review each capability against the following variable dimensions:

| Dimension | Examples that must not be hard-coded |
|---|---|
| Organization | tenant, legal company, operating company, mill, line |
| Process | route version, operation sequence, station, machine, capacity |
| Materials | FFB grade, CPO, PK, by-product, lot, UOM and conversion |
| Quality | specification, sampling plan, test method, limit, hold/release rule |
| Weighing | device, gross/tare/net policy, tolerance, ticket numbering |
| Commercial | contract type, allocation, price basis, penalty/bonus, settlement |
| Operations | shift calendar, working hours, downtime reason, loss reason |
| Workflow | statuses, approvals, delegated authority, segregation of duties |
| Compliance | MPOB, MSPO, RSPO, EUDR, Halal/Kosher, document requirements |
| Localization | currency, tax, language, timezone, calendar, decimal precision |

For each variable, identify its owner, scope, effective dates, version, approval policy, and historical behavior.

## Requirement template

Use this template before defining API or database contracts:

```markdown
## Capability: <verb + business outcome>

### Business problem
<Who has which problem, risk, cost, or compliance need?>

### Actor and scope
- Primary actor: <role or system>
- Tenant/company/mill/line scope: <scope and authorization rule>
- Related master data: <materials, routes, equipment, quality, etc.>

### Capability statement
<The actor/system must be able to ...>

### Business rules
- <Rule that must always hold>
- <Configurable rule and its scope/version>
- <Exception, correction, or reversal rule>

### Acceptance criteria
#### Scenario: <successful outcome>
Given <known context and starting state>
When <actor performs one business action>
Then <observable business result>
And <audit, state, or integration result>

#### Scenario: <invalid or unauthorized outcome>
Given <known invalid context>
When <actor attempts the action>
Then <defined rejection and no partial posting>

### Evidence of delivery
- Automated tests: <test cases>
- Contract or integration evidence: <schema/event/API>
- Audit/observability evidence: <event, log, metric>

### Open decisions
- <Unresolved business, compliance, or configuration question>
```

## Example: configurable mill capability

```markdown
## Capability: Release a quality-held product lot

### Business problem
Operations must prevent product lots from being dispatched before the
applicable mill and product quality requirements are satisfied.

### Actor and scope
- Primary actor: Quality Approver
- Scope: authorized tenant, company, mill, product, and lot
- Configuration: effective-dated product specification and release policy

### Capability statement
The Quality Approver must be able to evaluate a held lot against the
applicable approved specification and release it only when the configured
release conditions are satisfied.

### Acceptance criteria
#### Scenario: lot meets configured release conditions
Given a lot is held at an authorized mill
And the lot has all required test results for the active specification version
When the Quality Approver approves the evaluation
Then the lot changes to RELEASED
And the system records the specification version, approver, timestamp, and audit event

#### Scenario: lot fails a configured condition
Given a lot has a result outside the active specification limit
When the Quality Approver attempts release
Then the system rejects the action with a clear reason
And the lot remains HELD
And no dispatchable inventory is created
```

The example does not assume a particular screen, database schema, lab device, or quality formula. The specification, required tests, and release policy are configurable and historically traceable.

## Review gate

Do not advance a capability to contract design until the reviewer can answer “yes” to every question:

- Is the business problem and intended outcome explicit?
- Can two people interpret the requirement the same way?
- Does it describe one logical capability?
- Can success and failure be demonstrated with tests or other evidence?
- Is the statement independent of implementation choices?
- Are tenant, company, mill, line, and permission boundaries explicit?
- Are variable Palm Oil ERP/MES practices represented as scoped, versioned configuration?
- Are state transitions, reversals, audit events, and integration effects identified?
- Are unresolved decisions recorded instead of silently assumed?

Only after this gate passes should the team define the versioned API contract, relational data contract, architecture boundary, implementation, tests, static checks, security checks, human review, and merge plan required by the repository pipeline.
