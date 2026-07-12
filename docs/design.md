# design.md — Visual Design System

Owner: **Dev C**. Source: actual product wireframe (`Transitops_-_smart_transport_operations_platform__-_8_hours.png`), 9 screens covering every page in the app. This supersedes the earlier CryptGen-only draft — the wireframe is the authoritative layout/structure; CryptGen is kept only as a reference for *polish level* (glass cards, soft glow, rounded corners), not for color, since the wireframe has its own clear palette.

> ⚠️ **Naming conflict to resolve with the team:** the wireframe's login screen and RBAC table both use the role **"Dispatcher."** Every other doc (`database.md`, `backend.md`, `access-control.md`, `authentication-signin.md`, `frontend.md`) currently uses **"driver."** They're almost certainly the same role wearing two names. Pick one and I can patch the other docs in one pass — this file uses **"Dispatcher"** throughout since that's what's actually drawn.

## 1. Screen inventory (from the wireframe, authoritative)

| # | Screen | Sidebar label |
|---|---|---|
| 0 | Authentication (RBAC) | — (no sidebar, pre-login) |
| 1 | Dashboard | Dashboard |
| 2 | Vehicle Registry | Fleet |
| 3 | Drivers & Safety Profiles | Drivers |
| 4 | Trip Dispatcher | Trips |
| 5 | Maintenance | Maintenance |
| 6 | Fuel & Expense Management | Fuel & Expenses |
| 7 | Reports & Analytics | Analytics |
| 8 | Settings & RBAC | Settings |

This replaces the route table in `frontend.md` §3 — same pages, corrected labels (`Fleet` not `Vehicles`, `Analytics` not `Reports`, `Settings` added as a real page).

## 2. Color palette (read directly off the wireframe)

| Token | Approx. hex | Use |
|---|---|---|
| `--bg-base` | `#0B0B0D` | App background |
| `--bg-panel` | `#141416` | Sidebar, top bar, cards |
| `--border-subtle` | `#2A2A2E` | Card/table/input borders |
| `--text-primary` | `#EDEDED` | Headings, values |
| `--text-secondary` | `#8A8A90` | Labels, muted text |
| `--accent-primary` | `#D98C2B` (amber/burnt-orange) | Primary buttons, active nav, key numbers |
| `--status-green` | `#4CAF50` | Available, Completed, compliant |
| `--status-blue` | `#4A90D9` | On Trip, Dispatched, role badge |
| `--status-orange` | `#E0932E` | In Shop, Suspended, pending/warning |
| `--status-red` | `#E85D5D` | Retired, Cancelled, errors, rule violations |
| `--status-gray` | `#6B6B70` | Draft, Off Duty, "—" (no access) |

