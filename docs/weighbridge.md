# Phase 6 — Inbound Weighbridge

## Current Implementation

The frontend provides a manual/test capture boundary with explicit first/second weighment order. It does not claim hardware integration.

Each receipt records:

- first weight
- second weight
- first-weight type
- gross
- tare
- net
- UOM
- vehicle
- supplier
- purchase contract
- weighbridge business reference

## Hardware Boundary

Future integrations must use a `WeightCaptureProvider`/adapter boundary. Device-specific code must not be placed in FFB receipt business rules.

Potential sources are manual entry, serial/device adapter, or external API. Raw device metadata should be retained only where required for audit/investigation.

## Controls Required in Backend

- Server-side net calculation
- Idempotency for duplicate capture/retry
- Explicit weighbridge state transitions
- Manual override permission/reason if permitted
- Immutable completed weights with controlled correction/reversal
- Tenant and mill access checks
- Numbering sequence allocation under database transaction

## Operational UI

The receiving screen prioritizes supplier, contract, vehicle, current weight, acceptance quantities, and status. Details show the weight summary and traceability chain. The final posting action is visibly blocked while the architecture-critical utilization decision is unresolved.
