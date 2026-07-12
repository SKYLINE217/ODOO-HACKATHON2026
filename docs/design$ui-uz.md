# Soft UI Dashboard PRO — Full Design & UX Specification
**Source:** Soft UI Dashboard PRO React (Creative Tim) — `demos.creative-tim.com/soft-ui-dashboard-pro-react`
**Stack:** React + MUI (Material UI) v5, styled via `sx` API + custom theme, Chart.js (react-chartjs-2), FullCalendar, React Table, Formik, SweetAlert2, ThreeJS, VanillaTilt, React Flatpickr, React Select, React Quill, React Dropzone, React Kanban, ChromaJS, CountUp

---

## 1. Design System Foundations

### 1.1 Color Palette
| Token | Hex | Usage |
|---|---|---|
| Primary | `#cb0c9f` (magenta/pink) | CTAs, active nav, links, gradient starts |
| Secondary | `#8392ab` | Muted text, secondary buttons |
| Info | `#17c1e8` | Info badges, charts, VR theme accent |
| Success | `#82d616` | Positive deltas, success alerts |
| Warning | `#fbcf33` | Warning badges |
| Error | `#ea0606` | Destructive actions, error states |
| Light | `#e9ecef` | Backgrounds, dividers |
| Dark | `#141727` | Sidenav dark mode, headings |
| White | `#ffffff` | Card surfaces |
| Background body | `#f8f9fa` | App canvas |
| Gradient direction | `195deg` diagonal | All "soft" gradient buttons/cards: `linear-gradient(195deg, colorLight 0%, colorDark 100%)` |

### 1.2 Typography
- Font family: **Open Sans** (fallback: Helvetica, Arial, sans-serif)
- Scale: h1 48px/700, h2 36px/700, h3 30px/700, h4 24px/700, h5 20px/600, h6 16px/600, body1 16px/400, body2 14px/400, caption 12px/400, button 14px/700 uppercase-optional
- Letter-spacing on headings: `-0.5px` to `-1px` for tightness
- Line-height: 1.6 for body copy, 1.25 for headings

### 1.3 Spacing, Radius & Elevation
- Base spacing unit: 8px (MUI default), card padding 24px, section gutters 24px
- Border-radius: buttons `0.5rem`, cards `1rem` (`xl`), inputs `0.5rem`, avatars `50%`, pills/badges `50rem`
- Shadow system ("soft" shadows — diffused, colored, low-opacity):
  - `sm`: `0 1px 2px rgba(0,0,0,.07)`
  - `md`: `0 4px 6px -1px rgba(20,20,20,.12)`
  - `lg`: `0 8px 26px -4px hsla(0,0%,8%,.15)`
  - `xl`: `0 23px 45px -11px hsla(0,0%,8%,.20)` (used on hover-elevated cards, dropdown menus, modals)
  - Colored shadow variant on hover for gradient buttons: `0 3px 5px -1px rgba(theme,.4), 0 7px 10px -5px rgba(theme,.4)`