**Design note worth flagging to the team:** the wireframe reuses the same amber/orange for both the primary CTA color *and* the "In Shop / Suspended" warning-status badge. That's fine in a low-fidelity wireframe but will read ambiguously in the real UI (is a button orange because it's the primary action, or because something needs attention?). Recommend splitting these in implementation: keep `--accent-primary` for buttons/active-nav, shift the warning badge to a distinct amber-orange a few degrees warmer or cooler (e.g. `#E0932E` vs `#D98C2B` is close but should be tuned side-by-side so they're visibly different families, not just different shades).

## 3. Typography

- Sans-serif throughout (Inter or system UI stack). The wireframe's hand-drawn font is just Excalidraw's sketch style — not a literal font direction.
- Page title (top-left, e.g. "1. Dashboard"): drop the numbering in the real UI, keep as a plain `text-2xl` page heading.
- Section labels (SOURCE, DESTINATION, CARGO WEIGHT, GENERAL, ROLE-BASED ACCESS): small caps, `text-xs`, `--text-secondary`, letter-spacing wide — this label style repeats on every form and table header in the wireframe and should be one shared class.
- KPI numbers: large and bold, `text-3xl`+, `--text-primary` (not gradient-text — the wireframe's numbers are plain white, not stylized).

## 4. Layout shell (every authenticated page)

- **Left sidebar** (`--bg-panel`, fixed width ~220px): logo/wordmark "TransitOps" at top, then the 8 nav items from §1 stacked vertically. Active item gets a filled `--accent-primary` background with dark text (as seen on Dashboard/Vehicle Registry) — the wireframe is inconsistent between filled and outline-only active states across screens; standardize on **filled**, it reads more clearly at a glance.
- **Top bar**: search input (left), then on the right — user name (e.g. "Raven K."), a role pill badge (`--status-blue` background, e.g. "Dispatcher"), and a circular avatar with initials ("RK"). This role badge is present on every authenticated page — it's the user's constant reminder of which of the 4 roles they're acting as.
- **Content area**: `--bg-base`, cards/tables/forms in `--bg-panel` with `--border-subtle` 1px borders, `rounded-lg` (8–10px) corners — subtle, not the heavy glass-blur of the earlier CryptGen draft. Keep corners soft and borders thin; skip heavy glow effects, the wireframe's aesthetic is calm/utilitarian, not showy.

## 5. Recurring components (appear on multiple screens — build once, reuse everywhere)

**KPI card** — big number + small label underneath, used on Dashboard (7 cards) and Analytics (4 cards). Plain `--text-primary` number, `--text-secondary` label, thin border, no icon needed.

**Status badge** — small filled pill, colored per §2, used on every table (vehicles, drivers, trips, maintenance, fuel/expense rows) and in the top-bar role pill. One `<StatusBadge>` component, enum-string in → color+label out, exactly per `frontend.md` §5's existing plan — just repoint the color map to §2 above instead of the old CryptGen palette.

**Rule/Validation callout** — a bordered box in `--status-red`, used two ways:
  1. **Static footnote**, bottom of a page, reminding the user of a business rule in plain text (Vehicle Registry: *"Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher"*; Drivers: *"Expired license or Suspended status → blocked from trip assignment"*; Maintenance: *"In Shop vehicles are removed from the dispatch pool"*).
  2. **Live inline validation**, shown the moment a rule is actually violated (Trip Dispatcher: *"Vehicle Capacity: 500 kg / Cargo Weight: 700 kg / ✗ Capacity exceeded by 200 kg → dispatch blocked"*), paired with disabling the primary action button.
  Same visual component both times — red border, ✗ icon on violations, small monospace-leaning text. This is the wireframe's most distinctive pattern: business rules from `backend.md` §4 aren't hidden in a toast, they're visible as a standing element of the page.

**Quick status toggle** — row of pill buttons (Available / On Trip / Off Duty / Suspended) beneath the Drivers table, letting Safety Officer flip a selected driver's status without opening a modal. Same pill styling as status badges, just interactive.

**Filter bar** — row of dropdowns (Vehicle Type / Status / Region on Dashboard; Type / Status / Reg. No. search on Vehicle Registry) sitting directly under the top bar, above the content.

**Trip lifecycle stepper** — horizontal step indicator: Draft → Dispatched → Completed, with Cancelled drawn as a separate terminal branch rather than a 4th sequential step (matches `backend.md` §4: cancel is a side-exit, not a normal lifecycle stage). Current step filled in `--status-blue`, completed step in `--status-green`, future/inactive steps in `--status-gray`.

**Live board** — vertical list of compact trip cards (Trip ID, route, vehicle/driver, status badge, right-aligned contextual note like "45 min" or "Awaiting driver" or "Vehicle went to shop"). Used on Trip Dispatcher as the live view alongside the create-trip form.

**Status transition diagram** — tiny two-node flow (`Available → In Shop`, `In Shop → Available`) shown on the Maintenance page, directly visualizing the automatic status side-effects from `backend.md` §5. Worth keeping in the real UI as a small always-visible diagram, not just documentation — it's a nice bit of UX that shows the user *why* the vehicle disappeared from dispatch.

**RBAC matrix** — table on Settings: rows = roles, columns = modules, cells = `✓` (full access) / `View` (read-only) / `—` (no access). This is `access-control.md`'s permission matrix rendered directly as UI, and it's genuinely useful for an admin to see — implement it as a real (if read-only, or editable for a stretch goal) reflection of the backend's role checks, not just a static image.

**Bar charts** (Analytics page: Monthly Revenue, Top Costliest Vehicles) — simple bar charts, `--accent-primary`/`--status-blue`/`--status-orange`/`--status-red` per series as needed. Recharts is fine per the stack already chosen in `frontend.md`.

## 6. Page-by-page notes

**0. Authentication** — split screen: left panel light/neutral block with logo + "TransitOps — Smart Transport Operations Platform" tagline (the one deliberately light element in an otherwise all-dark app — keep it, it's a nice accent, not a mistake); right panel dark with Email, Password, Role selector dropdown, Remember me, Forgot password, Sign In (amber button). Below the form: a plain-text explainer of what each of the 4 roles can see (mirrors the RBAC matrix on Settings — consider linking the two). Error state (wrong credentials / account locked after 5 attempts) uses the same red rule-callout component as everywhere else — consistency instead of a one-off alert style.

**1. Dashboard** — filter bar, 7 KPI cards in a row, Recent Trips table (left, ~60% width) beside a Vehicle Status horizontal bar breakdown (right, ~40% width) showing Available/On Trip/In Shop/Retired counts as stacked/grouped bars.

**2. Vehicle Registry** — filter bar + search, "+ Add Vehicle" primary button top-right, full-width table, red rule-callout footer.

**3. Drivers & Safety Profiles** — search, "+ Add Driver" button, table with two status-like columns that are **not duplicates**: `SAFETY` (compliance state — derived from license validity) and `STATUS` (operational state — available/on_trip/off_duty/suspended). They usually match but can diverge (e.g. a driver with a valid license who's simply off duty shows Safety=Available, Status=Off Duty) — worth a tooltip explaining the difference so it doesn't look like a bug. Quick-toggle pill bar + rule callout beneath.

**4. Trip Dispatcher** — two-column: left is the lifecycle stepper + create-trip form (Source, Destination, Vehicle dropdown labeled "available only", Driver dropdown labeled "available only", Cargo Weight, Planned Distance) with the live validation callout and a Dispatch button that's disabled until validation passes; right is the Live Board. Labeling dropdowns "(available only)" directly in the UI is a small but effective way to reinforce the dispatch-pool rule from `backend.md` §2–3 — keep it.

**5. Maintenance** — left: Log Service Record form (Vehicle, Service Type, Cost, Date, Status, Save). Right: Service Log table + the status-transition diagram + rule callout.

**6. Fuel & Expense Management** — Fuel Logs table + "Log Fuel"/"Add Expense" buttons, a second Other Expenses (Toll/Misc) table below, and a prominent auto-computed Total Operational Cost line (Fuel + Maintenance) in `--accent-primary`, matching the formula in `database.md` §9.

**7. Reports & Analytics** — 4 KPI cards (Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI) with the ROI formula shown inline as a small caption beneath the cards (nice touch — keep it, it demystifies the number for non-technical viewers like a Fleet Manager). Two charts below: Monthly Revenue (bar) and Top Costliest Vehicles (horizontal bar).

**8. Settings & RBAC** — General settings form (Depot Name, Currency, Distance Unit) left; RBAC matrix (§5 above) right; Save changes button. Note the wireframe's RBAC columns are `Fleet / Drivers / Trips / Fuel&Exp. / Analytics` (5 columns, Maintenance folded into Fleet) — this is slightly coarser than `access-control.md`'s per-action matrix. Recommend keeping `access-control.md` as the detailed backend enforcement spec, and treating this Settings-page table as a simplified summary view of it, not a second source of truth.

## 7. Tailwind setup

```js
// tailwind.config.js — extend, don't replace
theme: {
  extend: {
    colors: {
      base: '#0B0B0D',
      panel: '#141416',
      accent: '#D98C2B',
      'status-green': '#4CAF50',
      'status-blue': '#4A90D9',
      'status-orange': '#E0932E',
      'status-red': '#E85D5D',
      'status-gray': '#6B6B70',
    },
    borderColor: {
      subtle: '#2A2A2E',
    },
  },
},
```
Root app shell: `bg-base text-[--text-primary]`. Cards/tables: `bg-panel border border-subtle rounded-lg`.

## 8. Accessibility note

`--status-orange` and `--accent-primary` are close enough in hue that they need a visible difference beyond color alone once implemented (see §2 note) — pair every status badge with its text label (already the case in the wireframe, keep it that way) rather than relying on color chips. Body text (`--text-primary`/`--text-secondary`) on `--bg-base`/`--bg-panel` passes WCAG AA; verify the amber accent text-on-dark and dark-text-on-amber-button combinations specifically, since amber/orange on near-black can undershoot AA depending on the exact shade picked during implementation.
