# Plan — Visual refresh from the Aug-9 mockup

Status: **PENDING** — decisions settled, ready to hand to the superpowers skill.
Last updated 2026-08-14.

Source of truth: [`docs/mockups/web-redesign-aug-9.png`](../mockups/web-redesign-aug-9.png).

Goal: bring the landing page in line with the Aug-9 mockup — a shorter hero, a
single service trio, an inverted surface palette, a new FAQ section, and a new
footer.

---

## 1. Scope

The mockup covers three separable bodies of work. They are **three PRDs**, not
one, so each can ship independently:

| PRD | Covers |
|---|---|
| **This one** | Hero, Services, surface tokens, section order, FAQ, Footer |
| ROI Calculator | The calculator card and its business logic |
| Portfolio rearchitecture | The dark teaser panel, image constellation, "Learn more" |

**Out of scope here.** This PRD only *reserves the slot* where the ROI Calculator
lands (an `#roi-calculator` anchor between Hero and Services). It does not build
it. The Portfolio section keeps its current carousel untouched.

**Already shipped — no work required.** Three things in the mockup are already
live and were mistaken for new work on first read: the navbar logo glyph
(`src/imports/logo/FA_Nalar Logo_dark.svg`), the hero's pill CTAs with
arrow/paperclip icons, and the CTA's circuit-board background
(`src/imports/bottom_section.svg`).

**The mockup's card copy is stale.** Its service cards read "AI Strategy &
Implementation Roadmap / Technical Cost Optimisation / Vibe-to-Production" —
copy that predates the July commits *and* the current uncommitted edits to
`content.ts`. Take layout from the mockup; take copy from the working tree.

---

## 2. Section order

```
Hero → [#roi-calculator slot] → Services → Portfolio → Approach → FAQ → CTA → Footer
```

Two moves from today: **Portfolio rises above Approach** (proof before process),
and **FAQ is inserted above the CTA**.

---

## 3. Hero

**Decision.** `"Want to win with AI?"` is promoted from small eyebrow line to the
`<h1>`. The cycling headline survives, demoted to a sub-line beneath it:

> **Want to win with AI?**
> You don't need more *[SaaS / Tokens / Tools / Developers / Consultants / Designers]* —
> you just need partners who have built great products.

`CyclingWord` is unchanged; only its type size and position move. The net effect
is a materially shorter hero, which is the point — it puts the ROI Calculator
near the fold instead of below it.

**Rejected — retire the cycling headline entirely** (what the mockup literally
draws). It is the only motion in the hero and the sharpest piece of copy on the
page; losing it to match a static mockup trades personality for nothing.

**Rejected — keep the hero exactly as-is.** Leaves the hero tall enough to push
the calculator fully below the fold, defeating the reason it was added.

---

## 4. Services — one trio

**Decision.** Cut from two groups of three to **one group of three**. The group
sub-headings disappear (with a single group they have nothing to distinguish),
the `Key Services` H2 stays, and the mockup's small chip becomes a real link:

```
Use Nalar ROI calculator →   →  #roi-calculator
```

The trio, mixed across both existing groups:

| Card | Why it survives |
|---|---|
| Replace SaaS with Open Source | Most concrete and most differentiating; pays off the calculator directly above it |
| Replace Vendors with Agents | The AI-forward claim, still on the cost side |
| Cost Free Maintenance & Instant Handoff | The defensible differentiator — echoes Approach's *"we don't want to lock you in"* |

**Rejected — `High Speed Development` for the third slot.** Every shop claims
fast delivery, so it does no competitive work. No-lock-in handoff is a claim
competitors structurally cannot make.

**Rejected — keep both groups with headings as chips.** Coherent, but leaves the
page long and dilutes the single-trio focus the mockup is going for.

**Cost:** three cards leave the site — `Token Optimization` from group 1, and
`User Research & Product Design` plus `High Speed Development` from group 2. The
"we build things" half of the offering now lives only in Portfolio and Approach.

---

## 5. Surfaces — invert the palette

**Decision.** The mockup inverts today's model. Add a page token and repoint the
surface token:

```css
--nalar-page:    #f2f2f2;  /* new — page background        */
--nalar-surface: #ffffff;  /* was #f8f8f8 — cards, panels  */
```

exposed as `bg-page` alongside the existing `bg-surface`. Because every card
already consumes `bg-surface`, cards turn white on their own.

Touch points:

| File | Change |
|---|---|
| `src/styles/theme.css` | Add `--nalar-page` / `--color-page`; repoint `--nalar-surface` |
| `src/app/App.tsx:17` | `bg-white` → `bg-page` |
| `src/app/sections/Navbar.tsx:57` | Menu overlay `bg-white` → `bg-page` |
| `ServiceCard`, `PortfolioCard` | No change — inherit via `bg-surface` |

**Do not** change `Hero.tsx:91` (the CTA pills) or `Navbar.tsx:18` (the logo
circle) — those are deliberately white *on* the page and gain contrast from the
inversion.

**Fold in:** the accent gradient `from-[#3c3c3c33] to-[#ffffff33]` is hard-coded
in four files (`ServiceCard`, `PortfolioCard`, `PortfolioModal`, `VideoFacade`).
That already violates the repo's "never hard-code hex" rule, and its `#ffffff33`
stop is invisible once the surface beneath it is white. Tokenize it in this same
sweep — it is the one refactor this work genuinely requires rather than an
unrelated tidy-up.

**Rejected — keep the white page.** Zero token churn, but the cards keep sitting
flat and the mockup's floating-panel look is unachievable without shadows, which
the design system forbids.

