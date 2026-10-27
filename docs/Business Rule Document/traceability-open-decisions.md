# FRD-to-Business-Rule Traceability and Open Decisions

## Traceability matrix

| PRD capability | FRD requirements | Business rules | API/UI validation | Acceptance/test evidence |
|---|---|---|---|---|
| Sales | PR-SALES-001–006 | BR-SALES-001–003, BR-X-003–011 | sales contract/commitment API and approval UI | contract quantity, approval, conflict, isolation |
| Procurement | PR-PROC-001–006 | BR-PROC-001–003, BR-X-003–011 | purchase/direct-purchase API | supplier eligibility, commitment, duplicate |
| Receiving | PR-RECV-001–006 | BR-RECV-001–003, BR-CALC-006–008 | receiving/weighbridge/grading UI/API | net, reconciliation, post/retry/reversal |
| Inventory | PR-INV-001–006 | BR-INV-001–003, BR-CALC-001–005, BR-X-009/012 | ledger/lot/reservation API | balance, concurrency, negative stock, reversal |
| Production | PR-PROD-001–006 | BR-PROD-001–004, BR-CALC-009–012 | route/plan/execution API | sequence, mass balance, genealogy |
| Quality | PR-QUAL-001–006 | BR-QUAL-001–003, BR-CALC-013–015 | quality config/observation/release | limits, hold/release, version |
| Maintenance | PR-MAINT-001–006 | BR-MAINT-001–004 | equipment/work-order UI/API | schedule, permit, return-to-service, KPI |
| Dispatch | PR-DISP-001–006 | BR-DISP-001–003, BR-X-013/014/017 | dispatch/load/POD API | quality, weighment, stock, delivery |
| Sustainability | PR-SUST-001–006 | BR-SUST-001–003 | traceability/claim/evidence API | genealogy, certificate, claim balance |
| Reporting | PR-REPT-001–006 | BR-REPT-001–003 | KPI/report/export API | formula, scope, async export |

## Open decisions / missing rules

| ID | Open decision | Affected rules | Impact if unresolved |
|---|---|---|---|
| BR-OD-001 | Exact OER/KER/yield/recovery formulas and basis | BR-CALC-009–012 | production, costing, reporting, compliance |
| BR-OD-002 | 30/70, VCT, moisture, and loss allocation interpretation | BR-CALC-009–012 | mass balance and historical results |
| BR-OD-003 | Product/quality specification limits by material and jurisdiction | BR-QUAL-001–003, BR-CALC-013–015 | release and dispatch blocking |
| BR-OD-004 | Weighbridge device protocol, authority, and offline conflict policy | BR-RECV-001, BR-DISP-002 | receiving/dispatch integrity |
| BR-OD-005 | Tenant isolation deployment model | BR-X-001/002, BR-SEC-003 | schema, migrations, security controls |
| BR-OD-006 | Approval matrix and SoD exceptions | BR-X-011, all workflow rules | authorization and audit |
| BR-OD-007 | Finance/tax/accounting scope and currency rules | BR-FIN-001–003, BR-CALC-016–018 | invoicing and ERP integration |
| BR-OD-008 | Certification schemes and mass-balance standards | BR-SUST-001–003 | sustainability claims and reports |
| BR-OD-009 | Negative-stock and emergency operational policies | BR-INV-002, BR-DISP-003 | posting and exception handling |
| BR-OD-010 | Retention, RPO, RTO, throughput, and availability targets | NFRs, BR-DOC-002, BR-REPT-003 | infrastructure and operations |

Open decisions must be resolved through a change-controlled baseline update; agents must not guess values.
