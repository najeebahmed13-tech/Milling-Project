# Master UI/UX Consistency Guidelines

## Purpose

All frontend work in this application must follow one unified UI/UX system.

The objective is to ensure that every page, feature, component, workflow, and interaction feels like part of the same product.

Do not design individual screens independently.

Do not introduce new visual styles, spacing systems, navigation patterns, colors, typography, component variants, or interaction behaviors unless they are intentionally added to the shared design system.

The application must feel visually and behaviorally consistent regardless of which feature or module the user is using.

---

# 1. Core UI/UX Principle

Use this priority order for every frontend task:

1. Reuse an existing shared component.
2. Reuse an existing component with existing props or variants.
3. Compose existing components.
4. Extend an existing component with a reusable capability.
5. Create a new shared component only if no existing solution fits.
6. Create a feature-local component only when the UI is genuinely domain-specific.

Never create duplicate versions of an existing component.

The guiding principle is:

**Search → Reuse → Configure → Compose → Extend → Create**

Never:

**Prompt → Custom JSX → Arbitrary styling**

---

# 2. One Design Language Across the Entire Application

The whole application must use one consistent system for:

- colors
- typography
- spacing
- border radius
- borders
- shadows
- elevation
- icons
- motion
- responsive behavior
- forms
- navigation
- cards
- tables
- dialogs
- drawers
- alerts
- badges
- tooltips
- loading states
- empty states
- error states
- focus behavior
- hover behavior
- keyboard interaction

No feature is allowed to invent its own visual language.

---

# 3. Design-System Hierarchy

Use this architecture:

```text
Design Tokens
    ↓
Primitives
    ↓
Base Components
    ↓
Composite Components
    ↓
Reusable Patterns
    ↓
Feature Components
    ↓
Pages
```

Example:

```text
Tokens
├── colors
├── typography
├── spacing
├── radius
├── shadows
├── breakpoints
└── motion

Primitives
├── Box
├── Stack
├── Inline
├── Grid
├── Text
├── Icon
└── Divider

Base Components
├── Button
├── IconButton
├── Input
├── Select
├── Checkbox
├── Radio
├── Switch
├── Badge
├── Card
├── Tooltip
├── Dialog
├── Drawer
└── Tabs

Composite Components
├── SearchInput
├── DataTable
├── DateRangePicker
├── FileUploader
├── FilterBar
├── UserMenu
└── StatusSelector

Patterns
├── PageHeader
├── EmptyState
├── FormSection
├── ConfirmDialog
├── SideDrawerForm
├── DetailDrawer
└── CRUDTable

Feature Components
├── CustomerSummary
├── InvoiceDetails
├── ShipmentStatus
└── ProjectMemberList

Pages
├── Dashboard
├── Customers
├── Settings
└── Reports
```

---

# 4. Design Tokens Are Mandatory

Do not hardcode arbitrary visual values if a token exists.

Avoid:

```css
padding: 17px;
margin-top: 13px;
border-radius: 9px;
color: #3478f6;
font-size: 15px;
```

Use semantic tokens instead.

Example:

```text
spacing:
xs
sm
md
lg
xl
2xl
3xl

radius:
sm
md
lg
xl
full

text:
caption
body-sm
body
body-lg
heading-sm
heading-md
heading-lg
display

color:
background
surface
surface-subtle
surface-raised
border
border-strong
text-primary
text-secondary
text-muted
primary
success
warning
danger
info
```

Do not introduce one-off values without strong justification.

---

# 5. Semantic Colors Only

Use semantic color roles.

Good:

```text
primary
secondary
neutral
success
warning
danger
info
```

Avoid:

```text
blue
green
red
yellow
gray
```

Components should not depend on literal colors.

Example:

```tsx
<Badge variant="success">Active</Badge>
```

Not:

```tsx
<Badge color="#28a745">Active</Badge>
```

This ensures the entire product can be re-themed without rewriting components.

---

# 6. Typography System

Use one global typography hierarchy.

Recommended semantic styles:

```text
display
page-title
section-title
card-title
body-lg
body
body-sm
label
caption
metadata
helper
```

Do not invent font sizes at page level.

Maintain consistent:

- font family
- font size
- font weight
- line height
- letter spacing
- heading hierarchy
- text contrast

Use headings semantically and consistently.

---

# 7. Spacing System

All layout spacing must use the shared spacing scale.

Recommended structure:

```text
xs
sm
md
lg
xl
2xl
3xl
```

Use spacing tokens for:

