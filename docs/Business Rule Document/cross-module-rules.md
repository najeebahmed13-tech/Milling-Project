# Cross-Module Business Rules

These rules are centralized and must not be independently redefined by individual modules.

| Rule ID | Rule | Trigger | System behavior | Priority |
|---|---|---|---|---|
| `BR-X-001` | Tenant isolation | Every read, write, event, export, file access, and background job | Resolve tenant from authenticated context; reject or return no data for another tenant | Critical |
| `BR-X-002` | Organization scope | A record references company, mill, line, station, location, or applicable scope | Validate the actor's scope and enforce it in the query/write predicate | Critical |
| `BR-X-003` | Active master dependency | A transaction selects a material, UOM, party, route, quality rule, location, equipment, or vehicle | Permit use only when the master is active and effective for the transaction date | High |
| `BR-X-004` | Historical master snapshot | A rule or master affects interpretation of a posted transaction | Store the effective version/reference used at posting; later edits do not rewrite history | Critical |
| `BR-X-005` | Posted immutability | Transaction reaches POSTED, COMPLETED, RELEASED, or CLOSED | Block ordinary edit/delete; require authorized reversal, amendment, or compensating transaction | Critical |
| `BR-X-006` | State transition control | Any status-changing command | Check current state, actor, preconditions, concurrency version, and allowed transition | Critical |
| `BR-X-007` | Idempotent mutation | Client/integration retries a command | Return original result for the same tenant, command type, and idempotency key | Critical |
| `BR-X-008` | Concurrency protection | Two actors update or post the same aggregate | Lock or compare version; return `409 CONCURRENT_UPDATE` without partial mutation | Critical |
| `BR-X-009` | Quantity integrity | A receipt, movement, production, dispatch, or adjustment posts quantity | Require UOM, decimal precision, positive/allowed sign, and reconciliation to source basis | Critical |
| `BR-X-010` | Audit-critical mutation | Create, approve, post, release, reject, reverse, configure, export, or permission change | Record actor, scope, timestamp, correlation ID, before/after, reason, and rule/config version | Critical |
| `BR-X-011` | Approval segregation | A transaction requires approval | Prevent the preparer from approving where segregation-of-duties policy forbids it | High |
| `BR-X-012` | Inventory source integrity | Inventory movement is requested | Require a valid originating business command; reject unexplained direct balance edits | Critical |
| `BR-X-013` | Quality hold enforcement | A lot/material has an active quality hold | Block configured downstream operations such as dispatch, consumption, or release | Critical |
| `BR-X-014` | Document numbering | A numbered record or document is created | Allocate a unique number within configured tenant/company/mill/transaction scope | High |
| `BR-X-015` | Standard error envelope | Any API validation, authorization, conflict, or server failure occurs | Return stable code, message, details where safe, and correlation ID; never leak stack/SQL/secrets | High |
| `BR-X-016` | Effective-date overlap | A versioned configuration is created or activated | Reject overlapping active versions where ambiguity is not allowed | High |
| `BR-X-017` | Event/outbox consistency | A committed mutation requires downstream processing | Write the outbox entry in the same transaction; retry delivery and expose failures | High |
| `BR-X-018` | Time and locale | Dates, shifts, reporting, or schedules are evaluated | Persist absolute timestamps in UTC and apply tenant/mill timezone and calendar for interpretation | High |

## Central ownership

Platform owns `BR-X-001` through `BR-X-008`, `BR-X-010`, `BR-X-014`, `BR-X-015`, `BR-X-016`, `BR-X-017`, and `BR-X-018`. Inventory owns `BR-X-009` and `BR-X-012`; Quality owns `BR-X-013`; Security/Platform owns `BR-X-011`. Modules consume the rules and do not fork them.
