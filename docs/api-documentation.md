# API Documentation and Management

## Published API contract

The versioned OpenAPI contract is maintained at [`core/contracts/openapi.json`](../core/contracts/openapi.json).

When the server is running, the following endpoints are available:

- Swagger UI: `GET /api/docs`
- OpenAPI JSON: `GET /api/openapi.json`

The documentation describes the current API surface and also records production requirements that are not yet fully enforced, such as bearer authentication and mandatory idempotency for mutations.

## Contract ownership

Each module owns its API operations, request/response schemas, permissions, state transitions, error codes, and integration events. Changes must be made in this order:

1. Update the module FRD and requirement traceability IDs.
2. Define or revise the OpenAPI operation, DTO schema, errors, and event references.
3. Review tenant/company/mill scope, authorization, idempotency, concurrency, pagination, and audit behavior.
4. Implement the server handler and client integration.
5. Add contract, integration, negative, and security tests.
6. Verify Swagger UI and the generated JSON before human review.

## API management rules

- Use `/api/v1` for the production versioned API. Existing `/api` routes are the current prototype surface and must be migrated or explicitly marked legacy before production release.
- Every mutation requires an authenticated principal, authorized tenant and mill context, a permission check, an idempotency key, and a documented transaction boundary.
- The server must derive tenant and organization scope from authenticated claims or a trusted context service. Client-supplied headers are context selectors, not proof of authorization.
- Use standard error envelopes with a stable `code`, human-readable `message`, optional `details`, and a `correlationId`.
- Use cursor or page pagination, bounded page size, explicit sorting, and documented filters for collection endpoints.
- Return `409` for stale versions, duplicate business numbers, invalid state transitions, and idempotency conflicts.
- Never expose secrets, internal stack traces, SQL text, or unredacted personal data in API responses or OpenAPI examples.
- Deprecate endpoints with documentation, an announced sunset date, a replacement link, and telemetry before removal.
- Keep OpenAPI examples tenant-neutral and avoid real supplier, customer, employee, weighbridge, or certificate data.

## Production readiness gates

The Swagger page is documentation, not authorization. Before exposing the API externally, complete:

- real authentication and server-side RBAC;
- tenant isolation tests for every read and mutation;
- request schema validation and response contract tests;
- rate limits, security headers, strict CORS, request-size limits, and audit logging;
- idempotency and concurrency behavior for critical commands;
- API metrics, correlation IDs, structured logs, health/readiness checks, and alerting;
- versioned migrations and rollback-compatible deployment procedures.