- section separation
- card padding
- form spacing
- toolbar gaps
- navigation items
- table cells
- button spacing
- modal spacing
- drawer spacing
- grid gaps

Avoid random custom spacing.

---

# 8. Border Radius System

Use one shared radius system.

Example:

```text
sm
md
lg
xl
full
```

Recommended usage:

```text
Inputs        → md
Buttons       → md
Cards         → lg
Dialogs       → lg or xl
Drawers       → no radius against viewport edge
Pills/Badges  → full
```

Do not randomly mix rounded styles.

---

# 9. Shadows and Elevation

Use restrained elevation.

Recommended levels:

```text
none
subtle
raised
overlay
floating
```

Typical usage:

```text
Cards      → none or subtle
Dropdown   → raised
Popover    → raised
Drawer     → overlay
Dialog     → overlay
Floating UI→ floating
```

Do not use heavy decorative shadows.

---

# 10. Global Layout System

Create reusable layout components.

Examples:

```text
AppShell
PageContainer
PageHeader
ContentSection
SidebarLayout
SplitLayout
DashboardLayout
SettingsLayout
AuthLayout
FullScreenLayout
```

Pages should primarily compose these layouts.

Avoid manually recreating the same page structures.

---

# 11. App Shell

The application should have one canonical AppShell.

Example structure:

```text
AppShell
├── Sidebar / Navigation Rail
├── TopBar
├── MainContent
└── Optional Utility Panel
```

Example:

```tsx
<AppShell
  sidebar={<Sidebar />}
  header={<TopBar />}
>
  {children}
</AppShell>
```

Do not let pages create their own application-level navigation.

---

# 12. Sidebar Navigation

Use one shared sidebar system.

Sidebar may support:

```text
expanded
collapsed
mobile-drawer
```

Use the same:

- width
- item height
- icon size
- label style
- active state
- hover state
- badge style
- section spacing
- collapse behavior

A sidebar navigation item should support:

```text
icon
label
href
active
disabled
badge
children
```

Use one consistent active indicator across the entire application.

---

# 13. Side Drawer / Navigation Drawer

Side drawers must be standardized and reusable.

A drawer is a temporary or contextual panel that enters from the left or right edge of the viewport.

Do not implement drawers manually per feature.

Use one canonical `Drawer` component.

Example:

```tsx
<Drawer
  open={open}
  onOpenChange={setOpen}
  side="right"
  size="md"
>
  <Drawer.Header>
    Edit Customer
  </Drawer.Header>

  <Drawer.Body>
    ...
  </Drawer.Body>

  <Drawer.Footer>
    ...
  </Drawer.Footer>
</Drawer>
```

---

# 14. Drawer Types

Support standardized drawer types.

## Navigation Drawer

Used mainly on smaller screens for application navigation.

Typically enters from the left.

```text
NavigationDrawer
```

Contains:

- app logo
- navigation sections
- active navigation state
- account/workspace switcher
- optional footer links

---

## Detail Drawer

Used to inspect an item without leaving the current page.

Examples:

- customer details
- order details
- activity details
- record preview

Typically enters from the right.

```text
DetailDrawer
```

### Vehicle plate detail pattern

Use `VehiclePlateDisplay` from the design-system registry for saved vehicle plate values in detail drawers and operational summaries. The field label is always `Vehicle Plate No.`. Render the value as a plain alphanumeric monospace value, with compact values normalized for readability (for example, `ABC123` becomes `ABC 123`). Do not wrap the value in a badge, border, background shell, or decorative plate treatment. Use the shared empty-value fallback when no plate is available.

---

## Form Drawer

Used for create/edit workflows where the user should remain in context.

Examples:

- create customer
- edit project
- modify settings
- add user

```text
FormDrawer
```

---

## Filter Drawer

Used on mobile or dense interfaces to display filters.

```text
FilterDrawer
```

---

## Utility Drawer

Used for secondary contextual tools.

Examples:

- notifications
- activity history
- AI assistant
- file details
- help panel

---

# 15. Drawer Sizes

Use predefined sizes only.

Example:

```text
sm
md
lg
xl
full
```

Suggested intent:

```text
sm   → simple information
md   → standard forms
lg   → detailed forms
xl   → complex workflows
full → mobile or exceptional content
```

Do not set arbitrary drawer widths.

---

# 16. Drawer Structure

Every drawer should follow this structure:

```text
Drawer
├── Header
│   ├── Title
│   ├── Optional description
│   └── Close button
│
├── Body
│   └── Scrollable content
│
└── Footer
    ├── Secondary action
    └── Primary action
```