### 1.4 Motion / Animation Library (applies globally)
| Interaction | Effect | Timing |
|---|---|---|
| Button hover | `translateY(-1px)` lift + shadow deepen | `150ms ease-in-out` |
| Button active/press | scale `0.98` | `100ms ease` |
| Card hover (dashboard/product/team cards) | `translateY(-4px to -6px)` + shadow `md → xl` | `200-300ms cubic-bezier(.34,1.61,.7,1)` |
| Sidenav route change | active item background fades in with gradient + icon color swap | `200ms ease` |
| Sidenav collapse/mini toggle | width transition `250px ↔ 96px`, text fades/slides out via opacity+translateX | `300ms cubic-bezier(.685,.0473,.346,1)` |
| Page/route transition | fade-in of content container | `300ms ease-in` on mount |
| Configurator drawer (right sidebar) | slide-in from right `translateX(100%) → 0` | `250ms ease` with backdrop fade |
| Navbar dropdown / notification menu | scale+fade `opacity 0→1, transform: scale(.95)→scale(1)`, transform-origin top-right | `200ms ease-out` |
| Modal / Dialog | backdrop fade + dialog scale-in `0.9 → 1` | `225ms` (MUI default `Grow`/`Fade`) |
| Tooltip | fade + 4px slide | `150ms` |
| Progress bars | width animates from 0 to target % on mount/data load | `600-800ms ease-out`, striped variants have a moving-stripe CSS animation (`animation: progress-bar-stripes 1s linear infinite`) |
| CountUp numbers (KPI stat cards) | digits count up from 0 to value | `1.5–2s ease-out` on scroll-into-view/mount |
| Chart draw-in (Chart.js) | line/bar animate from baseline, points fade in | `1000ms easeOutQuart` (Chart.js default animation config) |
| Skeleton loaders | shimmer gradient sweep | `1.5s infinite linear` |
| Snackbar/toast | slide up from bottom-right + fade, auto-dismiss | enter `300ms`, visible `3-5s`, exit `200ms` |
| VanillaTilt (used on select cards e.g. pricing/VR) | 3D parallax tilt following cursor, subtle `perspective(1000px) rotateX/rotateY` + glare | continuous, `max-glare .5`, `scale 1.02` |
| Drag-and-drop (Kanban) | card lifts with shadow + slight rotate `2deg` while dragging, drop zones highlight border | native drag events, `150ms` snap-back |
| Sweet Alerts | icon draw-in animation (checkmark stroke, X stroke), modal bounce-in | SweetAlert2 defaults, `~300ms` |
| Wizard step transition | horizontal slide of form panel + progress bar/stepper fill animates | `300-400ms ease` |
| Globe (dashboard default) | auto-rotating 3D globe with animated arcs pulsing between points | continuous `rotate`, arc-dash animation loop |
| Image/lightbox viewer | fade+scale in, swipe/drag navigation between images | `250ms` |

### 1.5 Responsive Breakpoints
`xs <600px` (drawer becomes overlay, sidenav auto-collapses to icon-only / off-canvas with hamburger toggle), `sm 600-900px`, `md 900-1200px` (2-col grids collapse to 1), `lg 1200-1536px` (full multi-column dashboards), `xl >1536px`.

---

## 2. Global Persistent Chrome

### 2.1 Sidenav (left, fixed, ~250px expanded / ~96px mini mode)
- **Structure:** Brand logo+name header → scrollable nav list grouped by section titles ("DASHBOARDS", "PAGES", "APPLICATIONS", "ECOMMERCE", "AUTHENTICATION", "DOCS") → collapsible sub-menus (Firebase-doc-style dashboard flyout) → bottom promo card ("Sidebar illustration" upgrade-to-pro card with gradient background) → Documentation/Upgrade buttons.
- **Style:** two color modes — `white` (light card on light bg) and `dark`/`transparent` toggled via Configurator; active route item gets a `primary`-gradient pill background with white icon+text and `md` shadow; hover state on inactive items = light gray background fade.
- **Functionality:** collapsible nested menus (accordion, chevron icon rotates 180° on expand, `250ms`), mini-sidenav toggle (pins to icons only, tooltips appear on hover when mini), auto-closes on mobile after navigation, scroll-shadow appears at top/bottom when list overflows, active/parent route auto-expands its submenu on load.

### 2.2 Navbar (top, sticky, transparent-over-content or solid on scroll)
- **Elements:** breadcrumb (dynamic based on route, shows section > page), global search input (soft rounded, expands on focus on mobile), icon-button cluster: Configurator (settings gear — spins slightly on hover), notifications bell (badge dot with unread count, opens dropdown list of notification items with avatar+text+time, each with slide/fade-in stagger), account dropdown (avatar → menu: profile/settings/logout), sidenav toggle burger (mobile only), "Online Builder"/"Sign In" CTA buttons.
- **Behavior:** becomes translucent+blurred (`backdrop-filter: blur`) with subtle shadow once page is scrolled (`sticky` + scroll listener toggling a class), fixed on top for dashboard pages, static for auth/simple pages.

