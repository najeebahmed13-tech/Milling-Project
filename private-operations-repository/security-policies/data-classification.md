# Data Classification Policy

1. **PUBLIC (Green):**
   - Application documentation, open REST contracts, public UI styling guides.
2. **CONFIDENTIAL (Amber):**
   - Mill operational records, weighbridge tickets, supplier deliveries, FFB receipts, production run batch numbers, and stock ledger movements.
   - Access restricted to authenticated users within the same tenant.
3. **RESTRICTED (Red):**
   - Encryption keys, database master credentials, audit log secret chaining keys, risk engine scoring parameters, and proprietary extraction formulas.
   - Stored in Hardware Security Modules (HSM) or dedicated key vaults.

