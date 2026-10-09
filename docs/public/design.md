# ROCKEYE ERP + MES — Design Theme & UI Architecture

**Document:** `docs/public/design.md`  
**Application:** ROCKEYE Milling Operations (Palm Oil ERP + MES SaaS)  
**Target Audience:** Frontend Engineers, Product Designers, AI Autonomous Agents  
**Reference Source:** Production stylesheets (`src/styles.css`, `src/react-app.css`, `src/forms.css`, `src/commercial/commercial.css`, `src/production/production.css`, `src/receiving/receiving.css`) and [docs/ui-design-system.md](ui-design-system.md).

---

## 1. Design Philosophy & Visual Direction

The ROCKEYE design system delivers high information density and operational clarity tailored for industrial palm oil mill environments (weighbridge stations, laboratory grading labs, control rooms, and commercial trading desks).

### Core Principles
- **Restrained Enterprise Density:** Maximizes visible operational data without visual clutter. Compact 32px–40px control heights with clear spacing.
- **Surface Hierarchy:** Cool light-gray canvas (`#f6f7f9` / `#f3f4f6`) with elevated pure white panels (`#ffffff`), subtle borders (`#e6e9ee` / `#dfe3e8`), and soft elevation shadows.
- **Action & Attention Focal Points:** The signature **ROCKEYE Brand Red** (`#e52331`) is reserved for primary actions, active navigation items, critical operational statuses, and live batch highlights.
- **Accessible Dual-Coding:** Status is always indicated through semantic text paired with color/icons—never color alone.
- **Dependency-Light Primitives:** Native accessible HTML elements styled with custom CSS rather than bulky, inflexible third-party UI libraries.

---

## 2. Color System & Design Tokens

### 2.1 Brand & Action Colors
| Token | Hex / CSS Variable | Purpose |
|---|---|---|
| `--red` | `#e52331` | Primary brand red, active tabs, primary CTA buttons, net weight highlights |
| `--red-dark` | `#c91725` | Hover/focus state for primary buttons and destructive action text |
| `--red-tint` | `#fff0f1` | Active tab backgrounds, warning pills, danger badge backgrounds |
| `--red-border`| `#ffc8cd` | Borders for alert boxes, highlighted calculation cards, danger pills |

### 2.2 Neutral & Surface Canvas
| Token | Hex / CSS Variable | Purpose |
|---|---|---|
| `--surface` | `#ffffff` | Primary card background, modals, drawers, input backgrounds |
| `--canvas` | `#f6f7f9` / `#f3f4f6` | Application body background, page backdrop |
| `--line` | `#e6e9ee` / `#e4e7ec` | Card borders, table grid dividing lines, topbar bottom border |
| `--border-dark` | `#cfd5dc` / `#d9dee7` | Unfocused form input borders, table header borders |
| `--ink` | `#1d2939` / `#101828` | Primary text, modal headings, metric values |
| `--ink-subtle` | `#344054` | Table cell data, field labels, secondary copy |
| `--muted` | `#667085` / `#8b95a4` | Helper text, breadcrumbs, placeholder text, table headers |

### 2.3 Semantic Status & Alert Palette
| Semantic Role | Foreground (Text/Icon) | Background Tint | Border Color | Example Operational Use |
|---|---|---|---|---|
| **Success / Approved** | `#1aa36f` / `#087c58` | `#eaf9f3` / `#ecfff8` | `#7fe0c1` | Completed batches, posted receipts, RSPO certified |
| **Warning / Pending** | `#c98912` / `#9a6b10` | `#fff7e8` | `#f0d99c` | Awaiting grading, draft status, supervisor overrides |
| **Danger / Rejected** | `#e52331` / `#b4232e` | `#fff0f1` | `#ffc8cd` | Partial rejection, contract over-allocation, tare mismatch |
| **Info / In-Progress** | `#3977d4` / `#2166c1` | `#eef4ff` / `#eaf4ff` | `#ceddf9` | Active production runs, ready to post, demo environment badge |
| **Neutral / Planned** | `#667085` | `#f1f3f5` | `#e2e5e9` | Planned batches, draft revisions, inactive records |

### 2.4 Shadows & Elevation
```css
--shadow: 0 1px 3px rgba(16, 24, 40, 0.05), 0 4px 14px rgba(16, 24, 40, 0.035);
--shadow-modal: 0 20px 55px rgba(16, 24, 40, 0.20);
--shadow-drawer: -10px 0 30px rgba(16, 24, 40, 0.14);
--shadow-popover: 0 8px 18px rgba(16, 24, 40, 0.13);
```

---

## 3. Typography & Text Hierarchy

