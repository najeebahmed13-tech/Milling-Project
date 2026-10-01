# ADR-003 — Inventory Ledger and Explicit Material Genealogy

**Status:** Accepted for initial implementation  
**Date:** 2026-09-30

## Decision

Treat append/reversal-only `material_movements` as the stock history and maintain `inventory_balances` as a transactional projection. Link source and destination material lots through movement records and a derived genealogy edge projection.

## Consequences

FFB can branch into oil, EFB, fibre, kernel, shell, sludge, and loss streams without collapsing the process into a single conversion. Stock checks remain fast, while balances can be rebuilt and reconciled from the ledger. Mass-balance tolerances remain configurable and are not invented by the architecture.
