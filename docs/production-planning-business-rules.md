# Production Planning Business Rules

Production Planning uses eligible Delivery Request Lines as its Phase 1 demand source. A Production Plan is one aggregate; month, week, and day are normalized period allocations belonging to that plan.

| ID | Rule |
|---|---|
| BR-PPLAN-001 | Only eligible, non-cancelled, non-fulfilled Delivery Request Lines contribute demand. |
| BR-PPLAN-002 | Demand is allocated by quantity; one Delivery Request Line may be partially allocated across multiple plans. |
| BR-PPLAN-003 | Planning coverage is derived as UNPLANNED, PARTIALLY_PLANNED, FULLY_PLANNED, or OVERPLANNED and does not mutate Delivery Request status. |
| BR-PPLAN-004 | Available stock is physical stock less reserved stock. |
| BR-PPLAN-005 | Net requirement is gross demand less usable stock plus safety stock less already planned quantity, floored at zero. |
| BR-PPLAN-006 | Weekly and daily allocations use actual dates and must reconcile to their parent quantity. |
| BR-PPLAN-007 | CPO and PK co-production use configurable OER/KER and one shared FFB requirement equal to the larger calculated input. |
| BR-PPLAN-008 | Material requirements are calculated from a versioned recipe standard-consumption factor; utilities are classified separately from materials. |
| BR-PPLAN-009 | Capacity validation uses planned FFB against configured FFB throughput and operating hours; Phase 1 is warning-first. |
| BR-PPLAN-010 | Production Orders are created only from approved or released plan requirements and retain plan/demand traceability. |
| BR-PPLAN-011 | Plan status transitions are controlled server-side; released changes require revision and audit. |
| BR-PPLAN-012 | All plan reads, writes, allocations, and transitions are tenant and mill scoped and permission checked. |
