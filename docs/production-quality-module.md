# Production Quality Module

The configurable production-quality module uses one generic checkpoint entity for all
production processes. Current seeded processes are Sterilization (Cycle Wise),
Threshing, Digester, Pressing, Clarification, Purification, Vacuum, and Storage Tank
(Day Wise). Additional recording frequencies remain configuration values rather than
process-specific code.

API resources:

- `GET /api/production-quality/processes`
- `GET|POST /api/production-quality/checkpoints`
- `GET /api/production-quality/checkpoints/:id`
- `PATCH /api/production-quality/checkpoints/:id`
- `GET|POST /api/production-quality/observations`
- `GET /api/production-quality/observations/:id`

Checkpoint updates retain the previous configuration snapshot. Quality observations
store the effective checkpoint version and configuration snapshot used for evaluation.
Evaluation is centralized: values inside limits pass, values inside warning limits
produce Warning, and values outside acceptable limits fail. Cycle-wise records require
a cycle number; duplicate checkpoint-period records are rejected.