### 2.3 Configurator (right-hand slide-out drawer)
- **Trigger:** floating gear button fixed to viewport edge (rotates continuously slow spin as idle affordance, or spins on hover).
- **Content:** Sidenav color picker (swatch buttons: primary/dark/info/success/warning/error — selecting animates a checkmark scale-in on the chosen swatch), Sidenav type toggle (white/dark/transparent — segmented control), Navbar Fixed switch, Sidenav Mini switch, Light/Dark mode switch, "Buy Now"/"View Documentation" buttons, social share icons.
- **Animation:** drawer slides from `right: -360px → 0`, backdrop overlay fades in, closes on outside click or X button, all toggles are MUI `Switch` with thumb slide `200ms`.

### 2.4 Footer
- Simple two-column: copyright text + horizontal link list (About, License, Docs, Blog). Fades in with page content, no special interactivity beyond link hover underline.

---

## 3. Dashboards Section

### 3.1 Default Dashboard (`/dashboards/default`)
- **Layout:** Top row of 4 mini KPI "stat cards" (icon in gradient rounded square, animated CountUp number, % change chip colored green/red with up/down arrow icon, label) → 2-col row: large gradient "Sales Overview" line/area chart card (period dropdown filter) + smaller bar chart card ("Active Users" mixed bar+line, with mini 4-stat inline row inside using divider borders) → 3-col row: Projects table card (progress bars per row, avatar stack for team members, status dot badges) + Orders overview timeline card (vertical timeline with colored dot markers per event, dashed connector line, timestamp captions) + 3D rotating Globe card with location markers/arcs.
- **Dynamic elements:** chart tooltips on hover (custom styled dark tooltip showing exact value), period-select dropdown re-renders chart data with cross-fade, progress bars animate to width on load, table rows highlight on hover, "See more" links.
- **Animations:** stat cards fade+slide-up staggered on mount (~80ms stagger), globe auto-rotates and arc lines pulse-draw repeatedly, timeline dots pulse briefly when new item "added" (demo data).

### 3.2 Automotive Dashboard (`/dashboards/automotive`)
- **Theme:** dark, high-contrast, tech/dashboard-cluster aesthetic (car HUD feel) with neon accent gradients (cyan/purple).
- **Layout:** hero "car stats" card with large circular gauge/speedometer components (battery %, mileage, speed) rendered as circular progress rings; secondary cards for maintenance schedule, trip history table, mini bar chart for fuel/battery efficiency, world/route map card.
- **Dynamic elements:** circular sliders/gauges animate needle/arc sweep to value on load (`800ms ease-out`), live-style ticking numeric counters, hover states reveal tooltip with exact metric.
- **Animations:** glow pulse on primary gauge ring, gradient shimmer on hero card background.

### 3.3 Smart Home Dashboard (`/dashboards/smart-home`)
- **Layout:** device-control card grid — each card represents a room/device (Living Room, Bedroom, Garage, etc.) with icon, on/off toggle switch, and a temperature/brightness circular or linear slider control; central "energy usage" area chart; device list with connectivity status dot (green=online).
- **Dynamic elements:** toggle switches animate thumb + background color, sliders are draggable (custom circular slider component) and update a live numeric readout as dragged, card background subtly shifts tone when device toggled on (dim → bright gradient).
- **Animations:** icon bounces slightly on toggle press, active devices get soft glowing box-shadow pulse.

### 3.4 CRM Dashboard (`/dashboards/crm`)
- **Layout:** revenue/leads KPI stat row → sales funnel visualization (stacked horizontal bar or funnel chart) → deals-by-stage kanban-style mini board or table → leaderboard list of top sales reps (avatar, name, progress bar, $ value) → recent activity feed (timeline).
- **Dynamic elements:** funnel stages animate width-in sequentially, leaderboard rows sortable, activity feed items fade/slide in as if streaming.

### 3.5 Virtual Reality Dashboards (`/dashboards/virtual-reality/default`, `/dashboards/virtual-reality/vr`)
- **Layout:** split-screen dual-panel simulated VR headset view (two mirrored circular-cropped viewports) showing 3D scene/environment cards; below, VR session stats (session time, headset battery), device connection card.
- **Dynamic elements:** VanillaTilt parallax tilt applied to the two viewport panels (mouse-follow 3D tilt), simulated "lens distortion" vignette styling.
- **Animations:** subtle chromatic/vignette overlay pulse, panels tilt in real time following cursor position within card bounds.

---

## 4. Applications Section

