# Phase 2 — Security, Threat Model, and Operational Controls

## Security Boundaries

1. Browser is untrusted and may submit altered IDs, quantities, statuses, tenant IDs, and timestamps.
2. API authenticates the caller and derives tenant/mill scope from the session/membership.
3. Application services authorize action permissions and resource scope.
4. Repository/data-access layer applies tenant and mill predicates and database row-level controls.
5. PostgreSQL transactions enforce integrity, uniqueness, and atomic posting.
6. Object storage is private; file access uses authorized short-lived links.

## Tenancy Strategy

Use a shared PostgreSQL schema with mandatory `tenant_id` on tenant-owned tables and `mill_id` where operationally scoped. Enable PostgreSQL Row Level Security as defense-in-depth. The API starts a transaction, sets a trusted transaction-local tenant/membership context after authentication, and repositories also include explicit tenant predicates. RLS is not the only control; service authorization and repository scoping remain mandatory.

Cross-tenant identifiers submitted by a client must resolve to no resource or an authorization error. Never accept a client-supplied tenant as authority.

## Authentication and Sessions

Prefer an OIDC-compatible identity provider with secure, HTTP-only, SameSite cookies for the browser session. If local auth is required, use an adaptive password hash, MFA-ready design, password reset protections, session rotation, logout revocation, and rate limits. Tokens, passwords, and secrets never enter logs or audit values.

## Authorization

Permissions are action-oriented and checked through `authorize(permission, resourceContext)`. Scope includes tenant, mill, and where applicable resource ownership/state. UI hiding is convenience only; API services are authoritative.

Examples: `weighbridge.record`, `ffb_receipt.confirm`, `ffb_grading.perform`, `inventory.transfer`, `inventory.adjust`, `production_batch.start`, `quality_sample.record`, `quality_result.override`, `dispatch.approve`, `dispatch.post`, `audit.read`.

## Threat Model

| Threat | Attack/failure scenario | Prevention | Detection/audit evidence |
|---|---|---|---|
| Cross-tenant access | User changes an ID or tenant filter to retrieve another tenant's receipt | membership-derived context, repository predicates, RLS, tenant isolation tests | denied request with tenant/user/correlation ID; security alert |
| Privilege escalation | Operator calls approve/post endpoint directly | action-level permission checks, state transition guards, no role-name checks | authorization failure audit; permission-change audit |
| Forged weighbridge data | Client alters gross/net or repeats ticket | server-side calculation, device/source metadata, immutable weighments, override permission/reason | old/new values, override reason, operator/device audit |
| Inventory manipulation | User edits a balance or posts negative stock | ledger-only writes, balance locks, DB checks, reversal-only corrections | movement and adjustment audit; reconciliation alert |
| Contract over-utilization | Concurrent receipts consume final balance twice | transaction + row lock/version + fulfilment uniqueness | rejected conflict and contract allocation history |
| Unauthorized grading | Result edited after posting | state guard, quality permission, versioned correction | old/new result, reason, actor |
| Quality-result manipulation | Out-of-spec result hidden before dispatch | append/correct audit, release policy, dispatch checks quality status | quality history, hold/release audit |
| Dispatch manipulation | Duplicate or over-quantity dispatch | idempotency, stock/contract locks, atomic posting | command key, ledger, dispatch audit |
| Malicious upload | Executable or oversized file uploaded | MIME/extension/size checks, malware scan, private storage, safe download | file metadata, scan state, uploader |
| Duplicate posting | Retry after timeout posts receipt twice | idempotency key + unique constraint + original-result replay | command key and event reference |
| Audit tampering | Application user edits audit records | append-only table, restricted DB role, export/retention controls | failed write alerts, checksum/retention evidence |

## Input and Output Controls

- Validate DTOs at the API boundary and enforce database constraints.
- Use parameterized queries/ORM bindings; never concatenate user input into SQL.
- Encode output and sanitize rich text; avoid raw HTML in user-controlled fields.
- Restrict CORS to approved origins and use CSRF protection for cookie-authenticated state changes.
- Set security headers including CSP, frame restrictions, content-type sniffing protection, and referrer policy.
- Return stable business error codes without stack traces.

## Audit and Observability

Audit and application logs are separate. Audit records capture actor, tenant, mill, action, entity, old/new values where appropriate, reason, timestamp, correlation ID, and command/idempotency key. Structured logs capture duration, module, operation, result, and error code while excluding secrets and unnecessary sensitive data.

## Residual Risks

RLS configuration, identity-provider settings, malware scanning, backup protection, production secrets, and deployment hardening must be tested in the target environment. The architecture reduces risk but does not eliminate it.