Recommended form drawer:

```text
Header
"Create Customer"

Body
form fields

Footer
Cancel
Save
```

### Form drawer scroll containment

Form drawers must keep the header and footer visually above the scrollable form body. Use the shared form-drawer surface pattern: the drawer is a fixed flex surface, only the body form owns vertical scrolling, and the header/footer use an opaque surface background, separator, and consistent stacking order. Form content must never be visible through or behind either action surface while scrolling.

---

# 17. Drawer Behavior

The shared Drawer component must handle:

- focus trapping
- keyboard navigation
- Escape key
- scroll locking
- backdrop
- close behavior
- focus restoration
- responsive sizing
- body scrolling
- accessibility roles
- animation

Feature code must not reimplement these behaviors.

---

# 18. Drawer Backdrop

Use a consistent backdrop/scrim.

It should:

- visually separate foreground from background
- avoid excessive darkness
- close the drawer when clicked where appropriate
- be disabled where closing would risk data loss

Use the same backdrop behavior for Dialog and Drawer where possible.

---

# 19. Drawer UX Rules

Use a drawer when:

- the user benefits from staying in the current page context
- the task is secondary to the current page
- the interaction is temporary
- the content fits comfortably in a vertical panel

Use a full page instead when:

- the workflow is long
- there are many complex sections
- deep navigation is required
- there are multiple sub-workflows
- the user needs maximum working space

Do not force every workflow into a drawer.

---

# 20. Unsaved Changes in Drawers

Form drawers must protect unsaved data.

If the user attempts to close a dirty form:

```text
Close requested
↓
Unsaved changes detected
↓
Show confirmation
```

Use the canonical `ConfirmDialog`.

Do not silently discard user input.

---

# 21. Mobile Drawer Behavior

On small screens:

- drawers may become full-width
- navigation drawer may occupy most of the screen
- detail drawers may become full-screen sheets
- footer actions should remain accessible
- touch targets must remain large enough

Do not simply shrink desktop drawer layouts.

---

# 22. Buttons

Use one canonical Button component.

Supported variants may include:

```text
primary
secondary
outline
ghost
danger
```

Supported sizes:

```text
sm
md
lg
```

Supported states:

```text
default
hover
focus
active
disabled
loading
```

Do not create:

```text
BlueButton
SaveButton
DeleteButton
BigButton
RoundedButton
```

when Button variants can represent them.

---

# 23. Icon Buttons

Clickable icons must use `IconButton`.

Good:

```tsx
<IconButton
  icon={<TrashIcon />}
  label="Delete customer"
/>
```

Avoid:

```tsx
<TrashIcon onClick={...} />
```

The shared IconButton must handle:

- accessible label
- hit area
- hover state
- focus state
- disabled state
- icon sizing

---

# 24. Forms

Use one standardized form architecture.

Recommended structure:

```text
Form
├── FormSection
│   ├── FormField
│   │   └── Input
│   ├── FormField
│   │   └── Select
│   └── FormField
│       └── Checkbox
│
└── Actions
```

`FormField` should handle:

- label
- description
- helper text
- required state
- optional state
- error message
- accessibility relationships
- consistent spacing

---

# 25. Input Components

Use shared components for:

```text
Input
Textarea
PasswordInput
SearchInput
NumberInput
CurrencyInput
DatePicker
TimePicker
Select
MultiSelect
Combobox
Checkbox
Radio
Switch
Slider
FileUpload
```

Do not build these repeatedly inside features.

---

# 26. Form States

All inputs should consistently support:

```text
default
hover
focus
filled
disabled
read-only
invalid
success
```

Error states must include text, not color alone.

---

# 27. Selection Components

Use:

```text
Checkbox
Radio
Switch
Select
Combobox
SegmentedControl
```

Use the correct pattern based on the interaction.

Checkbox:
multiple independent choices.

Radio:
one selection from a small set.

Switch:
immediate binary setting.

Select:
single selection from a list.

Combobox:
large/searchable selection.

---

# 28. Cards

Use one Card system.

Structure:

```text
Card
├── Header
├── Body
└── Footer
```

Possible variants:

```text
default
outlined
elevated
interactive
selected
```

Avoid creating unrelated card styles per feature.

---

# 29. Tables and Data Grids

Use one canonical DataTable system.

It should support where relevant:

- column headers
- sorting
- filters
- search
- row selection
- bulk actions
- row actions
- pagination
- sticky headers
- loading
- error
- empty state
- expandable rows
- responsive handling

Do not manually rebuild data tables per page.

