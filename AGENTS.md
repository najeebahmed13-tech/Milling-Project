# ROCKEYE ERP + MES Engineering Rules

## Product scale and market

This repository is a commercial, modular, configurable, and scalable ERP + MES product for palm oil organizations of every size: small mills, medium operators, large enterprises, and multi-company conglomerates.

All implementation work must preserve this product direction.

## Mandatory architecture rules

- Keep domain modules independently maintainable with explicit boundaries, APIs, permissions, state transitions, and data ownership.
- Do not hard-code one customer's organization, mill, process route, station, machine, capacity, quality limits, numbering, approval path, shifts, documents, or business rules.
- Store operational rules in tenant/company/mill-scoped configuration or versioned master data where historical interpretation matters.
- Design for hierarchy: tenant/group → legal company → operating company → mill/site → production line → station → machine/storage unit.
- Scope business records and queries for tenant and operating context. Prevent cross-tenant access at server and data boundaries.
- Support multiple companies, mills, lines, shifts, currencies, time zones, languages, units of measure, and regulatory contexts without code forks.
- Prefer normalized relational records, stable identifiers, foreign keys, indexes, migrations, and transaction-safe posting over display-name references and unvalidated JSON blobs.
- Treat material movements, production execution, quality results, approvals, postings, reversals, and audit events as traceable business records.
- Keep route definitions separate from route execution. Version configurations that affect production, quality, costing, inventory, or compliance.
- Make workflows extensible through configuration: stages, machines, stations, rules, statuses, approvals, parameters, sampling plans, outputs, by-products, and loss reasons.
- Enforce permissions and business invariants on the server. Frontend permission checks are presentation controls only.
- Use controlled correction/reversal for posted operational transactions; do not silently edit or delete their history.
- Build APIs and UI components that support pagination, filtering, concurrency, idempotency, bulk volume, failure recovery, and observable errors.
- Keep master-data creation and maintenance under the main **Masters** menu. Operational modules consume masters and execute transactions.
- Preserve responsive, accessible enterprise workflows for desktop, tablet, and mobile use.

## Scaling expectations

- Small organizations may run a single tenant, company, mill, line, and simple approval workflow.
- Medium and large organizations may run multiple mills, lines, shifts, warehouses, teams, and integrations.
- Conglomerates may require multiple legal entities, operating companies, shared services, delegated administration, consolidated reporting, and strict data segregation.

The same codebase must support these profiles through configuration, permissions, deployment sizing, and optional modules rather than separate product variants.

## Disciplined Vibe Coding Principles & Pipeline

All AI agents and engineers working in this repository must strictly adhere to the disciplined vibe coding lifecycle. Never generate code directly from ambiguous prompts without passing through the required prior stages.

The sequential pipeline is mandatory:

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

1. **Requirement**: Formulate unambiguous business needs, INVEST user stories, and Gherkin acceptance criteria (`Given-When-Then`) scoped to the organization hierarchy (`tenant/company/mill/line`).
2. **Contract**: Define explicit, versioned API schemas (REST DTOs, idempotency keys, standard response/error envelopes) and database contracts (relational schema, DDL, constraints) before writing logic.
3. **Architecture boundary**: Enforce domain boundaries, modular monolith dependency rules, server-enforced business invariants, tenant isolation, and transactional atomicity. Never write across domain tables directly.
4. **Implementation**: Write clean, modular, maintainable code following established standards. No hard-coded business rules; use configurable masters and tenant context.
5. **Tests**: Verify business logic, calculations, state machine transitions, and negative edge cases with automated tests (`npm test`). Zero failures allowed.
6. **Static checks**: Validate bundle compilation, module resolution, syntax, and type safety (`npm run build`). Zero warnings or errors permitted.
7. **Security checks**: Enforce multi-tenant data isolation, server-side RBAC (deny-by-default), parameterized queries (zero SQL injection), and comprehensive audit trail emission for operational mutations.
8. **Human review**: Present structured diffs and rationale to the human reviewer. Solicit human sign-off on domain invariants, compliance rules, and architectural trade-offs.
9. **Merge**: Rebase or clean merge to mainline only after all automated test/static/security gates pass and human review is approved. Run migrations and verify post-merge stability.

Detailed coding standards and stage-by-stage checklists are maintained in [docs/coding-standards.md](docs/coding-standards.md).

## Repository Decomposition & Folder Structure

The project is architected across three repository tiers:

### 1. PUBLIC / MAIN REPOSITORY
- `apps/`: Application shells (`apps/web` for frontend SPA, `apps/api` for backend service).
- `modules/`: Decoupled domain business modules (`commercial/`, `receiving/`, `production/`, `inventory/`, `masters/`, `security/`).
- `packages/`: Foundational shared packages (`shared/`, `api-client/`, `config/`, `security/`).
- `core/contracts/`: Versioned API contracts, relational SQL DDL schemas, event contracts, error envelopes.
- `tests/`: Automated unit, contract, integration, and architectural structure test suites.
- `docs/public/`: Public engineering standards, data models, and architectural specifications.

### 2. PRIVATE CORE REPOSITORIES (`private-core-repositories/`)
- `risk-engine/`: Supplier default scoring and customer credit exposure evaluation.
- `pricing-engine/`: MPOB index-linked pricing and FFA/M&D penalty-bonus matrix.
- `policy-engine/`: Multi-tier approval workflows and weighbridge tolerance policies.
- `entitlement-engine/`: Multi-tenant licensing, plan quotas, and mill capacity caps.
- `security-engine/`: Cryptographic audit hash chaining and tenant isolation predicate generators.

### 3. PRIVATE OPERATIONS REPOSITORY (`private-operations-repository/`)
- `infrastructure/`: Container orchestration (`docker-compose.prod.yml`) and cluster topologies.
- `production/`: Production environment manifests, systemd service units, and secret guidelines.
- `security-policies/`: SOC 2 Type II controls, data classification, and network isolation policies.
- `runbooks/`: Disaster recovery, offline weighbridge buffering, and zero-downtime DB failover.
- `restricted-docs/`: Proprietary mass-balance models and confidential threat modeling.

## Delivery rule

Before adding a feature, identify its owning domain, scope level, configuration dependencies, permissions, audit events, state model, integration contract, and scaling behavior. Execute work strictly through the 9-stage Vibe Coding Pipeline. Avoid shortcuts that make the current demo appear complete while preventing production-grade multi-organization use later.