### Font Family
- **Primary Typography:** `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace (Data & Metrics):** `monospace`, `ui-monospace`, `SFMono-Regular` (used for ticket numbers, vehicle plates, contract IDs, currency balances, and weighbridge weights).

### Scale & Hierarchy
| Level | Font Size | Weight | Tracking / Letter Spacing | Line Height | Usage |
|---|---|---|---|---|---|
| **Hero Metric / KPI** | `28px` – `36px` | 750 – 800 | `-0.8px` | `1.1` | Dashboard tonnages, KPI values |
| **Page Title (H1)** | `22px` – `28px` | 600 – 700 | `-0.5px` | `1.2` | Screen titles (`FFB Receiving`, `Production Runs`) |
| **Section Header (H2)** | `16px` – `18px` | 600 – 700 | `-0.15px` | `1.3` | Panel titles, form sections |
| **Card Header (H3)** | `13px` – `15px` | 600 | Normal | `1.3` | Sub-sections, modal group headers |
| **Body / Table Cell** | `12px` – `13px` | 400 – 500 | Normal | `1.4` | Table data rows, standard descriptions |
| **Field Label** | `11.5px` – `12px` | 500 – 700 | Normal | `1.2` | Form input labels (`Legal Name *`) |
| **Eyebrow / Sub-tag** | `9px` – `11px` | 700 – 800 | `+1.0px` – `+1.2px` | `1.0` | Uppercase category markers, module breadcrumbs |
| **Micro / Metadata** | `10px` – `11px` | 400 – 500 | Normal | `1.2` | Table footer timestamps, helper annotations |

---

## 4. Layout & Application Shell

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [DEMO] │ ◉ ROCKEYE Milling Ops │ [ ⌕ Search mill records... [ALL ▾] ] │ ⊞ ▦ ▤ ▧ │ (HB) ▼ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Home  ›  Suppliers  ›  Listing                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   Page Heading: Suppliers                          [ ⌕ ] [ ↻ ] [ ▽ Filter ] [ + Add ]  │
│                                                                                        │
│   ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌─────────────┐ │
│   │ Today Received     │ │ Extraction Rate    │ │ Unallocated Stock  │ │ Quality Hold│ │
│   │ 1,248.50 MT        │ │ 21.42 %            │ │ 420.00 MT          │ │ 0 Lots      │ │
│   └────────────────────┘ └────────────────────┘ └────────────────────┘ └─────────────┘ │
│                                                                                        │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   │ [All (24)]  [Pending (3)]  [Completed (21)]                     [ Search...    ] │ │
│   ├──────────────────────────────────────────────────────────────────────────────────┤ │
│   │ Ticket #   │ Supplier Name   │ Vehicle No. │ Gross Kg │ Tare Kg │ Net Kg │ Status│ │
│   │ WB-2026-01 │ Sawit Makmur    │ JQR 8821    │ 34,200   │ 12,100  │ 22,100 │ POSTED│ │
│   └──────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Shell Components
1. **Environment Indicator Rail:** Fixed 24px-wide vertical rail on the top-left marked `DEMO` (`background: #eef4ff; color: #3977d4; font-weight: 800; writing-mode: vertical-rl; transform: rotate(180deg)`).
2. **Topbar Navigation Header:** Height 82px (desktop) or 76px (mobile). Sticky top with bottom border `#e4e7ec` and subtle elevation. Contains brand mark, global search pill, module tabs, and user profile.
3. **Global Search Pill:** Height 46px, light-gray background `#f2f3f5`, rounded 8px with quick category scope badge (`ALL`, `TICKETS`, `SUPPLIERS`).
4. **Header Navigation Tabs:** Height 100%, 76px min-width per tab. Active tab has white-red background (`#fff0f1`), red icon/text (`#e52331`), and a **3px solid red top border** (`border-top: 3px solid var(--red)`).
5. **Breadcrumb Bar:** Height 48px, background `#f3f4f6`, border-bottom `#e7e9ed`, arrow separators (`›`), with current node highlighted in bold.

---

## 5. Component Primitives & Styling Standards

### 5.1 Buttons (`.btn`)
```css
/* Primary Action Button */
.btn-primary {
  background: #e52331;
  color: #ffffff;
  height: 32px; /* compact */ /* or min-height: 40px for full CTA */
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(229, 35, 49, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s ease-in-out;
}
.btn-primary:hover {
  background: #c91725;
}

/* Secondary Button */
.btn-secondary {
  background: #ffffff;
  color: #344054;
  height: 32px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #d9dee7;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Destructive Outline */
.btn-danger-outline {
  border: 1px solid #f2b7bd;
  background: #ffffff;
  color: #c51d2c;
  border-radius: 6px;
  padding: 0 15px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}
.btn-danger-outline:hover {
  background: #fff0f1;
}
```

### 5.2 Form Fields & Inputs (`.form-input`, `.form-label`)
- **Field Labels:** `display: block; font-size: 11.5px; font-weight: 500; color: #374151; margin-bottom: 4px;`.
- **Required Marker:** Asterisk on the same line: `<span className="req text-[#e52331]">*</span>`.
- **Text & Select Inputs:**
  - Height: `32px` (compact enterprise forms) or `40px` (modal prompts).
  - Border: `1px solid #d1d5db`, border-radius `4px`.
  - Focus Ring: `border-color: #e52331; box-shadow: 0 0 0 2px rgba(229, 35, 49, 0.12);`.
  - Readonly/Code field: background `#f9fafb`, font monospace.