---

# 30. Table Density

Use predefined density variants.

Example:

```text
comfortable
default
compact
```

Do not randomly change row height.

---

# 31. Page Headers

Use one reusable PageHeader.

Example:

```tsx
<PageHeader
  title="Customers"
  description="Manage customer accounts"
  breadcrumbs={breadcrumbs}
  actions={<Button>Create Customer</Button>}
/>
```

The component should standardize:

- page title
- description
- breadcrumbs
- actions
- responsive behavior

---

# 32. Toolbars

Use one shared Toolbar pattern.

Typical content:

```text
Search
Filters
Sort
View selector
Spacer
Primary action
```

Example:

```tsx
<Toolbar>
  <SearchInput />
  <FilterButton />
  <SortSelect />
  <Toolbar.Spacer />
  <Button>Create</Button>
</Toolbar>
```

---

# 33. Search

Use one shared search experience.

Support where appropriate:

```text
search input
clear button
keyboard shortcut
loading state
empty results
suggestions
recent searches
```

Do not create visually inconsistent search controls.

---

# 34. Filters

Use standardized filtering patterns.

Desktop:

```text
FilterBar
FilterPopover
FilterChips
```

Mobile:

```text
FilterDrawer
```

Active filters should be visible and removable.

Provide a clear-all option when multiple filters are active.

---

# 35. Tabs

Use one shared Tabs system.

Support:

```text
horizontal tabs
vertical tabs
scrollable tabs
```

Do not use tabs for unrelated navigation.

Tabs should switch between closely related views.

---

# 36. Dropdown Menus

Use the canonical DropdownMenu.

It should support:

- icons
- labels
- keyboard navigation
- disabled items
- destructive items
- dividers
- nested actions where justified

Do not manually position floating menus.

---

# 37. Context and Overflow Menus

Use:

```text
DropdownMenu
ContextMenu
OverflowMenu
```

Use overflow menus for secondary actions.

Avoid placing too many low-priority buttons directly in toolbars.

---

# 38. Dialogs and Modals

Use one Dialog system.

Structure:

```text
Dialog
├── Header
├── Body
└── Footer
```

It must handle:

- focus trap
- Escape
- backdrop
- scroll lock
- focus restoration
- keyboard navigation
- accessibility

Do not manually implement modal behavior.

---

# 39. Confirmation Dialogs

Use one reusable `ConfirmDialog`.

Example:

```tsx
<ConfirmDialog
  title="Delete customer?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="danger"
/>
```

Use for:

- deletion
- destructive actions
- irreversible operations
- unsaved changes

---

# 40. Tooltips

Use Tooltip for short explanatory information.

Do not place critical information only inside a tooltip.

Tooltips must work with:

- mouse hover
- keyboard focus

---

# 41. Popovers

Use Popover when the floating surface contains interactive content.

Examples:

- filter controls
- date selector
- small settings menu

Use Tooltip only for brief non-interactive explanations.

---

# 42. Notifications and Feedback

Use a consistent feedback hierarchy.

## Toast

Use for:

- successful save
- background action completion
- temporary informational message

## Alert

Use for:

- persistent warnings
- errors requiring attention
- important informational states

## Inline Validation

Use for field-specific issues.

---

# 43. Toast System

Use one global toast implementation.

Standard variants:

```text
success
info
warning
danger
```

Avoid feature-specific toast designs.

---

# 44. Status Indicators

Use shared:

```text
Badge
StatusBadge
Chip
Tag
Indicator
```

Use semantic states:

```text
neutral
info
success
warning
danger
```

Do not assign arbitrary colors.

---

# 45. Loading States

Use:

```text
Spinner
Skeleton
Progress
```

Spinner:
short indeterminate operations.

Skeleton:
content loading.

Progress:
measurable long-running operations.

Do not invent different loading animations per feature.

---

# 46. Skeleton Layout

Skeletons should resemble the final layout.

Do not use generic centered spinners for full page content when skeletons can preserve layout stability.

---

# 47. Empty States

Use one EmptyState pattern.

Examples:

```text
No records
No search results
No notifications
First-use state
No permissions
```

Structure:

```text
Icon or illustration
Title
Description
Optional primary action
Optional secondary action
```

---

# 48. Error States

Support standardized error patterns.

Examples:

```text
Inline field error
Section error
Page error
Network error
Permission error
404
500
```

Always give users a recovery action where appropriate.

Examples:

```text
Retry
Go back
Contact support
Change filters
```

---

# 49. Navigation

Use consistent navigation behavior across the application.

