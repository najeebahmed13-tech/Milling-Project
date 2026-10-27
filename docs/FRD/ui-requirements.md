# UI Requirements

## Shared behavior

Every module must provide loading, empty, error, permission-denied, validation, unsaved-change, concurrency-conflict, and successful-save states. Lists require pagination, filters, sort, search, column preferences where appropriate, and export permission checks.

Small focused forms use a side drawer. Complex workflows use a full page with breadcrumbs, step/state context, summary, actions, and audit/history tabs. Use the shared design system and avoid module-specific copies of generic controls.

## Enterprise interaction requirements

- responsive desktop/tablet/mobile layouts;
- keyboard navigation, visible focus, labels, accessible errors, semantic status, and adequate contrast;
- destructive/reversal actions require explicit confirmation and reason;
- actions are hidden or disabled according to state and permission, but the server remains authoritative;
- reference selectors show business labels while retaining stable IDs;
- forms support draft save where domain-appropriate and preserve server validation details;
- attachments show type, size, checksum/status, preview/download permission, and audit history;
- detail pages expose status timeline, related records, documents, approvals, and traceability.
