# ADR-004 — Action-Level RBAC and Append-Only Audit

**Status:** Accepted for initial implementation  
**Date:** 2026-09-30

## Decision

Authorize commands by named action permission plus tenant/mill/resource context. Critical transitions, corrections, overrides, permission changes, and failed authorization attempts produce audit evidence. Audit records are append-only and separate from application logs.

## Consequences

The UI cannot be the security boundary and role names cannot be used as business logic. New commands require explicit permission mapping and tests. Audit storage and retention must be protected operationally.