Standard components:

```text
Sidebar
TopBar
Breadcrumbs
Tabs
Pagination
BackButton
NavigationDrawer
```

Do not use multiple unrelated navigation patterns for equivalent functionality.

---

# 50. Breadcrumbs

Use breadcrumbs when hierarchy matters.

Example:

```text
Customers
→ ACME Ltd.
→ Billing
```

Do not use breadcrumbs purely decoratively.

---

# 51. Pagination

Use one Pagination component.

Support:

```text
previous
next
page number
page size
total count
```

Do not manually implement page navigation repeatedly.

---

# 52. Icons

Use one approved icon library or one internal icon set.

Maintain consistency in:

- stroke width
- size
- optical weight
- alignment

Do not mix:

```text
Lucide
Material Icons
Heroicons
Font Awesome
random SVGs
emoji
```

unless intentionally standardized.

---

# 53. Icon Sizes

Use a canonical scale.

Example:

```text
xs
sm
md
lg
xl
```

Icons must align visually with surrounding text and controls.

---

# 54. Responsive Design

Every component must have predictable responsive behavior.

Support:

```text
mobile
tablet
desktop
large desktop
```

Do not simply shrink desktop layouts.

Reflow content appropriately.

Examples:

Desktop:

```text
Sidebar + Main Content + Detail Drawer
```

Mobile:

```text
Navigation Drawer
Main Content
Detail Drawer becomes full-screen
```

---

# 55. Breakpoints

Use one global breakpoint system.

Do not create page-specific breakpoints unless necessary.

Example semantic breakpoints:

```text
sm
md
lg
xl
2xl
```

---

# 56. Mobile Behavior

Prioritize:

- readable content
- large touch targets
- minimum horizontal scrolling
- accessible navigation
- simplified toolbars
- drawer-based secondary actions
- responsive tables

Move secondary toolbar actions into an overflow menu where appropriate.

---

# 57. Table Behavior on Mobile

Avoid simply squeezing desktop tables.

Use one of:

- horizontal scrolling
- responsive column hiding
- card transformation
- detail drawer
- prioritized columns

Choose based on data complexity.

---

# 58. Interaction States

All interactive components must define relevant states:

```text
default
hover
focus
focus-visible
active
pressed
selected
disabled
loading
error
success
expanded
collapsed
dragging
```

Do not leave state behavior undefined.

---

# 59. Focus Behavior

Keyboard focus must always be visible.

Do not remove focus outlines unless replaced by an equally visible accessible focus indicator.

---

# 60. Keyboard Accessibility

Interactive elements must support expected keyboard behaviors.

Examples:

Button:
Enter / Space.

Dialog:
Escape closes where appropriate.

Dropdown:
arrow keys navigate.

Tabs:
arrow keys navigate.

Drawer:
focus trapped while modal.

Combobox:
keyboard selection.

---

# 61. Accessibility

Accessibility is part of the component system.

Required:

- semantic HTML
- accessible names
- labels
- alt text
- ARIA only where necessary
- keyboard support
- focus indicators
- adequate contrast
- non-color-only status representation
- touch-friendly targets

Shared components should own accessibility behavior whenever possible.

---

# 62. Motion and Animation

Use one motion system.

Animations should be:

- subtle
- quick
- purposeful
- consistent

Standardize:

```text
fast
normal
slow
```

And easing:

```text
standard
enter
exit
```

Do not add decorative animation without UX purpose.

---

# 63. Drawer Motion

Drawers should:

- slide from the corresponding edge
- use the same duration across the application
- use the same easing
- coordinate with backdrop fade
- respect reduced-motion preferences

Do not use different drawer animation styles per feature.

---

# 64. Destructive Actions

Use the `danger` semantic style.

Examples:

```text
Delete
Remove
Revoke
Disconnect
Reset
```

Destructive actions should be visually distinct but not unnecessarily alarming.

Require confirmation for irreversible/high-impact actions.

---

# 65. Progressive Disclosure

Do not display every possible option at once.

Prefer:

```text
primary action visible
secondary actions grouped
advanced settings collapsed
rare actions in overflow menu
```

Reduce cognitive load.

---

# 66. Content Hierarchy

Every screen should have a clear visual hierarchy:

```text
Page title
↓
Primary action
↓
Primary content
↓
Secondary content
↓
Tertiary actions
```

Do not allow all elements to compete visually.

---

# 67. Primary Action Rule

Each view should generally have one clearly dominant primary action.

Examples:

```text
Create customer
Save changes
Continue
Submit
```

