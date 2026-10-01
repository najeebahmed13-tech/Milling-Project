# ADR-001 — Modular Monolith

**Status:** Accepted for initial implementation  
**Date:** 2026-09-30

## Context

The ERP has tightly related transactional workflows across receiving, production, quality, inventory, and dispatch. The repository has no existing backend and does not yet have scale evidence requiring distributed deployment.

## Decision

Use a modular monolith with explicit domain modules, application services, repository boundaries, and local transactional events. Deploy one API initially; add a worker for genuinely asynchronous jobs.

## Alternatives

- Microservices: rejected for now because they add operational and transaction complexity before domain boundaries and volumes are proven.
- Single undifferentiated CRUD application: rejected because it weakens ownership, auditability, and transaction boundaries.

## Consequences

The system is simpler to deploy and can make receiving/ledger/contract operations atomic. Teams must preserve module boundaries inside one codebase and avoid direct cross-module table writes. Modules can be extracted later only with evidence.
