# Non-Functional Requirements

Numeric targets remain open decisions until workload and deployment sizing are approved. The following controls are mandatory regardless of final target numbers.

## Security and privacy

Authentication, deny-by-default RBAC, tenant isolation, parameterized queries, secret management, encryption in transit/at rest, secure file handling, audit events, rate limits, strict CORS, security headers, dependency scanning, and redacted logs.

## Reliability

Transactional posting, idempotent retries, optimistic concurrency, outbox delivery, bounded retries, failure queues, health/readiness checks, backup verification, restore drills, migration rollback plan, and disaster-recovery runbook.

## Performance and scale

Pagination, bounded queries, indexes, asynchronous exports, queue-backed integrations, measured read models, horizontal API scaling, and load tests for receiving, production, quality, inventory, and dispatch volume.

## Maintainability

Versioned contracts, relational migrations, domain boundaries, static checks, unit/integration/contract/security tests, structured logs, correlation IDs, metrics, traces, and documented ownership.

## Accessibility and localization

Accessible responsive UI, keyboard support, locale-aware dates/numbers/currency, mill time zones, multiple languages where enabled, configurable UOM precision, and regulatory document localization.