Avoid several equally prominent primary buttons in the same context.

---

# 68. Component Naming

Name by purpose, not appearance.

Good:

```text
Button
PageHeader
StatusBadge
FilterBar
CustomerCard
DetailDrawer
```

Avoid:

```text
BlueButton
RoundedBox
GrayCard
BigPanel
PrettyDrawer
```

Names based on purpose survive redesigns.

---

# 69. Feature Components

Feature-specific components may contain domain structure but must still use shared primitives.

Example:

```tsx
<CustomerSummary>
  <Card>
    <Text />
    <StatusBadge />
    <Button />
  </Card>
</CustomerSummary>
```

Feature components must not invent their own design system.

---

# 70. Pages

Pages should mainly handle:

- composition
- data loading
- routing
- permissions
- feature orchestration

Pages should contain minimal low-level visual styling.

Bad:

```tsx
<div className="mt-[17px] rounded-[11px] ...">
```

Good:

```tsx
<PageContainer>
  <PageHeader />
  <ContentSection />
</PageContainer>
```

---

# 71. Custom CSS Rule

Before adding custom CSS:

1. Check design tokens.
2. Check component props.
3. Check variants.
4. Check layout primitives.
5. Check existing patterns.

Only add custom styling when necessary.

---

# 72. Reuse Before Creation

Before creating any component, search for:

- exact name
- semantic equivalent
- visual equivalent
- behavior equivalent
- existing pattern

Example:

Before creating:

```text
ProjectStatusPill
```

Search:

```text
Badge
StatusBadge
Chip
Tag
Pill
```

---

# 73. Do Not Duplicate Components

The application should ideally have one canonical implementation for each concept.

One:

```text
Button system
Input system
Card system
Drawer system
Dialog system
Tooltip system
Toast system
Table system
Badge system
Typography system
Icon system
```

Avoid parallel systems.

---

# 74. Component Variants

Use variants instead of duplicate components.

Example:

```tsx
<Button variant="primary" />
<Button variant="secondary" />
<Button variant="ghost" />
<Button variant="danger" />
```

Not:

```text
PrimaryButton
SecondaryButton
GhostButton
DeleteButton
```

---

# 75. Variant Creation Rule

Before adding a new variant ask:

- Is it reusable?
- Does it express meaningful semantics?
- Could an existing variant already cover it?
- Will it be used in multiple places?

Do not create one-off variants for one page.

---

# 76. Component API Rule

Component APIs should be:

- small
- semantic
- predictable
- reusable

Avoid page-specific props.

Bad:

```text
isDashboard
isBilling
redMode
customerPageStyle
```

Good:

```text
variant
size
tone
density
align
```

---

# 77. Component Documentation

Every shared component should document:

```text
Purpose
Import path
Variants
Sizes
States
Accessibility
Examples
When to use
When not to use
```

This improves agent reuse.

---

# 78. Component Registry

Maintain a UI registry such as:

```text
docs/ui-components.md
```

Example:

```text
Component: Drawer

Purpose:
Temporary side panel for navigation, details, filters, forms, or contextual workflows.

Variants:
navigation
detail
form
filter

Sides:
left
right

Sizes:
sm
md
lg
xl
full

Do not create:
CustomSidePanel
SlidePanel
RightModal
FeatureDrawer
```

The coding agent should inspect this registry before creating new UI.

---

# 79. Preferred Folder Structure

```text
src/
├── design-system/
│   ├── tokens/
│   ├── primitives/
│   ├── components/
│   ├── patterns/
│   └── index.ts
│
├── layouts/
│   ├── AppShell/
│   ├── DashboardLayout/
│   ├── SettingsLayout/
│   └── AuthLayout/
│
├── features/
│   ├── customers/
│   ├── billing/
│   └── projects/
│
└── pages/
```

Possible drawer structure:

```text
design-system/
└── components/
    └── Drawer/
        ├── Drawer.tsx
        ├── Drawer.types.ts
        ├── Drawer.test.tsx
        ├── Drawer.stories.tsx
        └── README.md
```

Reusable drawer patterns:

```text
design-system/
└── patterns/
    ├── DetailDrawer/
    ├── FormDrawer/
    └── FilterDrawer/
```

---

# 80. Dependency Direction

Maintain this direction:

```text
Pages
↓
Features
↓
Patterns
↓
Components
↓
Primitives
↓
Tokens
```

Lower-level UI components must never import application-specific pages or business features.

---

# 81. UX Consistency

Consistency is behavioral as well as visual.

Equivalent actions should behave consistently.

