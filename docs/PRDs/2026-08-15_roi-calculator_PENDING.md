# Plan — ROI Calculator

Status: **PENDING** — decisions settled, ready to hand to the superpowers skill.
Last updated 2026-08-15.

Sources of truth:
[`docs/mockups/web-redesign-aug-9.png`](../mockups/web-redesign-aug-9.png) for layout,
[`docs/roi-calculator-config.xlsx`](../roi-calculator-config.xlsx) for **every number**.

Goal: a calculator between the Hero and Services that turns "what should we build
for you?" into a credible savings figure, and turns that figure into a booked call.

---

## 1. Scope and dependencies

PRD 2 of 3 for the Aug-9 redesign.

| PRD | Status |
|---|---|
| [Visual refresh](2026-08-15_visual-refresh_PENDING.md) | Written. **Blocks this one.** |
| **This one** — ROI Calculator | Here |
| Portfolio rearchitecture | Not written |

**Hard dependency on PRD 1.** It inverts the surface palette (page `#f2f2f2`,
`--nalar-surface` white) and reserves the `#roi-calculator` anchor. This card is
white-on-gray under that model, so building it first means building it twice.

**PRD 1 §9 gates the Services chip.** The `Use Nalar ROI calculator →` link must
not ship until this section exists, or it is a dead link.

---

## 2. The numbers live in a spreadsheet, not in prose

**Decision.** Every rate, band, weight and rule lives in
`docs/roi-calculator-config.xlsx`. This PRD specifies *behaviour*; the workbook
holds *values*. Porting it produces one config module, and tuning a number later
is a cell edit plus a one-line change — never a logic change.

The workbook's `README` tab records provenance, which matters because the numbers
are not equally trustworthy:

| Input | Source | Trust |
|---|---|---|
| Rate tiers (Low $2,400 / Med $4,400 / High $6,400 per month) | Financial Plan 2026 → Baselines | Real |
| Consulting rate $35/hr | Financial Plan 2026 → Hourly Rate References | Real |
| Agency benchmark $11,666.67/mo | Financial Plan 2026 → Benchmark ($35k / 3 months) | Real |
| Hosting bands ($40–$900/mo) | **Estimate. No source.** | Weak |
| Maintenance hours (8/16/24 per month) | **Estimate. No source.** | Weak |
| Complexity weights | All 1.00 — deliberately neutral | Neutral |

**The two weak rows are the ones a technical prospect will challenge.** They must
be sanity-checked against a real AWS calculator before launch. Until then the
model is directionally right and precisely wrong.

**Rejected — hard-code the constants in the component.** Fastest to build, but
every tuning pass becomes a code change and the provenance disappears.

**Rejected — make the rates CMS-editable via Sveltia.** These change a few times
a year, not weekly, and exposing pricing logic to a CMS invites an accidental
commit that silently changes every quote on the site.

---

## 3. The model

Inputs, in the order the form asks for them:

| Input | Notes |
|---|---|
| Apps to build (multi-select) | Grouped Internal / External. Drives everything. |
| Employees | Internal user count |
| Already paying for software? | Yes/no. **Gates the entire ROI framing.** |
| Current SaaS spend ($/month) | Only asked when the above is yes |
| Expected users | **Only asked when an external app is ticked** |

Derivation:

```
totalApps   = Σ complexity weights of ticked apps        (internal + external)
scaleDriver = MAX(employees, externalApps > 0 ? users : 0)
tier        = band lookup on scaleDriver                 → Low | Medium | High
buildMonths = totalApps = 0 ? 0
              : baseMonths + MAX(0, totalApps − appsInBase) × monthsPerApp
buildCost   = tierMonthlyRate × buildMonths              [INTERNAL ONLY]
newMonthly  = hosting(scaleDriver) + maintenance(tier)
```

With every weight at 1.00 this reduces to the stated rule: **2 months for 1–2
apps, +1 month per app after.** Weights exist so a payroll build can be made
heavier than an internal chat without touching code.

`scaleDriver` ignores the external user count unless an external app is actually
ticked — otherwise a stale number in a hidden field silently inflates the tier.

**Rejected — separate internal and external calculations.** See §4.

---

## 4. Mixed selections: one project, one gate

**Decision.** Ticking both internal and external apps produces **one combined
project** — one timeline, one build. But the **ROI framing appears only when the
project is internal-only *and* replaces existing SaaS spend.**

The reason is not stylistic. Combining the paths lets an external product's user
count inflate hosting and maintenance, which then get charged against the internal
SaaS savings — even though a customer-facing web app has nothing to do with
replacing an HRIS. Measured in the workbook:

| Scenario | ROI |
|---|---|
| 2 internal tools, 40 employees, $1,800/mo SaaS | **+346%**, payback 8.1 months |
| Same, plus one web app at 5,000 users | **−89%**, payback 320 months |

Ticking one extra box destroys the case for a project that got *better*. Showing
that to a prospect is worse than showing nothing.

**Rejected — split the running cost by path** (internal hosting sized by
employees, external by users, savings compared only against the internal share).
This is the most *accurate* fix and remains the right answer if the fallback
proves too blunt. Rejected for now: it roughly doubles the config surface and the
formula count to rescue a case that Mode B already handles well.

**Rejected — two result blocks side by side.** Precise, but doubles the panel's
complexity and implies two engagements when it is one.

**Rejected — a toggle forcing internal or external.** Simplest, but a prospect
who wants both must run it twice and never sees a combined timeline.

---

## 5. The result panel has two modes

The mockup draws one enormous number. The model produces five outputs and two
different stories, so the panel resolves into one of two modes.

**Mode A — the ROI story.** Internal-only, replacing SaaS:

> ### Pays for itself in 8 months
> New monthly cost **$710** · You save **$1,090/mo** · **$30,440** over 3 years

