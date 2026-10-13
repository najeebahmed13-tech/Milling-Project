# UI component registry

This registry is the entry point for application-wide UI work. New screens should compose these primitives before adding feature-local markup or CSS.

| Layer | Component | Import | Use |
| --- | --- | --- | --- |
| Primitive | `Button` | `src/design-system` | Primary, secondary, and ghost actions |
| Primitive | `IconButton` | `src/design-system` | Icon-only actions; always provide an accessible `label` |
| Primitive | `FormField` | `src/design-system` | Label, required marker, hint, input, and validation message |
| Primitive | `StatusBadge` | `src/design-system` | Semantic status display |
| Primitive | `Alert` | `src/design-system` | Inline info, warning, and error feedback |
| Primitive | `Card` | `src/design-system` | Bounded content surfaces |
| Pattern | `PageHeader` | `src/design-system` | Consistent page title, description, and actions |
| Pattern | `EmptyState` | `src/design-system` | Empty results with an optional next action |
| Pattern | `DetailSection` | `src/design-system` | Standardized detail drawer section with primary heading, secondary description, status, and content |
| Pattern | `ReceivingSlip` | `src/receiving/ReceivingSlip.jsx` | Configurable receiving certificate for screen preview, print, and PDF output |
| Pattern | `VehiclePlateDisplay` | `src/design-system` | Consistent plain monospace vehicle plate value for detail views and operational summaries |
| Pattern | `drawer-form-surface` | `src/receiving/receiving.css` | Shared sticky opaque header/footer behavior for scrollable form drawers |
| Pattern | `usePaginatedItems` | `src/shared/PaginatedList.jsx` | Client-side list pagination with a 10-row default and shared page controls |

## Rules for new UI

1. Use semantic design tokens from `src/design-system/tokens.css`; do not introduce one-off brand, spacing, radius, or shadow values.
2. Keep business rules and data fetching in the owning domain module. Design-system components only render state and emit events.
3. Every icon-only control needs an accessible label. Every form control needs a visible label or an explicit accessible name.
4. Required markers are suffixes (`Label *`) and validation must be visible beside the affected field or in an alert summary.
5. Use the existing page, drawer, card, table, and form patterns before creating a feature-specific variant.
6. Use `DetailSection` for detail drawer sections; keep headings, descriptions, statuses, and content in the registered pattern.
7. Use `VehiclePlateDisplay` for saved vehicle plate values; label the field `Vehicle Plate No.` consistently. Render the plate as a plain alphanumeric monospace value without a badge, border, or decorative plate shell.
8. Preserve responsive behavior and visible keyboard focus at every breakpoint.
9. Use the shared pagination pattern for record listings; retain existing filters and provide page sizes of 10, 20, 50, 100, 200, and 500.
10. Do not repeat ticket, record, or receipt identifiers beneath form headings. Show these values in their labeled form or detail sections instead.
## Receiving slip pattern

Use `ReceivingSlip` for FFB receiving certificate preview and printing. Keep transaction data in the receiving domain and pass a resolved template from `receiving-slip-template.js`.

The template is composed of versioned header metadata, ordered visible sections, ordered visible fields with configurable labels, formatting and print settings, and footer/certification text.

Do not duplicate receipt-slip markup in receiving features. Do not calculate business values in template configuration; render only values supplied by receiving and grading domain records. When no value exists, use the shared `EMPTY_VALUE` rule. Template changes must be versioned and scoped by tenant, company, or mill before being persisted by the backend.

## Design-system utilities

Use the registered utilities and primitives from `src/design-system/index.js` for new UI.

### Form fields

- `TextInput` for text entry
- `NumberInput` for numeric entry
- `QuantityInput` for numeric entry with a unit suffix
- `CurrencyInput` for monetary entry with a currency prefix
- `DisplayValue` for consistently rendering saved values and empty fields

### Display formatting

Use `src/shared/formatters.js` for `formatNumber`, `formatQuantity`, `formatCurrency`, `formatPercentage`, `formatDate`, `formatDateTime`, `normalizeDisplayText`, and `EMPTY_VALUE`. Do not add screen-specific fallbacks such as `"—"`, `"N/A"`, or encoded punctuation.