Examples:

- all Save actions should provide similar feedback
- all delete actions should confirm consistently
- all drawers should close consistently
- all forms should display validation consistently
- all tables should paginate consistently
- all empty states should follow the same pattern

---

# 82. Standard CRUD UX

Use predictable CRUD patterns.

Create:

```text
Primary CTA
→ Page or FormDrawer
```

Read:

```text
Table/List
→ Detail page or DetailDrawer
```

Update:

```text
Edit action
→ Page or FormDrawer
```

Delete:

```text
Delete action
→ ConfirmDialog
→ Toast
```

Avoid inconsistent flows for equivalent entities.

---

# 83. Save Behavior

Use consistent save behavior.

While saving:

```text
Button enters loading state
```

On success:

```text
Save completes
→ Toast success
→ Close drawer/dialog if appropriate
→ Refresh affected content
```

On failure:

```text
Stay in context
→ Show meaningful error
→ Preserve user data
```

---

# 84. Forms Inside Drawers

Use FormDrawer for short-to-medium contextual forms.

Structure:

```text
Drawer.Header
Drawer.Body
  Form
Drawer.Footer
  Cancel
  Save
```

Keep primary actions fixed in the footer where long scrolling is possible.

---

# 85. Detail Drawer Pattern

DetailDrawer should provide:

```text
Header
- title
- subtitle/status
- close

Body
- summary
- metadata
- sections
- activity

Footer or action area
- contextual actions
```

Do not overload DetailDrawer with complex nested navigation.

---

# 86. Filter Drawer Pattern

On small screens:

```text
Filter button
↓
FilterDrawer
↓
Filter controls
↓
Reset
Apply
```

On desktop, use filters inline or in a popover if space permits.

---

# 87. Navigation Drawer Pattern

On mobile:

```text
Menu button
↓
NavigationDrawer
↓
Navigation
↓
Close after destination selection
```

Preserve the same navigation hierarchy as the desktop sidebar.

---

# 88. Side Drawer vs Dialog

Use Drawer when:

- maintaining page context matters
- content benefits from vertical space
- workflow relates directly to underlying page

Use Dialog when:

- decision is short
- interaction is focused
- content is compact
- user must respond before continuing

Do not use the two interchangeably without reason.

---

# 89. Side Drawer vs Full Page

Use a full page when:

- many complex sections exist
- workflow takes several steps
- deep linking is important
- large workspace is needed
- user needs long-term context

Use a drawer for short contextual tasks.

---

# 90. Side Drawer vs Popover

Use a Popover for compact contextual content.

Use Drawer for larger structured content.

Do not put large forms inside popovers.

---

# 91. Consistent Component States

Every reusable component should document its state matrix.

Example:

```text
Button
Default
Hover
Focus
Pressed
Disabled
Loading

Input
Default
Hover
Focus
Filled
Invalid
Disabled
Read-only

Drawer
Closed
Opening
Open
Closing
Loading
Error
Dirty form
```

---

# 92. Data Density

Choose predefined density levels.

Example:

```text
comfortable
default
compact
```

Use compact mode mainly for data-heavy enterprise views.

Do not mix densities randomly on the same page.

---

# 93. Z-Index and Layering

Use one shared layering system.

Example:

```text
base
sticky
dropdown
popover
drawer
modal
toast
```

Do not hardcode random z-index values.

---

# 94. Overlay Priority

Ensure predictable layering.

Example:

```text
Page
↓
Sticky Header
↓
Dropdown
↓
Popover
↓
Drawer
↓
Dialog
↓
Toast
```

Avoid overlays appearing beneath unrelated components.

---

# 95. Scroll Behavior

Define scroll ownership clearly.

Page:
scrolls normally.

Drawer:
body scrolls independently.

Dialog:
content scrolls when necessary.

Sidebar:
may scroll independently if navigation is long.

Avoid nested scroll containers unnecessarily.

---

# 96. Sticky Actions

For long forms in drawers or dialogs, actions may remain sticky.

Use consistently.

Avoid hiding Save/Cancel actions below long content.

---

# 97. Content Width

Use consistent maximum widths for:

- forms
- settings pages
- reading content
- dashboards

Do not stretch every form field across the entire viewport.

---

# 98. Form Width

Short fields should not always be full-width.

Use semantic widths where supported:

```text
small
medium
full
```

Examples:

Postal code:
small.

Email:
medium/full.

Long description:
full.

---

# 99. Inline Actions

Use inline actions carefully.

Prefer:

```text
Edit
Copy
View
```