**Mode B — the agency story.** Everything else:

> ### You'd pay 55% of agency rates
> Build time **3 months** · New monthly cost **$1,740**

Mode B is the fallback *and* a strong pitch on its own, which is what makes
gating Mode A cheap. `% of agency` works on every path, needs no invented revenue
assumptions, and comes from a real benchmark. It is also where the mockup's "50%"
came from: High tier against the agency rate is 54.9%.

**Whenever ROI % is shown, the horizon is shown beside it.** 346% over 36 months
is 49% over 12. An unlabelled percentage reads as invented.

**Resting state.** Before Calculate, the panel shows the agency comparison as a
teaser, never a blank box.

---

## 6. Public vs internal outputs

**Decision.** The calculator never renders a project cost or an hourly rate.
[PRD 1 §6](2026-08-15_visual-refresh_PENDING.md) already decided the public site
shows no rates; a calculator that derives `$12,800` from the same rates would
reverse that decision by the back door.

| Output | Public? |
|---|---|
| `% of agency`, build time, new monthly cost | **Yes** |
| Monthly saving, payback, net benefit, ROI % | **Yes**, in Mode A only |
| Build cost, agency equivalent | **No** — internal, for your own quoting |

The workbook marks every output `PUBLIC` or `INTERNAL` so the boundary survives
the port to code.

**Rejected — show everything behind an email gate.** The strongest lead-capture
option, and genuinely tempting. Rejected because it publishes the rate to anyone
with a throwaway address while adding friction *before* the payoff — the worst
trade on both axes.

**Rejected — show everything openly.** Maximum transparency and a real budget
filter, but it commits to a number before scoping and makes raising rates
visibly awkward.

---

## 7. Guards

Every one of these is reachable by a real visitor, and each must produce a
sentence rather than a number:

| Condition | Output |
|---|---|
| No apps ticked | Resting state; Calculate disabled |
| Not currently paying for software | Mode B — no savings to claim |
| Any external app ticked | Mode B |
| New monthly cost ≥ current spend | `"No payback"` — never a negative |
| Payback exceeds the horizon | `"Beyond 3 years"` — never `320 months` |
| Zero or non-numeric spend | Treated as no spend → Mode B |

**Currency is USD only in v1.** The mockup's `USD` control renders as a static
prefix, not a selector. Multi-currency needs live FX or stale hard-coded rates,
and every source number is already USD.

---

## 8. Design system

- **The Calculate button is black (`bg-ink`), not orange.** The system allows one
  primary action per view, and the Hero's orange `Book a call` shares this
  viewport. The calculator's job is to *produce* that booking, not compete with
  it. This is a deliberate deviation from the mockup, which draws it orange.
- The result CTA is `Book a call` → `CALENDLY_URL`.
- Card uses `bg-surface` (white under PRD 1), `rounded-card`, no shadow.
- **Real `<label>` on every field.** The mockup's `Input your numbers` is
  placeholder-as-label, which the guidelines forbid.
- Result region is `aria-live="polite"`; on mobile the panel stacks below the
  form, so Calculate must scroll it into view or the result is invisible.
- Inputs use `inputMode="numeric"` for the right mobile keyboard.

---

## 9. Testing

**The calculation is pure logic, so it is genuinely testable** — rare in this
repo, where component behaviour has no automated path at all.

- `src/app/data/roi.ts` — pure functions, no Vite APIs, no React.
- `src/app/data/roi.test.ts` — run with
  `node --test --experimental-strip-types src/app/data/roi.test.ts`.
- Cover every row of §7, plus the two §4 scenarios as regression cases: the
  −89% mixed-pick result must never reach a user again.

The form, the two-mode panel, and the mobile scroll behaviour have **no automated
coverage** and are verified manually. Do not claim otherwise.

---

## 10. Work order

Land PRD 1 first — this sits on its surface tokens and its anchor.

1. **Port the workbook** → `src/app/data/roi-config.ts` (tiers, bands, hosting,
   maintenance, catalog, timeline rule, horizon, benchmark).
2. **Pure model** → `src/app/data/roi.ts` + tests. Finish this before any UI.
3. **Form** — multi-select, then conditional fields (§3 order).
4. **Result panel** — resting state, Mode A, Mode B.
5. **Wire the anchor**, then un-gate the Services chip from PRD 1 §9.

Steps 1–2 are the whole feature's risk. Once the model is right and tested, the
UI is presentational.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| **Hosting and maintenance numbers are unsourced estimates.** A technical prospect challenges them and the credibility of the whole widget goes with it. | Validate against a real AWS calculator before launch. They are isolated in two tabs, so correcting them is a cell edit. |
| A confident wrong number is worse than no calculator. | Label output as an estimate; every figure resolves on the call. Guards in §7 prevent absurd values. |
| ROI % is highly horizon-sensitive (346% at 36mo, 49% at 12mo). | Never render the percentage without the horizon beside it. |
| Mode B is the fallback for several distinct conditions, so a visitor may expect a savings figure and not get one. | Mode B states *why* in a sentence ("you're not replacing existing software"), rather than silently omitting. |
| Real AWS cost tracks traffic and data, not seat count. | Documented in the Hosting tab. Seats are an admitted proxy; revisit above ~500 users. |
| The chip in PRD 1 becomes a dead link if ordering slips. | Gate it on this section existing (PRD 1 §9). |

---

## 12. Not covered

- **No component or interaction tests** — no jsdom/RTL/vitest in this repo. Only
  the pure model in §9 is automated.
- No lead capture, email gate, or analytics on calculator use. If measuring
  conversion later matters, that is its own change.
- No multi-currency (§7).
- No persistence — results are not shareable or resumable via URL.
- The `split running cost by path` model from §4, should the fallback prove blunt.