### 4.1 Analytics (`/applications/analytics`)
- **Layout:** channel-performance stat cards → large multi-series line chart (traffic sources) with legend toggle (click legend item to hide/show series with line fade), geography map card (choropleth or pin map) with country list + progress bars, referral/social breakdown horizontal bar chart, browser usage donut/pie chart.
- **Dynamic elements:** legend-click series toggling animates line opacity 1→0, pie/donut chart slice hover pops out slightly (`transform: scale`) with tooltip, date-range picker (Flatpickr) filters all charts with a loading skeleton flash then cross-fade to new data.

### 4.2 Calendar (`/applications/calendar`)
- **Component:** FullCalendar integration — month/week/day/list view toggle tabs.
- **Dynamic elements:** drag-to-create events (click+drag on empty slot opens "New Event" modal), drag-and-drop existing events to reschedule (event ghost-follows cursor, drop snaps to grid with brief highlight flash), resize event duration by dragging edge, color-coded event categories (chip color picker in create-event modal), event click opens detail popover.
- **Animations:** view-switch cross-fades grid, event creation modal scale-in, hover on day cell subtly highlights background.

### 4.3 Kanban (`/applications/kanban`)
- **Component:** React Kanban board — multiple columns (e.g., Backlog / In Progress / In Review / Done), each with card stack.
- **Dynamic elements:** full drag-and-drop of cards between/within columns (card lifts with shadow+slight rotate while dragging, column highlights drop target with dashed border), "+ Add card" inline input per column, card click opens detail modal (title, description, labels, assignees, due date), column header shows live card count badge.
- **Animations:** card drop snaps into place with a small bounce (`cubic-bezier overshoot`), column count badge pulses when count changes.

### 4.4 Wizard (`/applications/wizard`)
- **Layout:** multi-step form (e.g., "About", "Account", "Address") inside a card with horizontal stepper header (numbered circles connected by progress line) and account-type illustration side panel.
- **Dynamic elements:** stepper line fills progressively as steps complete (animated width), form validation (Formik) shows inline red error text + red input border shake on invalid submit, "Next/Prev" buttons slide the form panel horizontally, final step shows a review/confirmation summary then success state (checkmark animation).
- **Animations:** step circle scales+fills with gradient when active/completed, panel-slide transition `300-400ms`.

### 4.5 Data Tables (`/applications/data-tables`)
- **Component:** React Table with sorting, global search filter, column visibility, pagination controls (SoftPagination — numbered pills, active pill gradient-filled).
- **Dynamic elements:** column header click toggles sort (arrow icon rotates/flips), search input live-filters rows with debounce, row-select checkboxes reveal a floating bulk-action bar, page-size dropdown, row hover background tint, empty-state illustration when filter yields none.

---

## 5. Ecommerce Section

### 5.1 Overview (`/ecommerce/overview`)
- **Layout:** revenue/orders/customers KPI stat cards → sales performance area chart → "Sales by Country" list w/ flags+progress bars → best-selling products mini table (thumbnail, name, price, sold count, sparkline) → recent orders table.
- **Dynamic elements:** sparkline mini-charts animate draw-in, product thumbnail hover zooms slightly.

### 5.2 Products list (`/ecommerce/products`)
- **Layout:** filter/search toolbar (category dropdown, price range, search) → responsive product card grid (image, name, category tag, price, quick-edit/delete icon buttons) or table-list toggle view.
- **Dynamic elements:** card image swaps to a secondary/hover image on mouse-over (`opacity cross-fade`), "Add Product" opens a full form (drag-drop image uploader via React Dropzone with preview thumbnails and progress bar during "upload"), delete triggers SweetAlert confirmation modal, filters animate grid reflow (FLIP-style repositioning).

### 5.3 Order List / Order Details (`/ecommerce/orders/order-list`, `/ecommerce/orders/order-details`)
- **List:** searchable/sortable table, status badges (Paid=green, Refunded=yellow, Canceled=red — colored soft-pill), row expand for quick preview, bulk actions bar.
- **Details:** order summary card (customer info, shipping address, payment method icons), itemized product table, order-status horizontal stepper/tracker (Placed → Packed → Shipped → Delivered) with animated fill line and pulsing "current" step icon, invoice/print button, order notes editor.

