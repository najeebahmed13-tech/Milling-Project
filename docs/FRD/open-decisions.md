# Open Decisions

| ID | Decision | Why it matters | Owner |
|---|---|---|---|
| OD-001 | PostgreSQL topology and migration strategy | production durability, reporting, tenant isolation | Architecture |
| OD-002 | Identity provider and authentication protocol | SSO, MFA, service accounts, support access | Security |
| OD-003 | Tenant isolation model | shared schema, separate schema, or database per tenant | Architecture/Security |
| OD-004 | Approval authority matrix | commercial, quality, inventory, production, reversal controls | Product/Finance |
| OD-005 | Weighbridge hardware/protocol | authoritative capture and offline behavior | Operations |
| OD-006 | Quality specifications and release policy | product, mill, method, sampling, hold/release rules | Quality |
| OD-007 | Production mass-balance basis | outputs, losses, moisture, OER, 30/70/VCT interpretations | Process Owner |
| OD-008 | Finance/tax/accounting scope | invoice, tax, currency, posting, reconciliation | Finance |
| OD-009 | Certification and regulatory scope | MPOB, MSPO, RSPO, EUDR, Halal/Kosher | Compliance |
| OD-010 | Availability, RPO, RTO, retention, and volume targets | infrastructure sizing and operational commitments | Operations |
| OD-011 | Offline mode boundary | weighbridge, receiving, quality, dispatch, conflict handling | Operations |
| OD-012 | Country/localization baseline | languages, currencies, tax, calendars, document formats | Product |

No implementation should silently invent a value for an open decision that changes domain behavior, compliance, data ownership, or historical interpretation.
