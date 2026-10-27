# AI Coding Agent Implementation Blueprint

## Required traceability chain

```text
Module → Feature → FR → BR → Entity/Data → API → UI → Permission → AC → Test
```

An AI coding agent may implement only when the chain is present and the requirement baseline is approved. Missing business decisions must be reported as open decisions, not guessed.

## Per-module blueprint

| Module | Entities/services | APIs/UI | Permissions | Tests |
|---|---|---|---|---|
| Sales | customers, contracts, allocations, commitments | sales contract workspace, contract APIs | sales read/create/approve/cancel | contract quantity, approval, tenant isolation |
| Procurement | suppliers, purchase contracts, direct purchase | procurement workspace, purchase APIs | procurement create/approve | commitment, duplicate, supplier scope |
| Receiving | tickets, receipts, grades, lots | receiving/weighbridge workflow | receipt capture/grade/post/reverse | weight, reconciliation, retry, reversal |
| Inventory | lots, ledger, balances, reservations | stock and movement APIs | stock read/post/adjust/reverse | ledger, concurrency, negative stock, genealogy |
| Production | routes, plans, runs, operations, outputs | plan board, execution UI | plan/run/execute/complete | state, mass balance, route snapshot, posting |
| Quality | specs, samples, observations, evaluations, deviations | quality configuration and observation UI | quality configure/evaluate/release | limits, hold/release, version, duplicate sample |
| Maintenance | equipment, plans, work orders, downtime | maintenance workspace | maintenance plan/execute/close | schedule, state, equipment scope |
| Dispatch | orders, loading, weighment, POD | dispatch workflow | dispatch approve/post/reverse | release, stock, contract, duplicate post |
| Sustainability | certificates, claims, evidence, mass balance | traceability and compliance UI | evidence/manage/approve/export | genealogy, expiry, claim balance |
| Reporting | KPI definitions, projections, exports | dashboards and reports | report read/export/schedule | formula, scope, async export |

## Delivery gates

Requirement → contract → architecture boundary → implementation → tests → static checks → security checks → human review → merge. The agent must provide changed files, requirement IDs, tests run, security considerations, open decisions, and rollback/migration notes.
