# Phase 2 — Solution Architecture

**Status:** Proposed architecture; Phase 2 quality gate partially complete pending business decisions listed in `docs.md`.  
**Date:** 2026-09-30

## Phase 2 Input Assessment

- **Requirements baseline found:** `docs.md` contains Phase 0/1 discovery, glossary, actors, module map, initial INVEST stories, Gherkin criteria, KPI definitions, security baseline, assumptions, and open questions.
- **Existing technology stack:** Vite 7 frontend, browser-native JavaScript/CSS, in-memory seed data with browser `localStorage` for the first receiving workflow. No backend, database, authentication, migration system, or automated test suite exists yet.
- **Existing architecture:** Single-page frontend prototype. It is a Phase 3 shell, not a production architecture.
- **Existing database state:** None.
- **Important business rules:** tenant isolation, server-side authorization, controlled state transitions, immutable/controlled-reversal inventory ledger, contract quantity protection, weighing validation, accepted/rejected reconciliation, auditable critical transactions, configurable quality rules.
- **Unresolved TBDs:** authoritative route connector directions, exact grading/specification rules, 30%/70% separation basis, VCT meaning, jurisdiction/tax/document rules, weighing hardware, accounting integration, UOM precision, release/hold policy, approval matrix, SLOs.
- **Architecture-impacting assumptions:** modular monolith; TypeScript backend; PostgreSQL; shared schema with tenant keys and database row-level defense; object storage for files; UTC persistence with mill-local presentation.
- **Blockers:** do not implement production postings, quality holds, or engineering mass-balance constraints until the process owner confirms source rules.

## Chosen Architecture

Use a modular monolith with a TypeScript API/application layer and PostgreSQL. The frontend remains a separate Vite client. Each domain module owns its application services and persistence mappings; cross-module writes occur through commands/services, not arbitrary table manipulation.

```text
Browser SPA (Vite)
        │ HTTPS / JSON API
        ▼
TypeScript modular monolith
  ├─ authentication / tenant context / authorization
  ├─ master data and configuration
  ├─ commercial / procurement
  ├─ weighbridge / receiving
  ├─ production planning / execution
  ├─ quality
  ├─ inventory / storage
  ├─ dispatch
  ├─ documents / notifications / reporting
  └─ audit / observability / outbox
        │
        ├─ PostgreSQL (transactional source of truth)
        ├─ Object storage (documents, PDFs)
        └─ Job worker (PDFs, schedules, notifications, exports)
```

The first backend implementation should use a single deployable service and a separate worker process only when asynchronous work is introduced. Microservices are not justified by the current requirements.

## Module Boundaries and Dependencies

| Module | Owns | Depends on | Exposes |
|---|---|---|---|
| Platform | tenants, companies, mills, users, memberships, roles, permissions, settings, numbering | none | tenant context, authorization, numbering |
| Master Data | customers, suppliers, materials, UOM, vehicles, locations, tanks, lines, process definitions, quality masters | Platform | validated reference lookups |
| Commercial | sales/purchase contracts, contract lines, delivery orders | Platform, Master Data | contract availability/allocation commands |
| Weighbridge | weighbridge devices, weighments, tickets, vehicle movements | Platform, Master Data, Commercial references | authoritative gross/tare/net commands |
| Receiving | supplier deliveries, FFB receipts, FFB lots, grading, rejection | Platform, Master Data, Commercial, Weighbridge, Inventory interface | confirm/reverse receipt commands, lot traceability |
| Production Planning | capacity, plans, batch scheduling | Platform, Master Data, Inventory availability | plan/batch commands |
| Production Execution | process batches, operations, inputs, outputs, by-products, losses | Platform, Master Data, Planning, Inventory, Quality reference | operation commands, genealogy queries |
| Quality | sampling plans, schedules, samples, results, evaluations, holds | Platform, Master Data, Production/Inventory references | quality result commands, release/hold decisions |
| Inventory & Storage | material lots, movement ledger, balances, reservations, locations, tanks | Platform, Master Data | stock availability, posting/reversal commands |
| Dispatch | dispatch orders, loading, outbound weighbridge references, dispatch documents | Platform, Master Data, Commercial, Inventory, Quality, Weighbridge | approve/post/reverse dispatch commands |
| Documents | document metadata, templates, render jobs, attachments | Platform, all modules through references | secure document generation/download |
| Reporting | read models, KPI queries, exports | all modules through read interfaces/events | dashboard/report queries |
| Audit & Notifications | audit events, outbox, notifications | Platform; receives events from modules | audit search, notification delivery |

