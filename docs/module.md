# Domain Module Guide

**Status:** Engineering standard  
**Scope:** Public repository domain modules  
**Related documents:** [`architecture.md`](architecture.md), [`coding-standards.md`](coding-standards.md), [`Domains.md`](Domains.md)

## Purpose

This document defines how ROCKEYE ERP + MES domain modules are identified, structured, integrated, tested, and secured. A module is an independently maintainable business boundary inside the modular monolith. It owns its business rules and data, while exposing explicit application interfaces to other modules.

Modules must support the full organization hierarchy:

```text
Tenant / Group
  └─ Legal company
      └─ Operating company
          └─ Mill / site
              └─ Production line
                  └─ Station / machine / storage unit
```

All records, commands, queries, permissions, configuration, and audit events must carry or derive the appropriate tenant and operating context.

## Module responsibilities

Each module must document and own:

- its business capability and authoritative source of truth;
- its aggregates, state transitions, invariants, and correction/reversal rules;
- its relational tables, migrations, indexes, and foreign-key constraints;
- its commands, queries, DTOs, error codes, and idempotency behavior;
- its permissions, approval requirements, and audit events;
- its tenant, company, mill, line, and time-zone scope;
- its configurable masters and versioned rules;
- its integration events and dependencies;
- its automated tests and operational observability.

Master data is maintained through the **Masters** menu. Operational modules consume validated master records and execute transactions; they must not create customer-specific hard-coded definitions in application logic.

## Standard module layout

Use the repository's established structure where applicable. A module should keep transport, application, domain, persistence, and contract concerns separate:

```text
modules/<module-name>/
├─ README.md                 # module purpose, ownership, and runbook links
├─ domain/                   # entities, value objects, policies, state machines
├─ application/              # commands, queries, transaction orchestration
├─ ports/                    # interfaces for repositories and external services
├─ infrastructure/           # database adapters, event handlers, integrations
├─ contracts/                # module-owned DTOs, errors, and event schemas
└─ tests/                    # unit, contract, integration, and security tests
```

The exact language or framework may vary, but the dependency direction must remain:

```text
HTTP/UI adapter → application → domain
                         ↑
                 infrastructure through ports
```

Domain code must not depend on HTTP, database drivers, UI components, or another module's tables.

## Ownership and dependency rules

1. Platform/security establishes tenant context, identity, authorization, numbering, and shared settings.
2. Masters owns reusable reference data such as materials, UOMs, locations, equipment, routes, quality specifications, and sampling plans.
3. Operational modules own their transactions and state transitions. They call another module through an application interface or consume a versioned event.
4. Inventory and Storage owns material movements, balances, reservations, lots, and reversals. Other modules request postings; they do not update inventory tables directly.
5. Reporting reads projections or approved read interfaces. It never mutates operational data.
6. Audit and Notifications receive business events but do not become the source of truth for the originating transaction.
7. Circular dependencies are resolved with stable IDs, ports, commands, or local events.

Never use display names as relationships, write across module-owned tables, or expose mutable internal entities as public API contracts.

## Commands, queries, and state

Commands represent business intent and must enforce authorization, tenant scope, validation, concurrency, idempotency, and transaction boundaries on the server. Clients must not supply authoritative values such as `tenantId`, `postedBy`, `status`, ledger balances, or derived quantities.

Queries must be tenant-scoped, paginated, filterable, and safe for the caller's permissions. Critical commands should use a standard idempotency key scoped to tenant, command type, and client key. Stale editable records must return a conflict error rather than silently overwriting changes.

Posted operational records are immutable. Corrections use an explicit reversal, amendment, or compensating transaction that preserves the original record and emits an audit event.

Typical lifecycle states should be explicit and validated, for example:

```text
DRAFT → SUBMITTED → APPROVED → POSTED → REVERSED
```

Allowed transitions, required roles, approval rules, and exception paths must be configurable when they vary by tenant, company, mill, or regulatory context.

## Contract requirements

Before implementation, define versioned contracts for:

- request and response DTOs;
- pagination, filtering, and sorting;
- validation and standard error envelopes;
- idempotency and concurrency behavior;
- database tables, constraints, indexes, and migrations;
- integration events, correlation IDs, and retry semantics.

Use decimal database types for quantities and money, store units of measure with quantities, persist timestamps in UTC, and render them using the applicable tenant or mill time zone. Version any route, quality, costing, inventory, or compliance rule whose historical interpretation must be preserved.

## Module definition template

Every new module or materially changed module should include the following section in its `README.md` or design record:

```markdown
# <Module name>

## Capability and owner
## In-scope and out-of-scope responsibilities
## Aggregate and state-transition model
## Owned tables and data-retention rules
## Configuration and versioned masters
## API commands, queries, errors, and idempotency
## Permissions, approvals, and audit events
## Tenant/company/mill/line scope
## Dependencies and integration events
## Transaction and concurrency boundaries
## Tests, metrics, logs, and alerts
```

## Delivery checklist

Implement module work through the repository's nine-stage pipeline:

1. **Requirement:** write an INVEST story and Gherkin acceptance criteria scoped to the organization hierarchy.
2. **Contract:** define API, database, error, and event contracts before business logic.
3. **Architecture boundary:** identify ownership, dependencies, invariants, permissions, tenant filters, and transaction boundaries.
4. **Implementation:** keep rules configurable and preserve domain boundaries.
5. **Tests:** cover calculations, happy paths, state transitions, retries, reversals, authorization failures, and cross-tenant isolation.
6. **Static checks:** run the repository build and type/syntax checks with zero errors or warnings.
7. **Security checks:** verify deny-by-default authorization, parameterized queries, tenant isolation, and audit emission.
8. **Human review:** present the diff, contracts, risks, and unresolved domain decisions for sign-off.
9. **Merge:** merge only after all gates pass and migration/post-merge verification is complete.

## Review questions

- Is this capability owned by the correct module?
- Can one tenant, company, or mill access another one's data through any command, query, event, export, or file URL?
- Are all business invariants enforced server-side and within a transaction?
- Are posted records corrected through controlled reversal rather than edited or deleted?
- Are configuration and master-data dependencies explicit and historically versioned where needed?
- Can the module handle pagination, concurrency, retries, duplicate requests, and partial failures?
- Are permissions, audit events, observability, and negative tests included?
