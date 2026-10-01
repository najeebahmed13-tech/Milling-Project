# Phase 4 — Configuration Matrix

| Configuration | Scope | Effective dated | Versioned | Audit required | Used by |
|---|---|---:|---:|---:|---|
| Process Definition/Route | Tenant/Mill | Yes | Yes | Yes | Production planning/execution |
| Quality Specification | Tenant/Mill/material/process point | Yes | Yes | Yes | Quality evaluation and release |
| Sampling Plan | Mill/process point | Yes | Yes | Yes | Scheduled quality samples |
| Grading Rule | Tenant/Mill | Yes | Yes | Yes | FFB grading |
| Mill Capacity | Mill/line | Yes | Yes where changed | Yes | Production planning |
| Numbering Sequence | Tenant/company/mill | Period-based | Sequence state | Yes | Business identifiers |
| Document Type/Template | Tenant/company/mill | Yes | Yes | Yes | PDF/document generation |
| Operational Settings | Typed by scope | Where behavior changes | Where history matters | Yes for high-impact settings | Application services |
| Feature Configuration | Tenant | Optional | Config history | Yes | Module availability only |

## Configuration Inheritance

Where inheritance is later approved, precedence is:

`System Default → Tenant → Company → Mill`

The most-specific active configuration wins. The current frontend does not silently implement inheritance; it displays explicit scope fields and leaves server-side precedence for the API phase.

## Validation

- Effective dates cannot overlap for the same scoped/versioned configuration.
- Quality specifications cannot exist without a parameter.
- Sampling plans require a process point and positive interval.
- Process routes cannot reference inactive/missing stages.
- Storage units require a mill and positive capacity/UOM where capacity applies.
- Numbering sequences require unique scope/document-type/period combinations.
- Feature configuration cannot bypass authorization or tenant isolation.

No quality threshold, grading limit, tank calibration formula, or mill-capacity formula has been invented.
