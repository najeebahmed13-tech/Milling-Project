# Direct Purchase and Purchase Invoice

## Requirement

As a mill operator, I can record a direct purchase of FFB or a configured consumable for my selected mill so that the system creates a traceable Finance purchase invoice without re-keying the transaction.

## Acceptance criteria

- Given an active supplier and active Item Master item, when the operator submits at least one positive purchase line, then the purchase and mapped invoice are created atomically.
- Given a missing Idempotency-Key, when the command is submitted, then it is rejected without a purchase or invoice.
- Given the same tenant and Idempotency-Key is submitted again, when the command is retried, then the original invoice is returned and no duplicate is created.
- Given a different tenant or mill context, when invoices are listed or opened, then records outside that context are not returned.
- Given a created invoice, when the operator opens Finance > Purchase Invoice, then its supplier, source purchase, totals, status, and line details are visible.

## Boundary and state

Supplier owns the Direct Purchase command. Finance owns the Purchase Invoice read model. Item Master supplies item identity and UOM. The command writes purchase, invoice, line, and audit records in one transaction; invoice history is corrected through future finance commands rather than silent deletion.