### Dependency rules

1. Platform and Master Data are foundational; they do not depend on operational modules.
2. Operational modules call another module's application interface or publish a local domain event; they do not update another module's tables directly.
3. Inventory is the only owner of stock movements and balances.
4. Reporting reads projections/read models and must not mutate transactional aggregates.
5. Audit captures business events from every module but does not own the source transaction.
6. Circular dependencies are resolved through IDs, ports/interfaces, and local events.

## Request/Command Boundaries

Queries are safe, paginated, tenant-scoped reads. Business commands enforce state, permission, idempotency, and transaction boundaries.

Examples:

```text
GET  /api/v1/ffb-receipts?millId=...
GET  /api/v1/ffb-receipts/{id}
POST /api/v1/ffb-receipts/{id}/grade
POST /api/v1/ffb-receipts/{id}/confirm
POST /api/v1/ffb-receipts/{id}/reverse
POST /api/v1/production-batches/{id}/operations
POST /api/v1/inventory/transfers
POST /api/v1/dispatches/{id}/post
```

Clients cannot set `status`, `tenantId`, `postedBy`, `netQuantity`, or ledger balances directly. The server derives or validates them.

## Transaction Boundaries

### Confirm FFB receipt

One database transaction must:

1. Lock and validate the receipt/weighbridge record.
2. Validate grading and accepted/rejected reconciliation.
3. Lock the relevant contract allocation/version if linked.
4. Create the FFB lot(s).
5. Post the receipt/rejection inventory movements.
6. Update contract fulfilment projection/record.
7. Transition the receipt to `POSTED`.
8. Write audit events and an outbox event.

### Post production operation

One transaction validates operation state and input stock, locks source balances, creates input/output/by-product/loss movements, creates/links material lots, transitions the operation, writes genealogy links, and emits `ProductionOperationPosted`.

### Post dispatch

One transaction validates contract availability, quality release policy, outbound weighing, stock availability, and dispatch state; then posts the dispatch movement, updates contract fulfilment, transitions dispatch, creates document jobs, and records audit/outbox entries.

## Concurrency and Idempotency

- PostgreSQL transactions are the consistency boundary.
- Use optimistic `version` columns on editable aggregates and return `409 CONCURRENT_UPDATE` on stale writes.
- Use row locks for contract utilization, stock consumption, sequence allocation, and dispatch/receipt posting.
- Every critical command accepts an idempotency key scoped to tenant + command type + client key. A unique constraint returns the original result on safe retry.
- Unique constraints protect business numbers per tenant/mill/sequence and prevent duplicate posted references.

## Time, Money, and Quantities

- Persist absolute timestamps as UTC; render in tenant/mill timezone.
- Use decimal/numeric database types for quantities and money; never binary floating-point for persisted business values.
- Quantity always includes UOM. Conversions are explicit, versioned, and limited to approved UOM categories.
- Currency, tax, price, and rounding rules remain disabled until jurisdiction and finance scope are confirmed.

## Background Work

Use a transactional outbox for events that require a worker: scheduled quality sample generation, PDF rendering, notifications, exports, and reporting refreshes. Workers must be idempotent, retry with bounded backoff, persist failure state, and expose correlation IDs.

## Documents and Files

Store metadata in PostgreSQL and binaries in private object storage. Downloads require a tenant-scoped authorization check and short-lived signed URL. Validate MIME type, extension, size, checksum, and malware scan status. Never execute uploaded content.

## Dashboard Read Model

Start with optimized read queries over indexed posted transactions. Add materialized/read-model tables only for measured performance needs. Each KPI stores a documented formula, source, date filter, tenant/mill scope, and refresh timestamp. Undefined extraction/utilization formulas stay out of production dashboards.

## Deployment Assumptions

- Separate web frontend and API deployment behind HTTPS.
- Managed PostgreSQL with automated backups and point-in-time recovery.
- Private object storage for documents.
- Secret manager/environment injection; no secrets in source.
- CI pipeline: install, type check, lint, unit tests, integration tests, build, migration check, dependency/security checks.
- Health endpoints distinguish liveness, readiness, database, object storage, and worker state.