### 5.4 Referral (`/ecommerce/referral`)
- **Layout:** referral-link card with copy-to-clipboard input (button shows a checkmark + "Copied!" tooltip flash on click, then reverts after ~2s), invite stats (invited/joined/earned KPI cards), referral leaderboard/history table, social share icon buttons.
- **Dynamic elements:** copy button micro-interaction (icon morph clipboard→check, `200ms`), share icons scale on hover.

---

## 6. Pages Section

### 6.1 Profile Overview (`/pages/profile/profile-overview`)
- **Layout:** cover-photo header card with large circular avatar (overlapping cover image bottom edge), name/role/social icons, tab bar (App / Message / Settings), stats row (posts/followers/following with CountUp), "Platform Settings" checklist card (switches for notifications), "Conversations" list card (avatar+snippet+timestamp), Projects card grid (image, title, team avatar stack, progress bar).
- **Dynamic elements:** tab switch cross-fades panel content, switches animate, avatar has subtle hover ring glow, project cards lift on hover.

### 6.2 Profile — Teams / All Projects / New User variants
Same card system reused: Teams shows member grid with role badges & "Add Member" dashed-border card; All Projects is a filterable/sortable card or table grid; New User is a stepper/tabbed profile-creation form (avatar upload dropzone, tag-input for skills via React Tag Input).

### 6.3 Account: Settings / Billing / Invoice / Security (`/pages/account/*`)
- **Settings:** left vertical sub-nav (Basic Info, Change Password, 2FA, Accounts/social connections, Notifications, Delete Account) + right content panel that scrolls/anchors to matching section on click (smooth-scroll with active sub-nav item highlight following scroll position — scrollspy).
- **Billing:** payment-method cards (credit card visual mockups with gradient background + chip icon, "Default" badge), billing-info form, invoice history table with download icon buttons per row (PDF).
- **Invoice:** printable invoice detail layout, itemized table, totals summary block, "Download/Print" buttons.
- **Security:** password strength meter (bar fills + color shifts red→yellow→green as user types, live label "Weak/Medium/Strong"), 2FA toggle opens QR-code setup modal.
- **Dynamic elements:** scrollspy nav, switches, credit-card add form with input masking, delete-account button opens destructive-confirmation SweetAlert (red icon, requires typed confirmation).

### 6.4 Projects (`/pages/projects`)
- Portfolio-style masonry/grid of project cards with cover image, category tag, title, short excerpt, team avatar stack + progress ring; filter tab bar by category (animated underline indicator sliding to active tab).

### 6.5 RTL (`/pages/rtl`)
- Mirrors the Default Dashboard layout entirely with `direction: rtl` — sidenav flips to right side, all paddings/margins/icons mirror, text right-aligned, demonstrates theme's RTL plugin (stylis-plugin-rtl). No new components, purely a layout-direction toggle demo.

### 6.6 Widgets (`/pages/widgets`)
- Component showcase grid: informational stat cards (multiple color/icon variants), horizontal bid/countdown cards, social-post preview cards (like/comment/share icon row with count), pricing mini-cards, testimonial cards, upload/progress widgets — essentially a catalog page for reusable card patterns with varied hover/lift animations per card type.

### 6.7 Charts (`/pages/charts`)
- Gallery of every chart type available in the kit: line, bar, mixed, horizontal bar, bubble, pie/doughnut, gradient-line — each in its own card with a legend and hover tooltips; charts animate draw-in on scroll into viewport (intersection-observer triggered).

### 6.8 Sweet Alerts (`/pages/sweet-alerts`)
- Button grid triggering each SweetAlert2 variant: basic, success, error, warning, info, custom-HTML, input-prompt, confirm/cancel dialog, custom-positioned toast. Each button click demonstrates the modal's bounce-in entrance, icon draw animation, and auto-dismiss/timer variants.

### 6.9 Notifications (`/pages/notifications`)
- Demonstration page for in-app alert banners (colored soft-alert bars with icon + dismiss "×", dismiss animates height/opacity collapse) and toast/snackbar triggers positioned in all four screen corners; buttons fire live example toasts.

