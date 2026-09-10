---
name: Hub Precision Operations
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#424752'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#727784'
  outline-variant: '#c2c6d4'
  surface-tint: '#115cb9'
  primary: '#003f87'
  on-primary: '#ffffff'
  primary-container: '#0056b3'
  on-primary-container: '#bbd0ff'
  inverse-primary: '#acc7ff'
  secondary: '#00658d'
  on-secondary: '#ffffff'
  secondary-container: '#41befd'
  on-secondary-container: '#004b69'
  tertiary: '#00399d'
  on-tertiary: '#ffffff'
  tertiary-container: '#004ecf'
  on-tertiary-container: '#c1cfff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004491'
  secondary-fixed: '#c6e7ff'
  secondary-fixed-dim: '#81cfff'
  on-secondary-fixed: '#001e2d'
  on-secondary-fixed-variant: '#004c6b'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-3xs: 0.125rem
  space-2xs: 0.25rem
  space-xs: 0.375rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  gutter-compact: 0.75rem
  gutter-default: 1rem
  margin-screen: 1.5rem
---

## Brand & Style

The design system establishes a high-density, action-driven internal productivity environment inspired by modern operational tools like Linear and Vercel. Engineered specifically for team task scheduling, agenda execution, and resource dispatching, the interface prioritizes cognitive clarity, dense data presentation, and immediate actionability over decorative flourish.

### Aesthetic Principles
- **Utilitarian Elegance**: Visual weight is achieved through crisp geometric borders, precise 1px dividers, and purposeful micro-surfaces rather than heavy drop shadows or unnecessary gradients.
- **High Operational Contrast**: Pure information typography relies on clean slate shades (`#0F172A` down to `#64748B`), framed against sharp, clinical background panels (`#FFFFFF` and `#F8FAFC`).
- **Data-Dense Calm**: Tighter row heights, compact badges, and monospaced numerical alignments allow operators to scan hundreds of schedules without visual fatigue.
- **Strict Semantic Discipline**: Color is never purely decorative; hue carries immediate, non-negotiable status meaning across kanban boards, timeline gantts, and real-time logs.

## Colors

The color architecture directly incorporates the structural identity of the corporate brand identity—deep royal blue (`#0056B3`) and technical cyan (`#00A3E0`)—complemented by an uncompromising semantic tier for operational triage.

### Brand & Primary Accents
- **Brand Primary (`#0056B3`)**: Master brand tone, high-priority interactive states, primary action buttons, focused tabs, and active task selection rings.
- **Tech Cyan (`#00A3E0`)**: Secondary accent, live sync indicators, active timer badges, timeline scrubber anchors, and interactive sub-actions.
- **Action Blue (`#2563EB`)**: Operational state for "In Progress" / "Dispatched" workflows and informative highlight notices.

### Operational Semantics
- **Critical / Overdue (`#EF4444`)**: Immediate operational blockers, SLAs missed, overdue appointments, error banners. Paired with soft tint backgrounds (`#FEF2F2`) and crisp outlines (`#FCA5A5`).
- **Attention / Due Today (`#F59E0B`)**: Imminent deadlines, unconfirmed bookings, pending coordinator approvals. Paired with warning background tint (`#FFFBEB`) and border (`#FCD34D`).
- **Completed / Resolved (`#10B981`)**: Tasks executed, client attended, logs validated. Paired with surface tint (`#ECFDF5`) and border (`#6EE7B7`).
- **Neutral Surface & Neutral Scale**:
  - `Surface 0 (Canvas)`: `#F8FAFC`
  - `Surface 1 (Card/Panel)`: `#FFFFFF`
  - `Surface 2 (Sub-panel/Hover)`: `#F1F5F9`
  - `Border Subtle`: `#E2E8F0`
  - `Border Strong`: `#CBD5E1`
  - `Text Primary`: `#0F172A`
  - `Text Secondary`: `#475569`
  - `Text Muted`: `#94A3B8`

## Typography

The typography system is anchored on **Geist** (with fallback to Inter), engineered specifically for technical dashboards, multi-column scheduling grids, and high data density.

### Hierarchy & Usage
- **Headers (`headline-xl`, `headline-lg`, `headline-md`)**: Reserved for module headings, operational day dividers, and modal titles. Always set tight with negative letter-spacing for a clean, architectural finish.
- **Data & Reading (`body-lg`, `body-md`, `body-sm`)**: Set with balanced proportions. `body-md` (13px) is the system workhorse for task titles, schedule entries, and table rows.
- **Labels & Microcopy (`label-lg`, `label-md`, `label-sm`)**: Displayed with elevated medium/semi-bold weights. `label-md` and `label-sm` are utilized in uppercase or structured tracking for status tags, table headers, and keyboard shortcut chips.
- **Tabular Figures**: All timestamps, duration counters, capacity meters, and client IDs must utilize OpenType font features `tnum` (tabular numbers) to ensure continuous vertical alignment across lists and grids.