**Rejected — gray page with `#f8f8f8` cards plus a hairline.** Cards at
`#f8f8f8` on a `#f2f2f2` page are ~1.03:1 — effectively invisible — so they would
need `border-line` outlines, reading as outlined boxes rather than white panels.

---

## 6. FAQ — new section

**Decision.** A new section between Approach and CTA, patterned on
[tenex.co](https://www.tenex.co/): single-column shadcn `Accordion`
(`components/ui/accordion.tsx`, already in the repo), **six** questions, **all
collapsed by default**, with a `Book a call` button directly beneath — Tenex's
"Get Started" placement.

This also fixes a live bug: `NAV_LINKS` contains `{ label: "FAQ", href: "#faq" }`
pointing at a section that does not exist. The new section takes `id="faq"`.

The questions, ordered by what earns trust fastest:

| # | Question | Answer draws on |
|---|---|---|
| 1 | How are you different from a dev shop or agency? | Founder-led delivery, open-source default, CMU × Cornell |
| 2 | What happens when the project ends — are we stuck with you? | Training + handoff, versioned docs, open tools, no lock-in |
| 3 | How does pricing work? | Free 30-min call → plan → fixed written proposal |
| 4 | Do we need an in-house engineer or IT team? | No — the ICP is explicitly "no dedicated IT team" |
| 5 | Can AI run privately on our own data? | Local / private model deployment; Profile B's privacy needs |
| 6 | What kind of companies do you work with? | 10–60 employees, tech-as-means-not-product — and who *isn't* a fit |

Q2 is deliberately second, ahead of pricing: no-lock-in is the strongest
differentiator and answering it early reframes everything below it. Q6 naming
who is *not* a fit (tech startups, teams with in-house engineering) filters
bad-fit leads before they reach the calendar.

**Decision — no rate on the public site.** Q3 describes the *process* and states
no number, despite the business plan's internal $20–$50/hour range.

**Rejected — publish $20–$50/hour.** Maximally transparent and a strong budget
filter, but it anchors a 60-person prospect to an hourly frame, caps perceived
value, and makes both raising rates and quoting project fees visibly awkward later.

**Rejected — "projects typically start at $X".** Keeps the filter without the
hourly anchor, but requires committing to a floor number that has no evidence
behind it at two active clients.

**Rejected — FAQ replaces the CTA** (the literal request). Tenex keeps both, and
removing the CTA would leave no conversion point between Approach and the footer.
The FAQ's own `Book a call` button plus the retained CTA is strictly better.

---

## 7. Footer — new section

**Decision.** New `src/app/sections/Footer.tsx`. Dark surface, using the existing
`src/imports/logo/FA_Nalar Logo_light.svg`.

| Link | Destination |
|---|---|
| Contact | `CALENDLY_URL` |
| LinkedIn | `PLACEHOLDER_URL` |
| Twitter | `PLACEHOLDER_URL` |

Blurb, with the mockup's grammar corrected ("ran by" → "run by", "Collective"
lowercased mid-sentence):

> Nalar is a collective design engineering lab run by people from Indonesia
> across the world, where Nalar means "makes sense".

**Placeholders are a deliberate, temporary choice.** No LinkedIn or Twitter page
exists yet. Both point at a single exported `PLACEHOLDER_URL` constant so
swapping them later is a one-line change in `content.ts`.

**Rejected — render only links that have a real URL.** Ships with no dead links
at all, but was declined in favour of showing the full set now. The consequence
is accepted and tracked in §9.

---

## 8. Work order

Land the uncommitted `content.ts` / `ServiceCard.tsx` edits **before** starting.

1. **Tokens** — `theme.css` page + surface, tokenize the accent gradient, sweep
   `App.tsx` and `Navbar.tsx`. Visual pass before moving on; everything after
   this sits on top of it.
2. **Hero** — promote H1, demote cycling line to sub-line.
3. **Services** — one trio, drop sub-headings, add the calculator chip and the
   `#roi-calculator` anchor slot.
4. **Section reorder** — Portfolio above Approach in `App.tsx`.
5. **FAQ** — new section + content, `id="faq"`.
6. **Footer** — new section + `PLACEHOLDER_URL`.

Steps 2–6 are independent once step 1 lands.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| **The surface inversion touches every card surface, and there is no automated component coverage** — no jsdom/RTL/vitest in this repo, so nothing catches a regression here. | Manual visual pass at 375 / 768 / 1440 after step 1, before any other step. Explicitly *not* claimed as tested. |
| The accent gradient's `#ffffff33` stop disappears against a white surface. | Re-derive the gradient against white when tokenizing, don't port the values verbatim. |
| LinkedIn and Twitter ship as dead links. | Single `PLACEHOLDER_URL` constant; swap before or shortly after launch. Accepted knowingly (§7). |
| Cutting to one trio removes the "we build things" story. | Portfolio and Approach still carry it. Revisit if leads start arriving unaware of the build capability. |
| The `#roi-calculator` anchor points at nothing until PRD 2 ships. | Ship the chip link **only** when the calculator lands, or the chip becomes a second dead link. Gate it in step 3. |
| Lenis owns wheel events site-wide. | The FAQ accordion is not an independently scrollable region, so no `data-lenis-prevent` is needed — but verify once the section is in. |

---

## 10. Not covered

- **No automated tests.** Every change here is presentational; the repo's test
  path is `node --test` over pure logic only. Verification is manual, in-browser.
- The ROI Calculator itself — separate PRD.
- The Portfolio rearchitecture — separate PRD, which must also resolve its
  conflict with [`2026-08-09_portfolio-video_PENDING.md`](2026-08-09_portfolio-video_PENDING.md):
  that PRD's whole design assumes the carousel survives, and the mockup replaces
  it with a teaser panel.
