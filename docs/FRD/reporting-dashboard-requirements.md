# Reporting and Dashboard Requirements

## KPI definition

Every KPI requires an ID, name, formula, source records, aggregation, UOM, date basis, timezone, organization scope, filters, refresh timestamp, version, owner, and threshold configuration.

## Required report classes

- operational: receiving queue, production status, quality holds, stock, dispatch queue, maintenance backlog;
- management: yield, OER, availability, utilization, contract fulfillment, supplier performance, quality trend;
- compliance: traceability, certification, mass balance, approvals, audit, data retention;
- exception: overdue approvals, failed integrations, quantity mismatch, stock variance, expired configuration, quality deviation.

## Functional requirements

- role- and scope-filtered dashboards with drill-down to source records;
- saved filters and report versions;
- asynchronous large exports with progress, retry, expiry, and audit;
- scheduled reports with recipient policy, delivery status, and failure notification;
- read models or indexed queries only where measured performance requires them;
- reports identify formula/configuration version and refresh time;
- no report endpoint mutates transactional data.