## Layout & Spacing

This design system uses a strict 4px/8px modular base rhythm built for maximum information bandwidth, eliminating dead canvas space while retaining scannability.

### Layout Philosophy
- **Modular Multi-Pane Architecture**: A fixed left navigation rail (collapsed at 64px, expanded at 240px), dynamic task inspector drawer on the right (380px or 480px), and a fluid central viewport for schedules, kanban, or gantt lanes.
- **Data Tables & Columns**: Default row height is calibrated at 36px for dense views and 44px for comfortable views. Column padding uses `space-md` (12px) horizontal gutters.
- **Responsive Adaptations**:
  - **Desktop (>1280px)**: 3-pane workflow active (Navigation, Board/List, Right Inspector Drawer side-by-side).
  - **Tablet (768px - 1279px)**: Inspector transitions into an anchored flyout panel with backdrop dimming; navigation rail collapses into icon-only mode.
  - **Mobile (<768px)**: Stacked single-column views with full-screen sheets for scheduling, sticky bottom action bars, and swipeable day tabs.

## Elevation & Depth

Visual hierarchy is driven by crisp borders (`#E2E8F0` and `#CBD5E1`) and soft, high-precision ambient shadows. Heavy skeuomorphism is avoided in favor of tonal surface separation.

### Surface Tiers
- **Tier 0 (Base App Canvas)**: `#F8FAFC` — Base background for navigation, background grids, and calendar canvas.
- **Tier 1 (Cards, Worksheets, Table Containers)**: `#FFFFFF` — Bordered with 1px solid `#E2E8F0`. Subtle shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Tier 2 (Popovers, Dropdowns, Hovered Kanban Cards)**: `#FFFFFF` — Elevated with a dual shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)` and border `#CBD5E1`.
- **Tier 3 (Modals, Global Command Palette, Task Drawers)**: `#FFFFFF` — Deep ambient diffusion: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, framed against a backdrop blur overlay (`rgba(15, 23, 42, 0.35)` with `backdrop-filter: blur(4px)`).

## Shapes

The design system employs a soft, restrained geometry (`roundedness: 1`). Elements favor small, precise curves over oversized organic shapes, reflecting enterprise engineering precision.

### Radius Scale
- **Base UI Controls (`rounded-md` / 4px - 6px)**: Checkboxes, text inputs, table row highlights, buttons, dropdown items, tooltips.
- **Structural Containers (`rounded-lg` / 8px)**: Cards, kanban task columns, timeline blocks, schedule preview panels, modal windows.
- **Special Elements (`rounded-full`)**: User avatars, operational status indicator dots, small badge pills.

## Components

### Buttons & Interactive Controls
- **Primary Button**: Solid deep blue (`#0056B3`), hover `#004494`, white text, 1px border `rgba(0,0,0,0.1)`, 32px height for compact tasks, 36px standard. Focus ring: 2px offset with `#00A3E0`.
- **Secondary Button**: White background, 1px border `#E2E8F0`, text `#0F172A`. Hover: background `#F1F5F9` and border `#CBD5E1`.
- **Ghost / Action Button**: Transparent background, text `#475569`, hover `#F1F5F9` with text `#0F172A`.

### Status Badges & Chips
- Status badges feature a 20px fixed height, font size 11px semi-bold, uppercase tracking (`0.03em`), 4px border radius, and an optional 6px pulsing dot:
  - **Atrasado / Crítico**: Background `#FEF2F2`, border `#FCA5A5`, text `#B91C1C`.
  - **Atenção / Hoje**: Background `#FFFBEB`, border `#FCD34D`, text `#B45309`.
  - **Em Andamento / Info**: Background `#EFF6FF`, border `#93C5FD`, text `#1D4ED8`.
  - **Concluído**: Background `#ECFDF5`, border `#6EE7B7`, text `#047857`.

### Inputs & Form Elements
- Inputs feature a crisp 1px `#CBD5E1` border, 34px height, `#FFFFFF` background, and text size 13px. 
- Focus state activates an outline with `2px solid #0056B3` and an ambient `#0056B3/10%` glow.
- Checkboxes are 16x16px with 4px border-radius, checking into `#0056B3` with a sharp white checkmark.

### Cards & Schedule Task Items
- **Schedule Card**: White background, 1px `#E2E8F0` border, `rounded-md` (6px). Includes a 3px vertical color bar on the left edge corresponding directly to operational status (Red, Amber, Blue, Green).
- Hover state raises card slightly with 1px border transition to `#94A3B8` and elevation tier 2.

### Specialized Operational Components
- **Command Palette (`Ctrl/Cmd + K`)**: Floating modal at top-center, instant search input, filtered command groups (Agendar, Delegar, Filtrar por Técnico, Reatribuir).
- **Time-Grid Cells**: Compact schedule matrix with dashed 1px timeline horizontal rules (`#E2E8F0`), current-time indicator represented as a `#EF4444` solid hairline with a pulsing 8px head.