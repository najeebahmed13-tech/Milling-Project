# SaaS and Platform Requirements

## Scope levels

| Level | Owns examples | Change authority |
|---|---|---|
| Platform | available modules, global feature flags, supported locales, security policy, plan limits | Platform administrator |
| Tenant | company identity, branding, locale, currency, numbering defaults, enabled modules | Tenant administrator |
| Company | legal entity, tax/finance identity, approval authority | Company administrator |
| Mill/Plant | routes, lines, stations, equipment, shifts, storage, tolerances | Mill administrator |
| User | language, timezone display, saved filters, notification preference | User |

## Required capabilities

- tenant provisioning, suspension, archive, deletion policy, and data export;
- legal company, operating company, mill, line, station, work center, equipment, and storage hierarchy;
- module enablement, feature flags, plan quotas, capacity limits, and entitlement checks;
- dynamic master framework for appropriate reference data, with field types, validation, lifecycle, effective dates, import/export, and audit;
- custom fields for approved entities across create, edit, detail, list, API, search, report, and audit;
- tenant settings for locale, time, currency, UOM, numbering, working calendar, shifts, statuses, tolerances, notifications, and approvals;
- platform health, usage, audit, support access, and tenant administration.

## Data rules

Core domain entities remain strongly typed relational records. Dynamic masters and custom fields must not replace strongly typed entities where calculations, foreign keys, state transitions, or regulatory traceability require stable structure.
