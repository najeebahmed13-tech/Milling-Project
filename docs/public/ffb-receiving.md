# Phase 6 — FFB Receiving, Grading and Vehicle Exit

## Implemented boundary

The Stock → FFB Receiving workflow now uses one server-backed `ffb_receipts` record for:

`FIRST_WEIGHT_RECORDED → GRADING_COMPLETED → READY_TO_POST`

The same Weighbridge Ticket connects first weighing, grading and vehicle exit. Gross and tare are stored by the API and net weight is calculated server-side as:

`Net Weight = Gross Weight - Tare Weight`

The UI provides a listing, search, ticket detail drawer, first weighing form, grading form and vehicle-exit form.

## Controlled fields

- First weighing: vehicle, type, driver, supplier, supplier category, supplier plant, transporter, delivery order, product and gross weight.
- Grading: grading ID, ripeness input, ramp, grader and result.
- Vehicle exit: tare weight, operator and timestamp; net is authoritative from the server.

Operator is currently the local demo user `Sean Shapiro` because authentication is not yet connected to the API. Ramp and ripeness remain controlled/configuration-dependent and are not assigned invented thresholds.

## State machine

```text
FIRST_WEIGHT_RECORDED → GRADING_COMPLETED → READY_TO_POST
```

Invalid stage order is rejected by the API. Duplicate second weighing is rejected because only `GRADING_COMPLETED` tickets can enter vehicle exit.

## Explicit blockers

Final posting is intentionally not enabled until the business confirms:

1. Whether Purchase Contract utilization uses Net Weight or Accepted Quantity.
2. Whether rejected FFB remains on the vehicle during tare weighing.
3. How partial-rejection quantity is determined.
4. Whether receiving may proceed without a Purchase Contract.
5. The approved ripeness categories, thresholds and grading-rule version.
6. The configured Ramp master and authorized grader permissions.

Because those rules are unresolved, the implementation does not create contract allocations, FFB Lots or inventory movements. This prevents a false posting chain.

## Next implementation boundary

After the business rules are approved, add one atomic `finalizeFFBReceipt()` transaction that creates the accepted FFB Lot, contract allocation and Material Ledger receipt at the configured FFB Ramp, with audit and idempotency protection.
