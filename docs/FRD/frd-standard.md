# Formal FRD Authoring Standard

This standard formalizes the requirements in `frd_prompt.md` for repository use. The prompt is guidance for producing the FRD; it is not authorization to modify application code or to invent unresolved business decisions.

## Required module structure

Every module FRD must include:

1. module overview: purpose, problem, scope, dependencies, actors;
2. capability and feature register;
3. atomic functional requirements with ID, actor, preconditions, trigger, inputs, logic, validation, rules, output, state, permissions, audit, exceptions, and Gherkin acceptance criteria;
4. CRUD behavior for masters/configuration;
5. transaction lifecycle and reversal behavior;
6. explicit business rules with `BR-<MODULE>-NNN` IDs;
7. data entities, keys, relationships, scope, audit, effective dates, and history;
8. UI states and shared-component requirements;
9. reports, KPIs, dashboards, exceptions, and exports;
10. integrations, contracts, retries, idempotency, and monitoring;
11. non-functional constraints and open decisions;
12. AI implementation blueprint.

## Authoring rules

- Separate master, configuration, transaction, workflow, report, and dashboard concepts.
- Treat the prototype as evidence and a source of current behavior, not as the final product definition.
- Label each gap as Prototype Gap, Enterprise Requirement, Future Enhancement, or Requires Redesign.
- Use configurable, scoped, effective-dated rules instead of one-mill hard-coding.
- Keep requirements solution-independent until the contract and architecture stages.
- Do not write application code while authoring an FRD unless explicitly requested.
- Record uncertainty as an Open Decision with an owner and impact.
- Keep the traceability chain from module through test evidence.

## Approval gate

An FRD is ready for implementation only when the product owner approves the baseline, the module owner confirms data ownership and boundaries, security confirms authorization/isolation, and engineering confirms API/schema/test feasibility.
