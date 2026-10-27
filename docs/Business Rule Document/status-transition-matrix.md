# Status Transition Matrix

The following is the baseline state model. A module may add states only through an approved FRD/change request and must preserve the same controls for authorization, validation, concurrency, audit, and reversal.

| Aggregate | Lifecycle | Transition authority | Required controls |
|---|---|---|---|
| Tenant | `PROSPECT → ACTIVE → SUSPENDED → ARCHIVED` | Platform Administrator | provisioning, entitlement, isolation, audit |
| Master/configuration | `DRAFT → REVIEW → APPROVED → ACTIVE → RETIRED` | Master/Domain Approver | effective date, overlap, version snapshot |
| Sales contract | `DRAFT → SUBMITTED → APPROVED → ACTIVE → COMPLETED` | Commercial roles | customer, quantity, allocation, SoD |
| Purchase contract | `DRAFT → SUBMITTED → APPROVED → ACTIVE → FULFILLED` | Procurement roles | supplier, commitment, approval, receiving link |
| Weighbridge ticket | `OPEN → FIRST_WEIGHT → COMPLETE → RECONCILED/VOID` | Weighbridge roles | device, duplicate, gross/tare/net, correction |
| FFB receipt | `FIRST_WEIGHT_RECORDED → GRADING_COMPLETED → READY_TO_POST → POSTED → REVERSED` | Receiving roles | reconciliation, lot, inventory, idempotency |
| Inventory movement | `REQUESTED → APPROVED → POSTED → REVERSED` | Source module/Inventory | source reference, balance lock, ledger, reversal |
| Production route | `DRAFT → APPROVED → ACTIVE → RETIRED` | Production Approver | steps, outputs, quality gates, effective version |
| Production batch | `PLANNED → RELEASED → IN_PROGRESS → COMPLETED → POSTED → CLOSED` | Planner/Operator/Supervisor | route snapshot, sequence, mass balance, inventory |
| Quality configuration | `DRAFT → REVIEW → APPROVED → ACTIVE → RETIRED` | Quality Approver | specification, sampling, method, overlap |
| Quality evaluation | `SAMPLED → IN_TEST → EVALUATED → RELEASED/HELD/REJECTED` | Analyst/Quality Approver | mandatory tests, limits, hold/release |
| Maintenance work order | `REQUESTED → APPROVED → SCHEDULED → IN_PROGRESS → COMPLETED → CLOSED` | Planner/Technician/Supervisor | permit, equipment, parts, completion |
| Dispatch order | `DRAFT → APPROVED → LOADING → QUALITY_PENDING → READY_TO_POST → POSTED → DELIVERED` | Dispatch roles | contract, stock, quality, weighment, POD |
| Document | `DRAFT → APPROVED → GENERATED → ISSUED → SUPERSEDED/VOID` | Document/Source owner | template version, number, checksum, access |
| Integration message | `QUEUED → SENT → ACKNOWLEDGED` or `RETRYING → DEAD_LETTER` | Integration service/support | contract, retry, correlation, replay |
| Report/export | `REQUESTED → RUNNING → COMPLETED/FAILED → EXPIRED` | Reporting roles/job worker | scope, formula/version, secure file |

## Transition rules

1. A transition is a command, not a client-controlled status field.
2. Every transition validates current version, actor permission, scope, preconditions, and configured workflow.
3. Rejection, cancellation, send-back, and reversal require a reason where configured.
4. A posted or closed state cannot be edited through ordinary CRUD.
5. Every transition creates status history and an audit event; downstream events use the transactional outbox.