as subtle actions.

Destructive actions should not be visually dominant unless intentionally required.

---

# 100. UX Error Prevention

Prefer prevention over error messages.

Examples:

- disable impossible actions
- validate formats early
- show constraints clearly
- confirm destructive operations
- preserve user-entered data
- offer sensible defaults

---

# 101. Empty vs Loading

Never show an empty state while data is still loading.

Use:

```text
Loading
→ Skeleton

Loaded + zero records
→ EmptyState
```

---

# 102. Error vs Empty

Do not represent failed data loading as “No data.”

Use a specific error state with Retry.

---

# 103. Global Consistency Verification

Before completing any frontend task, verify:

- existing components were searched
- reusable components were used
- no duplicated component was introduced
- design tokens were used
- semantic colors were used
- typography is consistent
- spacing is consistent
- responsive behavior works
- drawer/dialog behavior matches standards
- keyboard interaction works
- accessibility is preserved
- loading state exists
- empty state exists where relevant
- error state exists where relevant
- disabled state exists where relevant
- hover/focus states are consistent
- page matches the rest of the application

---

# 104. Forbidden Practices

Do not:

- create a new button when Button exists
- create custom inputs when Input exists
- create custom modals
- create custom side drawers
- create custom tooltips
- duplicate cards
- duplicate tables
- use arbitrary colors
- use arbitrary spacing
- use arbitrary radii
- use arbitrary shadows
- use arbitrary font sizes
- use clickable divs
- use raw clickable SVGs
- introduce another icon library without approval
- create page-specific visual systems
- duplicate loading indicators
- duplicate empty states
- bypass design tokens
- hardcode z-index values
- create one-off animation styles

---

# 105. Required Practices

Must:

- inspect the existing design system before implementation
- reuse existing components
- prefer composition over duplication
- use semantic design tokens
- use reusable layout primitives
- use the shared Drawer component
- use the shared Dialog component
- use standard forms
- preserve accessibility
- support keyboard navigation
- support responsive layouts
- support loading/error/empty states
- preserve light/dark theme compatibility if theming exists
- document newly created shared components

---

# 106. UI Implementation Decision Tree

Use this process for every UI request:

```text
Need UI
↓
Does an existing component support it?
↓
YES → Use it

NO
↓
Can existing props or variants support it?
↓
YES → Configure it

NO
↓
Can existing components be composed?
↓
YES → Compose them

NO
↓
Can the existing component be extended generically?
↓
YES → Extend it

NO
↓
Is the requirement reusable across the application?
↓
YES → Create shared component

NO
↓
Create feature-local component
```

Never create an alternative implementation of an existing shared component.

---

# 107. Drawer Decision Tree

```text
Need side panel
↓
Is it navigation?
→ NavigationDrawer

Is it record inspection?
→ DetailDrawer

Is it create/edit form?
→ FormDrawer

Is it filtering?
→ FilterDrawer

Is it a contextual utility?
→ UtilityDrawer

Is the task extremely complex?
→ Use full page instead
```

All drawer patterns must use the canonical Drawer primitive.

---

# 108. Final Codex Instruction

Before writing frontend code:

1. Inspect the existing design system.
2. Search reusable components and patterns.
3. Identify the existing component closest to the requested UI.
4. Reuse it wherever possible.
5. Use existing variants and tokens.
6. Compose existing components before creating new ones.
7. If a new capability is needed, implement it generically.
8. Keep page-level custom styling minimal.
9. Verify responsive behavior and accessibility.
10. Confirm visual and behavioral consistency with the rest of the application.

The goal is not merely to make the requested screen work.

The goal is to preserve and extend one coherent product-wide UI/UX system.

Every new screen must look and behave as though it was designed by the same design-system team.

Local UI convenience must never override global UI consistency.

---

# 109. Receiving Slip / Document Template Pattern

Operational certificates and printed documents must use a reusable document pattern rather than feature-local markup.

The receiving slip pattern must:

- compose shared field, status, number, date, and icon components
- render sections in the order supplied by a versioned template
- honor section and field visibility without leaving empty layout gaps
- use shared empty-value, number, unit, and date formatting
- keep pending weighing states explicit and never infer an uncertified net weight
- support screen preview and print/PDF media styles
- keep template configuration separate from immutable transaction data

Template configuration may define labels, order, visibility, header/footer copy, formatting, page size, and orientation. It must not define business calculations, grading thresholds, acceptance rules, or other domain logic. Tenant/company/mill-scoped active templates and historical template versions belong to the configuration/document domain.
