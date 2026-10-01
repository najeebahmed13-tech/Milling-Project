# ADR-002 — Shared Schema with Defense-in-Depth Tenant Isolation

**Status:** Accepted for initial implementation  
**Date:** 2026-09-30

## Decision

Use a shared PostgreSQL schema with mandatory tenant keys, mill scoping, repository predicates, server-side membership checks, and PostgreSQL RLS as defense-in-depth.

## Alternatives

- Database per tenant: stronger physical isolation but higher provisioning, migration, reporting, and operational complexity for the first release.
- Schema per tenant: isolates namespaces but complicates migrations and cross-tenant platform operations.

## Consequences

Every tenant-owned entity and query requires deliberate scoping. RLS policies and tenant-isolation tests become release gates. A future high-isolation tenant can be migrated only after operational requirements justify it.