### 6.10 Pricing Page (`/pages/pricing-page`)
- Hero header with gradient background + billing-cycle toggle (Monthly/Yearly switch that re-prices all cards with a number cross-fade), 3-column pricing card set (middle "recommended" card scaled slightly larger `scale(1.05)` with accent border/shadow), feature-comparison table below, FAQ accordion (chevron rotates, panel height auto-animates open/close).
- VanillaTilt tilt effect applied to pricing cards on hover.

### 6.11 Users (`/pages/users`)
- Reuses/extends the Data Table pattern specifically for a user-management list: avatar+name+email column, role badge, status toggle switch (active/inactive), last-login column, row action menu (edit/delete via kebab icon opening a small popover menu), "Add User" modal form.

### 6.12 Error Pages (`/authentication/error/404`, `/500`)
- Centered full-viewport illustration (large stylized number graphic) + heading + short message + "Back to home" button; subtle floating/parallax animation on the illustration (gentle up-down `translateY` loop, `3-4s ease-in-out infinite`).

---

## 7. Authentication Section

Shared traits across all auth layouts: split-screen or centered card design, background either a full-bleed gradient/photo panel (Cover variant) or plain (Basic variant) or with decorative background pattern (Illustration variant); forms use SoftInput fields with floating/soft labels, icon-prefixed inputs (mail, lock), primary gradient submit button (full-width, hover-lift), "OR" divider with social login icon buttons (Facebook/Google/Apple — circular icon buttons with hover background fill), inline Formik validation (red helper text under invalid field, red input border), link to switch between Sign In/Sign Up.

### 7.1 Sign In — Basic / Cover / Illustration (`/authentication/sign-in/*`)
- **Basic:** simple centered white card on light background.
- **Cover:** full-height background image with card floating on top; background has slow subtle `scale`/`ken-burns` drift or static parallax.
- **Illustration:** left panel = form, right panel (desktop only, hidden on mobile) = decorative illustration/graphic that can gently float.
- **Dynamic:** "Remember me" switch, "Forgot password?" link, submit shows loading-spinner state inside the button while "authenticating," error state shakes the card horizontally on failed submit.

### 7.2 Sign Up — Basic / Cover / Illustration (`/authentication/sign-up/*`)
- Same visual family as Sign In; adds a Terms-and-Conditions checkbox (must be checked to enable submit — button is disabled/greyed until valid), password-strength meter live feedback.

### 7.3 Reset Password — Basic / Cover (`/authentication/reset-password/*`)
- Single-field email form → on submit shows a success confirmation state (checkmark icon animates in, message "check your inbox") replacing the form via cross-fade.

### 7.4 Lock (`/authentication/lock`)
- Centered avatar + name with a single password field ("Enter to unlock") — simulates a locked-session screen; unlock triggers a brief scale/fade transition to simulate route change.

### 7.5 2-Step Verification (`/authentication/2-step-verification`)
- Segmented OTP input (individual boxed digit inputs that auto-advance focus to the next box on keystroke, auto-submits when last digit entered), "Resend code" link with a countdown timer (disabled + counting down `60s → 0`, then re-enabled).

---

## 8. Cross-Cutting Functional Patterns

- **Theming engine:** all colors driven by a central MUI theme object; Configurator writes to React Context, causing instantaneous re-theme of sidenav/buttons across the whole app without reload.
- **Dark mode:** global light/dark switch toggles background/surface/text tokens app-wide with a smooth `background-color transition 200ms`.
- **Loading states:** skeleton placeholders (shimmering gray blocks matching final content shape) shown briefly on route entry/data fetch before content fades in.
- **Empty states:** friendly icon/illustration + short copy + primary action button, used across tables/lists when no data.
- **Accessibility:** focus-visible outlines on all interactive elements, ARIA labels on icon-only buttons, sufficient color contrast on gradient text overlays, keyboard navigable stepper/wizard/OTP components.
- **Notifications system:** global Snackbar/Toast context reusable from any page for success/error/info feedback after actions (save, delete, copy, submit).
- **Form validation pattern (Formik + Yup across all forms):** on-blur + on-submit validation, red border + helper text, submit button disabled while invalid or `isSubmitting`.
