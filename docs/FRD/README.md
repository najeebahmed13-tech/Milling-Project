# ROCKEYE Enterprise FRD Set

This folder contains the controlled target-product FRD deliverables for the multi-tenant Palm Oil Mill ERP + MES SaaS product.

## Deliverables

1. [`master-prd.md`](master-prd.md) — product definition and enterprise scope
2. [`prototype-capability-inventory.md`](prototype-capability-inventory.md) — current prototype assessment
3. [`prototype-gap-analysis.md`](prototype-gap-analysis.md) — prototype-to-enterprise gap register
4. [`target-enterprise-module-map.md`](target-enterprise-module-map.md) — domain ownership and dependencies
5. [`platform-requirements.md`](platform-requirements.md) — SaaS, tenancy, organization, settings, and configuration
6. [`roles-permissions.md`](roles-permissions.md) — configurable RBAC and segregation of duties
7. [`workflow-requirements.md`](workflow-requirements.md) — approval and state-transition engine
8. [`ui-requirements.md`](ui-requirements.md) — enterprise UI behavior and shared components
9. [`reporting-dashboard-requirements.md`](reporting-dashboard-requirements.md) — reporting and KPI requirements
10. [`integration-requirements.md`](integration-requirements.md) — internal and external integrations
11. [`non-functional-requirements.md`](non-functional-requirements.md) — quality attributes and operational targets
12. [`open-decisions.md`](open-decisions.md) — unresolved business and technical decisions
13. [`enterprise-gaps.md`](enterprise-gaps.md) — features missing from the prototype
14. [`ai-implementation-blueprint.md`](ai-implementation-blueprint.md) — coding-agent traceability and delivery blueprint
15. [`frd-standard.md`](frd-standard.md) — formalized FRD authoring standard based on `frd_prompt.md`

Module FRDs remain in [`../Functional requirements/`](../Functional%20requirements/) and are the detailed requirement records linked by this set.

## Status vocabulary

- **Prototype:** visible or implemented in the current repository.
- **Partial:** some screens, rules, or APIs exist, but the lifecycle is incomplete.
- **Target:** required for the enterprise product baseline.
- **Future:** valuable but deferred until an open decision or dependency is resolved.
- **Open decision:** must be decided by product, process, compliance, or architecture owners before implementation.
