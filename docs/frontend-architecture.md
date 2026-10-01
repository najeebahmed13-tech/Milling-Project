# Phase 3 — Frontend Architecture

## Current Stack

- Vite 7
- Browser-native JavaScript modules
- CSS design tokens and responsive styles
- Node built-in test runner for pure foundation tests
- No frontend auth provider or backend currently connected

The Phase 2 TypeScript modular-monolith decision applies to the future API. The current frontend stays JavaScript because that is the existing repository stack; converting the entire client to TypeScript is a deliberate future decision, not a silent Phase 3 rewrite.

## Structure

```text
src/
  app/             navigation configuration
  security/        permission and user-context helpers
  services/        centralized API client
  shared/          formatters and normalized errors
  app.js           current composition layer and demo state
  styles.css       visual tokens and shell styles
  forms.css        form/modal-specific styles
tests/             pure foundation tests
```

The current `app.js` remains the composition layer for the prototype. Before Phase 4 expands real modules, split views into domain modules and move state/data access behind services. This is intentional technical debt, not a new architectural boundary.

## Context and Authorization

`demoUserContext` exposes only safe display/context fields and a permission set. `can(permission, context)` is a frontend UX helper; backend authorization remains authoritative. The API client sends credentials and supports a mill-context header, but the backend must derive and validate tenant/mill scope from the authenticated session.

## API Client

`apiRequest()` centralizes base URL, credentials, JSON handling, timeout, cancellation, tenant-context transport, and `ApplicationError` normalization. It is ready for API services but is not used to fabricate business data while the backend does not exist.

## Data Fetching

The current reference slice uses local demo state. Production lists must move to server-side pagination, sorting, filtering, and search. Critical postings must wait for confirmed server success and must use idempotency/version handling from Phase 2.

## Environment

Use `.env.example` as the safe placeholder contract. Secrets must not be placed in Vite-exposed variables. Browser-exposed variables are limited to non-secret public configuration such as API base URL and product label.