### 5.3 Data Tables (`.table-wrap`, `table`)
- **Header (`th`):** `background: #fafbfc; color: #8b95a4; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e9ebef; padding: 11px 17px; text-align: left;`.
- **Data Rows (`td`):** `padding: 13px 17px; border-bottom: 1px solid #eff1f4; color: #344054; font-size: 12px;`.
- **Row Interaction:** `tbody tr:hover { background: #fff9f9; cursor: pointer; }`.
- **Code/ID cells:** Highlighted with red accent font or monospace pill (`color: #e52331; font-weight: 600;`).

### 5.4 Semantic Badges & Pills (`.badge`, `.status-pill`)
- **Badge Shape:** `border-radius: 20px; font-size: 10px; font-weight: 700; padding: 4px 8px; display: inline-flex; align-items: center; gap: 5px;`.
- **Dot Indicator:** `width: 6px; height: 6px; border-radius: 50%; background: currentColor;`.
- **Color Variants:**
  - Active / Completed: `.badge.success` (`background: #eaf9f3; color: #13845b;`)
  - Awaiting Approval / Pending: `.badge.warning` (`background: #fff7e8; color: #aa7207;`)
  - Rejected / Cancelled: `.badge.danger` (`background: #fff0f1; color: #d51c2a;`)
  - Draft / Planned: `.badge.neutral` (`background: #f1f3f5; color: #667085;`)

### 5.5 Modal Dialogs & Side Drawers
- **Full Modal Backdrop:** `position: fixed; inset: 0; background: rgba(16, 24, 40, 0.35); z-index: 25;`.
- **Center Modal:** Max width 620px – 900px, border-radius 10px, box shadow `0 20px 55px rgba(16,24,40,.20)`.
- **Slide-Over Detail Drawer (`.drawer`):** Fixed right, width 390px – 430px, 100vh, box shadow `-10px 0 30px rgba(16,24,40,.14)`. Used for quick entity inspection, genealogy trees, and event timelines.

---

## 6. Domain-Specific UI Patterns

### 6.1 Weighbridge Gross / Tare / Net Display
Net weight is authoritatively derived on the server, highlighted in high-contrast preview cards:
- **Gross & Tare:** Light gray container (`background: #f8fafb; border: 1px solid #e6e9ee;`).
- **Net Weight Card:** Light red highlight container (`background: #fff0f1; border: 1px solid #ffc8cd; strong { color: #e52331; font-size: 20px; }`).

### 6.2 Manufacturing Process Stage Tracker
Visual representation of sequential palm oil mill operations:
- **Sequence Nodes:** Circular badges (`width: 30px; height: 30px; border-radius: 50%;`).
- **Stage State Transitions:**
  - *Completed:* `#eaf9f3; color: #1aa36f;`
  - *Active / Current:* `#fff0f1; color: #e52331; box-shadow: 0 0 0 5px #fff7f7;`
  - *Pending:* `#f0f2f5; color: #596579;`
- **Connector Lines:** 2px stroke connecting nodes; active connectors render linear gradients into red.

### 6.3 Master Data Navigation
All master-data creation and maintenance screens reside beneath the main **Masters** menu using category tiles:
- Inventory & Logistics Masters
- Production & Quality Masters
- System & Numbering Masters

---

## 7. Responsive Breakpoints & Adapters

```css
/* Desktop Large (Default) */
/* Max page width 1450px – 1695px, 3-4 column grids */

@media (max-width: 1250px) {
  /* Tablet Landscape */
  .content-grid { grid-template-columns: 1fr; }
  .profile-copy span { display: none; }
}

@media (max-width: 850px) {
  /* Tablet Portrait & Large Phone */
  .topbar { height: 76px; }
  .topnav { display: none; } /* Collapses to hamburger menu */
  .mobile-menu { display: block; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .contract-grid.three, .contract-grid.two { grid-template-columns: 1fr; }
  .table-panel { overflow-x: auto; }
}

@media (max-width: 480px) {
  /* Mobile Phone */
  .kpi-grid { grid-template-columns: 1fr; }
  .weight-preview { grid-template-columns: 1fr; }
  .modal { width: 100%; border-radius: 0; }
}
```

---

## 8. Summary Design Token Quick-Reference

```css
:root {
  /* Fonts */
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: monospace;

  /* Brand */
  --red: #e52331;
  --red-dark: #c91725;
  --red-tint: #fff0f1;

  /* Canvas & Ink */
  --surface: #ffffff;
  --canvas: #f6f7f9;
  --line: #e6e9ee;
  --ink: #1d2939;
  --muted: #667085;

  /* Status */
  --green: #1aa36f;
  --green-tint: #eaf9f3;
  --amber: #c98912;
  --amber-tint: #fff7e8;
  --blue: #3977d4;
  --blue-tint: #eef4ff;

  /* Elevations */
  --shadow: 0 1px 3px rgba(16,24,40,.05), 0 4px 14px rgba(16,24,40,.035);
  --shadow-lg: 0 10px 25px rgba(16,24,40,.18);
}
```

