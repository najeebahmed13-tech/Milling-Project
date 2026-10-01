# Phase 3 — UI Design System and Interaction Conventions

## Visual Direction

The UI follows the supplied ROCKEYE Milling Operations reference: restrained enterprise density, white surfaces, light gray canvas, charcoal typography, muted blue-gray icons, and ROCKEYE red for active/attention states. It intentionally avoids pixel-copying the screenshot and keeps module navigation configuration-driven.

## Tokens

The current CSS token layer centralizes:

- semantic colors: background, surface, text, muted text, border, primary, success, warning, danger, info
- control height and border radius patterns
- surface shadow and border treatment
- responsive breakpoints for desktop, tablet, and mobile

Future token changes belong in `src/styles.css` rather than scattered component rules.

## Screen Patterns

- **Page:** breadcrumb → page heading → actions → content sections.
- **List:** title/action, search, filters, tabs, responsive table, pagination, empty state.
- **Form:** grouped fields, labels, helper/error text, client validation, server validation when API is connected, explicit submit state.
- **Details:** identifier/status, summary, attributes, related activity, documents, contextual actions.
- **Drawer:** quick preview and timeline; use a full details route for complex work.
- **Feedback:** status badges, toasts for transient success/error, inline errors for correction, dialogs for consequential actions.

## Accessibility Rules

- Native buttons, inputs, labels, tables, and form semantics are preferred.
- Dialogs/drawers expose dialog semantics and close controls.
- Status uses text plus semantic color, never color alone.
- Keyboard focus and Escape handling must be added/verified as backend-connected dialogs expand.
- Error text must identify the field and correction.

## Responsive Rules

- Desktop keeps the reference top navigation and useful table columns.
- Tablet reduces navigation density and uses stacked page actions.
- Mobile uses a compact navigation menu, stacked forms, reduced columns, and near-full-screen modal/drawer surfaces.

## Component Guidance

Existing reusable patterns are implemented as functions and shared CSS while the project remains dependency-light. Do not introduce a component library merely to replace these stable primitives.

| Pattern | Current implementation | Usage |
|---|---|---|
| Status badge | `badge(status)` + `statusTone()` | Semantic status text and tone |
| Data list | `listingPage(type)` | Search, tabs, table, pagination shell |
| Form modal | `formModal()` | Receiving and reference-master forms |
| Side drawer | `drawer()` | Quick record preview and timeline |
| Toast | `showToast()` | Transient success feedback |
| Empty state | list page empty-state markup | No records/search results |

## Anti-patterns

- Do not use local browser filtering for production-scale data; use API query parameters.
- Do not treat hidden navigation as authorization.
- Do not use demo metrics as production KPIs.
- Do not put multi-step operational transactions into a small drawer.
- Do not duplicate status semantics in individual screens.
