# Calculation and Validation Catalogue

## Quantity and UOM

| ID | Rule |
|---|---|
| `BR-CALC-001` | Every quantity stores a numeric value and UOM; incompatible UOM categories cannot be converted. |
| `BR-CALC-002` | UOM conversions use an approved, effective-dated conversion; the applied conversion ID/version is retained in the transaction. |
| `BR-CALC-003` | Persisted business quantities use decimal/numeric semantics; rounding occurs only at configured presentation or posting boundaries. |
| `BR-CALC-004` | Negative quantity is allowed only for explicitly defined reversal/adjustment movement types. |
| `BR-CALC-005` | Quantity precision and rounding are scoped by material/UOM/country policy and must be consistent across UI, API, database, and reports. |

## Weighbridge

| ID | Rule |
|---|---|
| `BR-CALC-006` | `net = gross - tare` or the configured inverse direction; net must be positive unless a controlled void/correction state applies. |
| `BR-CALC-007` | Received disposition must reconcile: accepted + rejected + configured adjustment = authoritative net within configured tolerance. |
| `BR-CALC-008` | Outbound loaded quantity must reconcile to outbound weighment and dispatch tolerance before posting. |

## Production and palm oil outputs

| ID | Rule |
|---|---|
| `BR-CALC-009` | Operation balance uses the active route/process rule: total inputs = declared outputs + by-products + losses + approved adjustment within configured tolerance. |
| `BR-CALC-010` | OER, KER, yield, recovery, and loss formulas are configuration/version controlled and must identify source quantities, basis, UOM, date/shift, and formula version. |
| `BR-CALC-011` | CPO, palm kernel, co-products, waste, and loss are distinct output categories; categories cannot be inferred from display labels. |
| `BR-CALC-012` | If a process basis such as 30/70 separation, VCT, moisture basis, or loss allocation is not approved, the system must record the value as unavailable or require an Open Decision—not guess. |

## Quality

| ID | Rule |
|---|---|
| `BR-CALC-013` | Numeric result evaluation applies the active parameter data type, precision, UOM conversion, min/max, warning, exact-match, or categorical rule. |
| `BR-CALC-014` | Aggregate quality result is deterministic: any mandatory FAIL yields FAIL; otherwise configured WARNING yields WARNING; otherwise PASS. |
| `BR-CALC-015` | Required sampling frequency—hour, shift, cycle, day, batch, or event—is configuration; duplicate sample identity is rejected. |

## Commercial and finance

| ID | Rule |
|---|---|
| `BR-CALC-016` | Contract utilization = approved quantity − posted fulfillment ± approved adjustment; allocation cannot exceed remaining quantity plus tolerance. |
| `BR-CALC-017` | Invoice line total = quantity × unit price, with tax, currency, and rounding basis from approved configuration. |
| `BR-CALC-018` | Financial and operational totals retain source quantity, price, currency, tax, rounding, and rule/configuration versions. |

## Validation catalogue

- Mandatory fields are validated server-side and include scope, actor, master IDs, dates, state, quantity/UOM, and reason where required.
- Unique business numbers are scoped to tenant/company/mill/transaction type according to numbering configuration.
- Effective-dated configurations cannot overlap where a single applicable rule is required.
- Foreign keys and ownership predicates prevent cross-tenant, cross-company, and unauthorized mill references.
- API payloads are schema-validated; unknown or forbidden authoritative fields such as status, tenant ID, postedBy, balance, and derived net quantity are rejected or ignored according to contract policy.
- Bulk import validates all rows before commit or produces a controlled partial-result policy explicitly approved for that import type.
