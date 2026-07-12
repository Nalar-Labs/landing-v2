# Nalar Labs — Design System

Source of truth: **Nalar Labs Branding** (Figma). This document mirrors the design
into the tokens defined in `src/styles/theme.css`. Components should reference the
semantic Tailwind utilities below — **never hard-code hex values, font names, or raw
pixel spacing** in a component.

---

## 1. Brand personality

Confident, quiet, and technical. Large light-weight display type on generous white
space, one warm accent (orange) used sparingly for the single primary action per view.
The layout is calm and editorial — hierarchy comes from **size, weight, and spacing**,
not from color or decoration.

---

## 2. Color

| Token (utility)        | Value      | Use                                             |
| ---------------------- | ---------- | ----------------------------------------------- |
| `text-black` / white   | `#000` `#fff` | Base foreground / page background            |
| `bg-brand` `text-brand`| `#ff5900`  | Primary accent — CTAs, active menu link, selection |
| `bg-brand-hover`       | `#ff7a33`  | Accent hover only                               |
| `text-ink` / `bg-ink`  | `#1e1e1e`  | Active timeline node, near-black foreground     |
| `bg-ink-soft`          | `#3c3c3c`  | "Explore Nalar" pill                            |
| `bg-surface`           | `#f8f8f8`  | Service card surface, muted panels              |
| `text-muted-ink`       | `#9a9a9a`  | Secondary text (card descriptions)              |
| `border-line`          | `#d9d9d9`  | Hairlines, timeline rail, inactive nodes        |

Rules:
- **One accent per view.** Orange marks the single primary CTA and the active nav item.
- Selection uses brand orange on white (`selection:bg-brand selection:text-white`).
- Body/secondary copy uses `text-muted-ink`; never gray-on-gray below 4.5:1 for primary text.

---

## 3. Typography

Two families, loaded in `index.html`:

- **Public Sans** → `font-display` — all headings and most UI text.
- **Inter** → `font-body` — hero inline links only.

### Type scale (px) & tracking

Display type uses tight negative tracking (~**-0.03em**). Use these exact steps:

| Role                | Mobile → Desktop        | Weight         | Tracking   |
| ------------------- | ----------------------- | -------------- | ---------- |
| Hero / page title   | `48 → 72 → 96`          | Light (300)    | `-2.88px`  |
| Section title (h2)  | `56 → 96`               | Light (300)    | `-2.88px`  |
| Subsection (h3)     | `40 → 64`               | Light (300)    | `-1.92px`  |
| Card title / step   | `24 → 32`               | Medium (500)   | `-0.96px`  |
| Body / description  | `18 → 24`               | Light (300)    | `-0.72px`  |
| CTA label           | `24 → 36`               | Light (300)    | `-1.08px`  |

- Display line-height `1.1`; body line-height `normal`–`1.5`.
- Headings are **Light**; card titles and step labels are **Medium**. Never Bold.

---

## 4. Spacing & rhythm (8pt system)

All padding, gaps, and margins are multiples of **8px** (Tailwind `2 / 3 / 4 / 6 / 8 / 12 / 16 / 24 …`).

| Purpose                     | Value                          |
| --------------------------- | ------------------------------ |
| Page gutter                 | `px-6` (24) mobile → `px-12` (48) desktop |
| Section vertical padding    | `py-24` (96) — via `<Section>` |
| Gap between title & content | `mb-16` (64) — via `SECTION.titleGap` |
| Card grid gap               | `gap-6` (24)                   |
| Approach step spacing       | `space-y-24` (96)              |
| Content max-width           | `max-w-[1600px]` (sections), `max-w-[1345px]` (hero headline) |

Use the shared `<Section>` wrapper and `SECTION`/`TYPE` constants in
`src/app/lib/layout.ts` so spacing stays consistent instead of ad-hoc per component.

---

## 5. Shape & elevation

- Cards and the CTA panel: `rounded-card` (30px).
- Pills / icon buttons: `rounded-full`.
- **No drop shadows.** Depth comes from surface color (`bg-surface`) and hover motion.
- Gradient accent card: subtle `#3c3c3c33 → #ffffff33` over `bg-surface`.

---

## 6. Motion

- Entrance: fade + 20px rise, `duration 0.8s`, `ease-out` (hero), staggered per section.
- Card hover: `-translate-y-1` (never layout-shifting siblings).
- Hamburger ↔ close: 300ms transform.
- Respect `prefers-reduced-motion` — gate non-essential entrance animation.

---

## 7. Layout structure (do not change)

`Navbar` (fixed) · `Hero` · `Services` (Consultation + End-to-End Implementation) ·
`Approach` (vertical timeline) · `CTA` footer. Each lives in `src/app/sections/`;
reusable pieces (`ServiceCard`, `ApproachItem`) live in `src/app/components/`.

---

## 8. Accessibility

- Body text ≥ 16px; minimum touch target 44×44px (nav toggle, CTA).
- Icon-only controls need an `aria-label` (menu toggle).
- Maintain focus-visible rings on links/buttons; do not remove outlines.
- Color is never the only signal (active timeline node also changes size).
