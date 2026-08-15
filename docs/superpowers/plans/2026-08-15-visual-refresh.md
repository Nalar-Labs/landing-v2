# Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the landing page in line with the Aug-9 mockup — inverted surface palette, a shorter hero, one service trio instead of two groups, a new FAQ section, and a new footer.

**Architecture:** Token-first. Task 1 changes `theme.css` so every card surface flips from grey-on-white to white-on-grey without touching the cards themselves; everything after sits on top of that. The Services cut is the only task with real logic behind it — it reduces a two-group scroll choreography to a single group, which means pure-math changes in `src/app/lib/` that `node --test` covers. The FAQ and Footer are new, self-contained section components.

**Tech Stack:** Vite · React 18 · TypeScript · Tailwind v4 (CSS-first `@theme inline`) · shadcn/ui (Radix) · motion/react · Lenis smooth scroll.

**Source PRD:** [`docs/PRDs/2026-08-15_visual-refresh_PENDING.md`](../../PRDs/2026-08-15_visual-refresh_PENDING.md)

## Global Constraints

- **Never hard-code hex values, font names, or ad-hoc pixel spacing** in a component. Use the semantic utilities (`bg-brand`, `bg-surface`, `text-muted-ink`, `border-line`, `rounded-card`, `font-display`) and the `TYPE` / `SECTION` constants from `src/app/lib/layout.ts`.
- **One orange primary action per view.** `#ff5900` is reserved for the single primary CTA.
- **No drop shadows.** Depth comes from surface colour.
- **No `npm test` script.** Tests run per file: `node --test --experimental-strip-types <file>`.
- **No jsdom / RTL / vitest.** Component and interaction behaviour is verified **manually in the browser**. Never claim component coverage.
- **`src/app/data/` must contain no Vite APIs** — it has to run under `node --test`. `import.meta.glob` loaders belong in `*-items.ts`.
- **Lenis owns wheel events site-wide.** Any independently scrollable area needs `data-lenis-prevent`.
- **Do not touch the Portfolio section's design.** It moves in the running order (Task 4) and is otherwise unchanged. Its carousel, modal, video and gallery are shipped code.

## Baseline: 3 tests already fail on `main`

Before you start, run this and record the result:

```bash
node --test --experimental-strip-types src/app/lib/service-scroll-sequence.test.ts
```

Expected on a clean checkout: **`pass 7`, `fail 3`**. The three failures are all `getCardExpansion` tests:

- `getCardExpansion is 0 before a card's band starts`
- `getCardExpansion ramps up inside the band's first 60%`
- `getCardExpansion holds at 1 for the rest of the scroll (cards stay expanded)`

They assert the *generic* band model, but `getCardExpansion` takes a two-group branch when `count === 6`, so they have been failing since the two-group choreography landed. **This is pre-existing and not caused by this work.** Task 3 replaces the two-group model entirely and rewrites these tests, which resolves the failures as a side effect. Do not treat that as "fixing a bug" in a commit message.

Every other test file passes on `main`:

```bash
node --test --experimental-strip-types src/app/data/content.test.ts        # pass
node --test --experimental-strip-types src/app/lib/service-gradients.test.ts  # pass
```

## Prerequisite: land the working-tree edits

The PRD's service copy comes from the **working tree**, not `HEAD`. Before Task 1:

```bash
cd /Users/gardahadi/Workspace/Consulting/Nalar/nalar-v2
git status --short
```

If `src/app/data/content.ts`, `src/app/components/ServiceCard.tsx`, `.gitignore`, or `src/content/portfolio/internal-ops-dashboard.json` show as modified, commit them first. Building against `HEAD` uses the wrong copy.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/styles/theme.css` | Page + surface tokens, accent-wash tokens | 1 |
| `src/app/lib/theme-tokens.test.ts` | **Create.** Guards the no-hard-coded-hex rule | 1 |
| `src/app/App.tsx` | Page background, section order, FAQ + Footer wiring | 1, 4, 5, 6 |
| `src/app/sections/Navbar.tsx` | Menu overlay background | 1 |
| `src/app/components/{ServiceCard,PortfolioCard,PortfolioModal,VideoFacade}.tsx` | Consume wash tokens instead of raw hex | 1 |
| `src/app/data/content.ts` | `HERO`, `SERVICES`, `FAQ_ITEMS`, `FOOTER`, `PLACEHOLDER_URL` | 2, 3, 5, 6 |
| `src/app/data/content.test.ts` | Structural guards on content shape | 2, 3, 5 |
| `src/app/sections/Hero.tsx` | H1 + demoted cycling sub-line | 2 |
| `src/app/lib/service-scroll-sequence.ts` | Single-group card choreography | 3 |
| `src/app/lib/service-gradients.ts` | One gradient per card (3, not 6) | 3 |
| `src/app/sections/Services.tsx` | One trio, no group headings | 3 |
| `src/app/sections/FAQ.tsx` | **Create.** Accordion + Book a call | 5 |
| `src/app/sections/Footer.tsx` | **Create.** Dark footer | 6 |

---

### Task 1: Invert the surface palette and tokenize the accent wash

**Files:**
- Modify: `src/styles/theme.css` (`:root` block ~line 50, `@theme inline` block ~line 143)
- Create: `src/app/lib/theme-tokens.test.ts`
- Modify: `src/app/App.tsx:17`
- Modify: `src/app/sections/Navbar.tsx:57`
- Modify: `src/app/components/ServiceCard.tsx:74`
- Modify: `src/app/components/PortfolioCard.tsx:125`
- Modify: `src/app/components/PortfolioModal.tsx:78`
- Modify: `src/app/components/VideoFacade.tsx:69`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind utilities `bg-page`, `from-wash-from`, `to-wash-to`. CSS variables `--nalar-page`, `--nalar-wash-from`, `--nalar-wash-to`. Every later task assumes the page is `bg-page` and cards are white.

- [ ] **Step 1: Write the failing guard test**

Create `src/app/lib/theme-tokens.test.ts`:

```ts
// src/app/lib/theme-tokens.test.ts
// CLAUDE.md forbids hard-coded hex in components. The accent wash violated
// that in four files; this locks the rule in so it cannot regress.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = fileURLToPath(new URL("..", import.meta.url));

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // components/ui is vendored shadcn — kept as-is per CLAUDE.md.
      if (entry === "ui") continue;
      out.push(...tsxFiles(full));
    } else if (entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

test("no component hard-codes the legacy accent-wash hex", () => {
  const offenders: string[] = [];
  for (const file of tsxFiles(APP_DIR)) {
    if (/#3c3c3c33|#ffffff33/i.test(readFileSync(file, "utf8"))) {
      offenders.push(file.slice(APP_DIR.length));
    }
  }
  assert.deepEqual(offenders, []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test --experimental-strip-types src/app/lib/theme-tokens.test.ts`

Expected: **FAIL**, listing four offenders — `components/ServiceCard.tsx`, `components/PortfolioCard.tsx`, `components/PortfolioModal.tsx`, `components/VideoFacade.tsx`.

- [ ] **Step 3: Add the tokens to `theme.css`**

In the `:root` block, replace the `--nalar-surface` line and add the new tokens:

```css
  --nalar-page: #f2f2f2;         /* page background */
  --nalar-surface: #ffffff;      /* card / panel surface (was #f8f8f8) */
  --nalar-muted-ink: #9a9a9a;    /* secondary text on light */
  --nalar-line: #d9d9d9;         /* hairline / timeline stroke */

  /* Accent wash for gradient cards. Re-derived for a WHITE surface: the old
     #ffffff33 stop was invisible once the surface beneath it turned white,
     so this fades grey out to fully transparent instead. */
  --nalar-wash-from: rgba(60, 60, 60, 0.16);
  --nalar-wash-to: rgba(60, 60, 60, 0);
```

In the `@theme inline` block, add alongside `--color-surface`:

```css
  --color-page: var(--nalar-page);
  --color-wash-from: var(--nalar-wash-from);
  --color-wash-to: var(--nalar-wash-to);
```

- [ ] **Step 4: Swap the four hard-coded gradients**

`src/app/components/ServiceCard.tsx:74` — replace:

```tsx
            ? "bg-surface bg-gradient-to-r from-[#3c3c3c33] to-[#ffffff33]"
```

with:

```tsx
            ? "bg-surface bg-gradient-to-r from-wash-from to-wash-to"
```

`src/app/components/PortfolioCard.tsx:125` — replace:

```tsx
          className="aspect-[16/10] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
```

with:

```tsx
          className="aspect-[16/10] w-full bg-gradient-to-br from-wash-from to-wash-to"
```

`src/app/components/PortfolioModal.tsx:78` — replace:

```tsx
                className="aspect-[21/9] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
```

with:

```tsx
                className="aspect-[21/9] w-full bg-gradient-to-br from-wash-from to-wash-to"
```

`src/app/components/VideoFacade.tsx:69` — replace:

```tsx
              className="absolute inset-0 bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
```

with:

```tsx
              className="absolute inset-0 bg-gradient-to-br from-wash-from to-wash-to"
```

- [ ] **Step 5: Run the guard test to verify it passes**

Run: `node --test --experimental-strip-types src/app/lib/theme-tokens.test.ts`

Expected: **PASS**, `pass 1 / fail 0`.

- [ ] **Step 6: Point the page background at the new token**

`src/app/App.tsx:17` — replace `bg-white` with `bg-page`:

```tsx
        <div className="min-h-screen overflow-x-clip bg-page font-display text-black selection:bg-brand selection:text-white">
```

`src/app/sections/Navbar.tsx:57` — the full-screen menu overlay, replace `bg-white` with `bg-page`:

```tsx
            className="fixed inset-0 z-40 flex flex-col justify-center bg-page px-6 md:px-12"
```

**Do NOT change** `Navbar.tsx:18` (the logo circle, `bg-white`) or `Hero.tsx:91` (the CTA pills, `bg-white`). Those are deliberately white *on* the page and gain contrast from this inversion.

- [ ] **Step 7: Verify visually — this is the step that matters**

There is no automated coverage for any of this. Run the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` and confirm at **375px, 768px and 1440px**:

1. Page background is light grey; service cards, portfolio cards and the portfolio modal are **white** and clearly separated from it.
2. The gradient accent card still shows a visible grey wash — not a flat white rectangle. If it looks flat, raise the `0.16` alpha in `--nalar-wash-from`.
3. Navbar logo circle and hero CTA pills are still **white**, now with more contrast.
4. Opening the hamburger menu shows a light-grey overlay, not white.
5. Nothing else changed colour unexpectedly.

- [ ] **Step 8: Commit**

```bash
git add src/styles/theme.css src/app/lib/theme-tokens.test.ts src/app/App.tsx \
        src/app/sections/Navbar.tsx src/app/components/ServiceCard.tsx \
        src/app/components/PortfolioCard.tsx src/app/components/PortfolioModal.tsx \
        src/app/components/VideoFacade.tsx
git commit -m "feat(theme): invert surfaces to a grey page with white cards

Adds --nalar-page and repoints --nalar-surface to white, so every card
inherits the new surface without being touched.

Also tokenizes the accent wash, which was hard-coded in four components
against CLAUDE.md's rule. Its #ffffff33 stop was invisible once the
surface beneath it turned white, so the gradient is re-derived as grey
fading to transparent rather than ported verbatim. A guard test locks
the rule in."
```

---

### Task 2: Promote the hero headline, demote the cycling line

**Files:**
- Modify: `src/app/data/content.ts` (the `HERO` const, ~line 47)
- Modify: `src/app/data/content.test.ts`
- Modify: `src/app/sections/Hero.tsx:39-70`

**Interfaces:**
- Consumes: `bg-page` from Task 1.
- Produces: `HERO.headline: string`. `HERO.lines` and `HERO.links` keep their existing shapes (`readonly HeroLine[]`, `readonly { label: string; href: string }[]`).

- [ ] **Step 1: Write the failing test**

In `src/app/data/content.test.ts`, add after the existing hero tests:

```ts
test("hero has a non-empty headline (the promoted h1)", () => {
  assert.ok(HERO.headline.trim().length > 0);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test --experimental-strip-types src/app/data/content.test.ts`

Expected: **FAIL** — TypeScript error or `Cannot read properties of undefined`, because `HERO.headline` does not exist yet.

- [ ] **Step 3: Add the headline to content**

In `src/app/data/content.ts`, add `headline` as the first key of `HERO` and extend the `satisfies` clause:

```ts
export const HERO = {
  headline: "Want to win with AI?",
  lines: [
    {
      static: "You don't need more",
      cycling: ["SaaS", "Tokens", "Tools", "Developers", "Consultants", "Designers"],
    },

    { static: "You just need partners who have built great products." },
  ],
  links: [
    { label: "Book a call", href: CALENDLY_URL },
    { label: "Refer a friend", href: "#refer" },
  ],
} as const satisfies {
  headline: string;
  lines: readonly HeroLine[];
  links: readonly { label: string; href: string }[];
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/content.test.ts`

Expected: **PASS**, all tests green.

- [ ] **Step 5: Restructure the hero markup**

In `src/app/sections/Hero.tsx`, replace the block from the opening `<motion.p>` (line 39) through the closing `</h1>` (line 70) with:

```tsx
        <div className="w-full max-w-[1400px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(TYPE.hero, "mx-auto mb-6 max-w-[1345px] md:mb-8")}
          >
            {HERO.headline}
          </motion.h1>

          <p className="mx-auto mb-10 max-w-[900px] font-display text-[20px] font-light leading-snug tracking-[-0.72px] text-ink-soft md:mb-12 md:text-[32px]">
            {HERO.lines.map((line, lineIndex) => (
              <motion.span
                key={line.static}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 + lineIndex * 0.15 }}
                className="block"
              >
                {line.static}
                {line.cycling && (
                  <>
                    {" "}
                    <CyclingWord
                      words={line.cycling}
                      offsetMs={lineIndex * CYCLE_OFFSET_MS}
                      className="border-b-2 border-ink md:border-b-[3px]"
                    />
                  </>
                )}
              </motion.span>
            ))}
          </p>
```

Note the opening `<div className="w-full max-w-[1400px] text-center">` already exists at line 48 — you are moving the `<motion.p>` eyebrow *into* it as the `<h1>`, and turning the old `<h1>` into the sub-line `<p>`. Delete the now-orphaned original `<motion.p>` and `<h1>` blocks. The CTA-pill `<motion.div>` that follows is unchanged.

- [ ] **Step 6: Verify visually**

```bash
npm run dev
```

At 375px, 768px and 1440px confirm:

1. `Want to win with AI?` is the largest text on the page and reads as the headline.
2. Beneath it, `You don't need more [SaaS…]` still cycles through its six words, at clearly smaller type.
3. The underline under the cycling word is present but proportionate to the smaller text.
4. The hero is **visibly shorter than before** — that is the whole point, since the ROI Calculator lands beneath it.
5. The `Book a call` / `Refer a friend` pills are unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/app/data/content.ts src/app/data/content.test.ts src/app/sections/Hero.tsx
git commit -m "feat(hero): promote 'Want to win with AI?' to the h1

The cycling headline survives as a sub-line rather than being retired --
it is the only motion in the hero and the sharpest copy on the page.
Net effect is a shorter hero, which is what puts the ROI calculator
near the fold."
```

---

### Task 3: Cut Services from two groups to one trio

The only task with real logic behind it. The pure-math change, the content
change and the component change **must land together** — deleting the group
crossfade helpers while `Services.tsx` still imports them would break the build,
and changing `SERVICE_CARD_COUNT` while `content.ts` still holds six services
would fail `content.test.ts`. Treat this as one atomic task.

**Files:**
- Modify: `src/app/lib/service-scroll-sequence.ts`
- Modify: `src/app/lib/service-scroll-sequence.test.ts`
- Modify: `src/app/lib/service-gradients.ts`
- Modify: `src/app/data/content.ts` (`SERVICE_GROUPS` → `SERVICES`, ~line 56)
- Modify: `src/app/data/content.test.ts`
- Modify: `src/app/sections/Services.tsx` (whole file)

**Interfaces:**
- Consumes: `bg-page` / `bg-surface` from Task 1. `Service` type from `content.ts` (`{ title: string; hook?: string; description: string; gradient?: boolean }`).
- Produces: `SERVICE_CARD_COUNT = 3`. `SERVICES: Service[]` replacing `SERVICE_GROUPS`; the `ServiceGroup` type is deleted. `getCardExpansion(progress: number, index: number, count?: number): number` keeps its signature. `getCardIntensity` is **unchanged — `ApproachItem.tsx` depends on it.** `getServiceHeadingOpacity` and `getServiceCardsOpacity` are deleted.

**Note on copy:** PRD §4 says the `Key Services` H2 stays, but the live H2 is
`We help you`. **Keep `We help you`** — the PRD text predates a July copy change.

- [ ] **Step 1: Rewrite the scroll-sequence tests for the 3-card model**

In `src/app/lib/service-scroll-sequence.test.ts`, replace the `SERVICE_CARD_COUNT`
test and the three `getCardExpansion` tests with:

```ts
test("SERVICE_CARD_COUNT is 3 (one trio of service cards)", () => {
  assert.equal(SERVICE_CARD_COUNT, 3);
});

test("getCardExpansion is 0 before a card's window starts", () => {
  // card 1's window is [0.3, 0.6]
  assert.equal(getCardExpansion(0.29, 1), 0);
});

test("getCardExpansion ramps linearly across a card's window", () => {
  // card 0's window is [0, 0.3]; halfway through is 0.5
  assert.equal(getCardExpansion(0.15, 0), 0.5);
});

test("getCardExpansion holds at 1 after its window (cards stay expanded)", () => {
  assert.equal(getCardExpansion(0.95, 0), 1);
  assert.equal(getCardExpansion(1, 2), 1);
});

test("every card is fully expanded by the end of the scroll", () => {
  for (let i = 0; i < SERVICE_CARD_COUNT; i += 1) {
    assert.equal(getCardExpansion(1, i), 1);
  }
});
```

Leave every `getCardIntensity` test exactly as it is — that function is unchanged
and the Approach timeline also uses it. Delete any test referencing
`getServiceHeadingOpacity` or `getServiceCardsOpacity` if present.

- [ ] **Step 2: Run the tests to confirm they fail for the right reason**

Run: `node --test --experimental-strip-types src/app/lib/service-scroll-sequence.test.ts`

Expected: **FAIL** — `SERVICE_CARD_COUNT` is still `6`, so the count test fails and
the expansion tests still exercise the two-group windows.

- [ ] **Step 3: Simplify the sequence module**

Replace the top of `src/app/lib/service-scroll-sequence.ts` — from the
`SERVICE_CARD_COUNT` export down to and including `SECOND_GROUP_CARD_WINDOWS` — with:

```ts
/** One trio of service cards. */
export const SERVICE_CARD_COUNT = 3;

/**
 * Each card owns an equal slice of the pinned scroll and opens across it.
 * The final 10% is deliberately left over so all three sit fully expanded
 * before the section releases.
 */
const CARD_WINDOWS = [
  [0, 0.3],
  [0.3, 0.6],
  [0.6, 0.9],
] as const;
```

Replace the whole `getCardExpansion` function body with:

```ts
export function getCardExpansion(
  progress: number,
  index: number,
  count: number = SERVICE_CARD_COUNT,
): number {
  if (count !== SERVICE_CARD_COUNT) {
    const band = 1 / count;
    const start = index * band;
    const rampEnd = start + band * 0.6;

    if (progress <= start) return 0;
    if (progress >= rampEnd) return 1;
    return (progress - start) / (rampEnd - start);
  }

  const [start, end] = CARD_WINDOWS[index];
  return inverseLerp(start, end, progress);
}
```

Delete `getServiceHeadingOpacity` and `getServiceCardsOpacity` entirely, along with
the now-unused `FIRST_GROUP_END`, `FIRST_GROUP_FADE_END`,
`SECOND_SUBTITLE_FADE_START`, `SECOND_SUBTITLE_FADE_END` and
`SECOND_GROUP_TEXT_FADE_END` constants. Keep `clamp01`, `inverseLerp` and
`getCardIntensity`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test --experimental-strip-types src/app/lib/service-scroll-sequence.test.ts`

Expected: **PASS**, `fail 0`. The three pre-existing failures are gone because their
subject no longer exists.

- [ ] **Step 5: Cut the gradients from six to three**

Replace the array in `src/app/lib/service-gradients.ts`:

```ts
export const SERVICE_CARD_GRADIENTS = [
  // 0 — Replace SaaS with Open Source
  "linear-gradient(135deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
  // 1 — Replace Vendors with Agents
  "linear-gradient(135deg, var(--nalar-surface) 0%, var(--nalar-line) 100%)",
  // 2 — Cost Free Maintenance & Instant Handoff
  "linear-gradient(135deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
] as const;
```

Update its doc comment's first line to
`/** One gradient per Services card, in the order Services.tsx renders them. */` —
the existing text describes two groups.

- [ ] **Step 6: Run the gradient tests**

Run: `node --test --experimental-strip-types src/app/lib/service-gradients.test.ts`

Expected: **PASS** — "exactly one gradient per card" now compares 3 against 3.

- [ ] **Step 7: Update the content structural tests**

In `src/app/data/content.test.ts`, change the import and replace the count test:

```ts
import { HERO, SERVICES, APPROACH_STEPS } from "./content.ts";
```

```ts
test("SERVICE_CARD_COUNT matches the actual number of services in content", () => {
  assert.equal(SERVICES.length, SERVICE_CARD_COUNT);
});

test("every service has a title and a description", () => {
  for (const service of SERVICES) {
    assert.ok(service.title.trim().length > 0);
    assert.ok(service.description.trim().length > 0);
  }
});
```

- [ ] **Step 8: Run it to make sure it fails**

Run: `node --test --experimental-strip-types src/app/data/content.test.ts`

Expected: **FAIL** — `SERVICES` is not exported yet.

- [ ] **Step 9: Replace the two groups with one flat trio**

In `src/app/data/content.ts`, delete the `ServiceGroup` type and replace the whole
`SERVICE_GROUPS` export with:

```ts
/**
 * One trio, mixed from the two former groups. Cut from six per the Aug-9
 * redesign: the group sub-headings had nothing left to distinguish once a
 * single group remained.
 */
export const SERVICES: Service[] = [
  {
    title: "Replace SaaS with Open Source",
    description:
      "Quit paying for software you don't control, we can help build your own bespoke software using open source tools that are free to use and modify.",
  },
  {
    title: "Replace Vendors with Agents",
    description:
      "Instead of hiring expensive vendors, we help you build custom AI agents that work for you 24/7 for almost any task such as design, finance, and yes even software development.",
  },
  {
    title: "Cost Free Maintenance & Instant Handoff",
    description:
      "We document what was built, train your team, and hand over open tools you own outright — so you are never locked into a stack we control.",
    gradient: true,
  },
];
```

- [ ] **Step 10: Run the content test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/content.test.ts`

Expected: **PASS**.

- [ ] **Step 11: Rewrite `Services.tsx` for a single group**

Replace the whole file with:

```tsx
import { useRef } from "react";
import { useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICES } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { SERVICE_CARD_COUNT } from "../lib/service-scroll-sequence";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";
import { useMediaQuery } from "../lib/use-media-query";

export function Services() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // Remount on breakpoint change so useScroll re-registers with the right
  // offsets — motion doesn't retarget an existing scroll tracker.
  return <ServicesInner key={isDesktop ? "pinned" : "flowing"} isDesktop={isDesktop} />;
}

function ServicesInner({ isDesktop }: { isDesktop: boolean }) {
  const trackRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Desktop pins the section: the tall track scrolls beneath a sticky,
  // viewport-height panel while progress opens the three cards in turn,
  // then releases the page. Mobile (and reduced motion) keeps normal flow.
  const pin = isDesktop && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: pin ? ["start start", "end end"] : ["start end", "end start"],
  });

  return (
    <section
      id="services"
      ref={trackRef}
      className={cn(CONTAINER, pin ? "h-[260vh]" : SECTION.wrap)}
    >
      {/* pt-60 clears the fixed navbar while pinned */}
      <div className={pin ? "sticky top-0 flex h-screen flex-col pt-60" : undefined}>
        <h2
          className={
            pin
              ? "font-display text-[64px] font-light leading-[1.05] tracking-[-1.92px] mb-12"
              : cn(TYPE.h2, SECTION.titleGap)
          }
        >
          We help you
        </h2>

        <div className="grid grid-cols-1 gap-6 auto-rows-fr md:grid-cols-3">
          {SERVICES.map((service, index) => (
            <ServiceCard
              key={service.title}
              {...service}
              index={index}
              cardCount={SERVICE_CARD_COUNT}
              scrollYProgress={scrollYProgress}
              reducedMotion={reducedMotion}
              compact={pin}
              scrollDriven={pin}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

The pin height drops from `520vh` to `260vh` because there is half as much
choreography to play out. Tune it visually in the next step.

- [ ] **Step 12: Confirm the build compiles**

Run: `npm run build`

Expected: no TypeScript errors. A leftover `SERVICE_GROUPS` or
`getServiceHeadingOpacity` import surfaces here.

- [ ] **Step 13: Verify visually**

```bash
npm run dev
```

1. **Desktop (1440px):** scroll into Services. The section pins, the three cards
   open one after another, all three end up open, then the page releases. If the
   cards are all open long before release, reduce `260vh`; if the last card is
   still opening at release, raise it.
2. **Mobile (375px):** the section is *not* pinned — all three cards render
   expanded and static, in a single column.
3. **Reduced motion:** enable it (macOS: System Settings → Accessibility →
   Display → Reduce motion) and reload. The section should not pin.
4. The third card shows the grey gradient wash; the other two are plain white.
5. No group sub-headings appear anywhere.

- [ ] **Step 14: Commit**

```bash
git add src/app/lib/service-scroll-sequence.ts src/app/lib/service-scroll-sequence.test.ts \
        src/app/lib/service-gradients.ts src/app/data/content.ts \
        src/app/data/content.test.ts src/app/sections/Services.tsx
git commit -m "feat(services): cut to one trio of cards

SERVICE_GROUPS becomes a flat SERVICES array, SERVICE_CARD_COUNT drops
to 3, and the two-group choreography -- group windows, heading and card
crossfades -- is deleted with its now-dead constants. Pin height halves
to 260vh.

Keeps Replace SaaS with Open Source, Replace Vendors with Agents, and
Cost Free Maintenance & Instant Handoff -- the last chosen over High
Speed Development because no-lock-in handoff is a claim competitors
structurally cannot make.

Rewrites the three getCardExpansion tests that were already failing on
main: they asserted the generic band model while the function branched
into the two-group path. Their subject is gone, so they are replaced
rather than repaired. getCardIntensity is untouched -- ApproachItem
depends on it.

Logic, content and component land together on purpose: separating them
would leave the build broken or content.test.ts failing in between."
```

---

### Task 4: Move Portfolio above Approach

**Files:**
- Modify: `src/app/App.tsx:20-26`

**Interfaces:**
- Consumes: nothing. Produces: nothing. Pure ordering change.

- [ ] **Step 1: Reorder the sections and mark the calculator slot**

In `src/app/App.tsx`, replace the `<main>` block with:

```tsx
          <main>
            <Hero />
            {/* PRD 2 — the ROI Calculator mounts here, between Hero and
                Services. Its `#roi-calculator` anchor and the Services chip
                that links to it ship together with the calculator itself,
                never before: an anchor to nothing is a dead link. */}
            <Services />
            <Portfolio />
            <Approach />
            <CTA />
          </main>
```

Portfolio now sits above Approach — proof before process. The Portfolio section itself is **not modified**.

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Scroll the whole page and confirm the order is Hero → Services → Portfolio → Approach → CTA, and that the portfolio carousel, its modal, video playback and image gallery all still work exactly as before.

- [ ] **Step 3: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat(page): move Portfolio above Approach

Proof before process. Marks where PRD 2's ROI calculator mounts; the
anchor and its Services chip ship with the calculator, not before."
```

---

### Task 5: Add the FAQ section

**Files:**
- Modify: `src/app/data/content.ts` (append `FAQ_ITEMS`)
- Modify: `src/app/data/content.test.ts`
- Create: `src/app/sections/FAQ.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `CALENDLY_URL` from `content.ts`. `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` from `../components/ui/accordion`.
- Produces: `FAQ_ITEMS: FaqItem[]` where `FaqItem = { question: string; answer: string }`. The `FAQ` component, mounted between `Approach` and `CTA`, owning `id="faq"`.

This also fixes a live bug: `NAV_LINKS` has `{ label: "FAQ", href: "#faq" }` pointing at a section that does not exist.

- [ ] **Step 1: Write the failing test**

In `src/app/data/content.test.ts`, add the import and tests:

```ts
import { HERO, SERVICES, APPROACH_STEPS, FAQ_ITEMS, NAV_LINKS } from "./content.ts";
```

```ts
test("there are six FAQ items, each with a question and an answer", () => {
  assert.equal(FAQ_ITEMS.length, 6);
  for (const item of FAQ_ITEMS) {
    assert.ok(item.question.trim().length > 0);
    assert.ok(item.answer.trim().length > 0);
  }
});

test("no FAQ answer quotes an hourly rate", () => {
  // Public-site decision: pricing describes the process, never a number.
  for (const item of FAQ_ITEMS) {
    assert.doesNotMatch(item.answer, /\$\s?\d/);
    assert.doesNotMatch(item.answer, /per hour|\/hour|hourly rate/i);
  }
});

test("every in-page nav link points at a section that exists", () => {
  // #faq was dead until the FAQ section landed.
  const inPage = NAV_LINKS.filter((l) => l.href.startsWith("#")).map((l) => l.href);
  assert.ok(inPage.includes("#faq"));
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test --experimental-strip-types src/app/data/content.test.ts`

Expected: **FAIL** — `FAQ_ITEMS` is not exported yet.

- [ ] **Step 3: Add the FAQ content**

Append to `src/app/data/content.ts`:

```ts
export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Ordered by what earns trust fastest. No-lock-in sits second, ahead of
 * pricing, because it reframes everything below it. The last question names
 * who is *not* a fit, to filter bad-fit leads before they reach the calendar.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How are you different from a dev shop or agency?",
    answer:
      "You work directly with the people building your software — there is no account manager between you and the engineers. We default to open-source tools you own outright, so nothing we build depends on a licence we control.",
  },
  {
    question: "What happens when the project ends — are we stuck with you?",
    answer:
      "No. Every engagement ends with a structured handoff: we document what was built, run hands-on sessions with your team, and hand over versioned code and written guides. We use open tools wherever possible, so you are never dependent on a proprietary stack we control. An ongoing retainer is available if you want one — not because you will need it.",
  },
  {
    question: "How does pricing work?",
    answer:
      "It starts with a free 30-minute call to understand the problem. If there is a fit, we come back with a recommended approach and a rough scope, then run a detailed planning session that produces a fixed, written proposal. You know the number before any build work begins.",
  },
  {
    question: "Do we need an in-house engineer or IT team?",
    answer:
      "No. Most of the teams we work with do not have one — that is usually why they call us. We handle architecture, build, deployment and maintenance, and we train whoever on your team will own the tool day to day.",
  },
  {
    question: "Can AI run privately on our own data?",
    answer:
      "Yes. Models can run on infrastructure you control, so sensitive data never leaves your environment. Where a hosted model is the better fit, we are explicit about what gets sent, what is retained, and how to turn that off.",
  },
  {
    question: "What kind of companies do you work with?",
    answer:
      "Teams of roughly 10 to 60 people where technology is a means rather than the product — operations, services, manufacturing, education. We are a poor fit if you are a tech company building your own engineering org, or if you already have an in-house team that just needs extra hands.",
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/app/data/content.test.ts`

Expected: **PASS**.

- [ ] **Step 5: Create the FAQ section**

Create `src/app/sections/FAQ.tsx`:

```tsx
import { ArrowRight } from "lucide-react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { CALENDLY_URL, FAQ_ITEMS } from "../data/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export function FAQ() {
  return (
    <section id="faq" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Questions? We have answers</h2>

      {/* Collapsible, all closed by default. Not an independently scrollable
          region, so it needs no data-lenis-prevent. */}
      <Accordion type="single" collapsible className="mx-auto w-full max-w-[900px]">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question} className="border-line">
            <AccordionTrigger className="text-left font-display text-[20px] font-medium leading-snug tracking-[-0.6px] md:text-[28px] md:tracking-[-0.84px]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent
              className={cn(TYPE.body, "text-ink-soft md:text-[20px] md:leading-relaxed")}
            >
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 flex justify-center md:mt-16">
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-3 rounded-full border border-black/45 bg-surface px-8 py-4 font-body text-xl transition-colors hover:border-black md:text-[24px]"
        >
          <span>Book a call</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:scale-105">
            <ArrowRight className="size-4" />
          </span>
        </a>
      </div>
    </section>
  );
}
```

The button is deliberately **not** orange: the CTA section directly below owns the single orange action for this part of the page.

- [ ] **Step 6: Mount it between Approach and CTA**

In `src/app/App.tsx`, add the import and the element:

```tsx
import { FAQ } from "./sections/FAQ";
```

```tsx
            <Approach />
            <FAQ />
            <CTA />
```

- [ ] **Step 7: Verify visually**

```bash
npm run dev
```

1. All six questions render **collapsed**. Clicking one opens it; clicking another closes the first (`type="single"`).
2. The FAQ sits between Approach and the CTA panel.
3. Open the hamburger menu and click **FAQ** — the page scrolls to this section instead of doing nothing. That link was dead before.
4. Keyboard: `Tab` reaches each trigger and `Enter`/`Space` toggles it; the focus ring is visible.
5. Scrolling over an open answer scrolls the **page** normally — Lenis is not blocked.
6. `Book a call` opens Calendly in a new tab, and is not orange.

- [ ] **Step 8: Commit**

```bash
git add src/app/data/content.ts src/app/data/content.test.ts \
        src/app/sections/FAQ.tsx src/app/App.tsx
git commit -m "feat(faq): add the FAQ section above the CTA

Six questions in a collapsed accordion with its own Book a call button,
following tenex.co's FAQ-then-CTA order rather than replacing the CTA.

Fixes a dead nav link: NAV_LINKS has pointed at #faq since launch with
no such section on the page. A test now guards both that and the
decision to keep hourly rates off the public site."
```

---

### Task 6: Add the footer

**Files:**
- Modify: `src/app/data/content.ts` (append `PLACEHOLDER_URL`, `FOOTER`)
- Create: `src/app/sections/Footer.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `CALENDLY_URL`. The light logo at `src/imports/logo/FA_Nalar Logo_light.svg`.
- Produces: `PLACEHOLDER_URL: string`, `FOOTER: { links: readonly { label: string; href: string }[]; blurb: string }`. The `Footer` component, mounted **outside** `<main>`, after it.

- [ ] **Step 1: Add the footer content**

Append to `src/app/data/content.ts`:

```ts
/**
 * Temporary destination for social links that have no page yet. Both
 * LinkedIn and Twitter point here so swapping them later is a one-line
 * change. These are knowingly dead links until then.
 */
export const PLACEHOLDER_URL = "#";

export const FOOTER = {
  links: [
    { label: "Contact", href: CALENDLY_URL },
    { label: "LinkedIn", href: PLACEHOLDER_URL },
    { label: "Twitter", href: PLACEHOLDER_URL },
  ],
  blurb:
    'Nalar is a collective design engineering lab run by people from Indonesia across the world, where Nalar means "makes sense".',
} as const;
```

- [ ] **Step 2: Create the footer section**

Create `src/app/sections/Footer.tsx`:

```tsx
import { cn, CONTAINER } from "../lib/layout";
import { FOOTER } from "../data/content";
import lightLogo from "../../imports/logo/FA_Nalar Logo_light.svg";

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className={cn(CONTAINER, "py-16 md:py-24")}>
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center md:h-12 md:w-12"
            aria-hidden="true"
          >
            <img src={lightLogo} alt="" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-3xl font-light tracking-[-1.2px] md:text-[40px]">
            Nalar
          </span>
        </div>

        <div className="mt-10 flex flex-col gap-10 md:mt-16 md:flex-row md:justify-between">
          <ul className="flex flex-col gap-3 font-body text-base md:text-lg">
            {FOOTER.links.map((link) => {
              const isExternal = link.href.startsWith("http");
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="max-w-[420px] font-display text-lg font-light leading-snug tracking-[-0.54px] text-white/70 md:text-[20px]">
            {FOOTER.blurb}
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Mount it after `</main>`**

In `src/app/App.tsx`, add the import and place the element **outside** `<main>`, since a footer is not main content:

```tsx
import { Footer } from "./sections/Footer";
```

```tsx
          </main>
          <Footer />
        </div>
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

At 375px and 1440px confirm:

1. The footer is dark, sits at the very bottom, and spans the full page width — the grey page background does not show beside it.
2. The light logo is legible on the dark surface (the dark-variant logo would disappear).
3. Links stack on mobile and sit beside the blurb on desktop.
4. `Contact` opens Calendly in a new tab. `LinkedIn` and `Twitter` do nothing — expected, they are placeholders.
5. The blurb reads "run by", not "ran by".

- [ ] **Step 5: Commit**

```bash
git add src/app/data/content.ts src/app/sections/Footer.tsx src/app/App.tsx
git commit -m "feat(footer): add the dark footer

Contact points at Calendly; LinkedIn and Twitter share one
PLACEHOLDER_URL constant so swapping them later is a one-line change.
Both are knowingly dead links until those pages exist.

Mounted outside <main> -- a footer is not main content."
```

---

## Final verification

- [ ] **Run every test file**

```bash
for f in src/app/data/content.test.ts \
         src/app/data/portfolio.test.ts \
         src/app/data/portfolio-content.test.ts \
         src/app/lib/service-scroll-sequence.test.ts \
         src/app/lib/service-gradients.test.ts \
         src/app/lib/video-source.test.ts \
         src/app/lib/theme-tokens.test.ts; do
  printf '%-52s' "$f"
  node --test --experimental-strip-types "$f" >/dev/null 2>&1 && echo PASS || echo FAIL
done
```

Expected: **every line PASS**, including `service-scroll-sequence.test.ts`, which failed on the starting commit.

- [ ] **Production build succeeds**

```bash
npm run build
```

Expected: completes with no TypeScript errors. A stale `SERVICE_GROUPS` or `getServiceHeadingOpacity` import will surface here.

- [ ] **Full-page manual pass at 375 / 768 / 1440**

Order is Hero → Services → Portfolio → Approach → FAQ → CTA → Footer. Grey page, white cards throughout. The hamburger menu's five links all reach a real section. No horizontal scroll at 375px.

- [ ] **Update the PRD status**

```bash
git mv docs/PRDs/2026-08-15_visual-refresh_PENDING.md \
       docs/PRDs/$(date +%Y-%m-%d)_visual-refresh_DEVELOPED.md
```

Then edit the `Status:` line inside the file to match — `DEVELOPED` means built and merged but not yet live. Commit the rename.

## Handoff notes

Three things the PRD says that the code contradicts. None block the work; all were verified against the working tree:

1. **PRD §4 says the `Key Services` H2 stays.** The live H2 is `We help you`. Task 3 keeps `We help you`; the PRD text predates a July copy change.
2. **PRD §10 says "no automated tests — every change here is presentational."** That is wrong for Services: `content.test.ts`, `service-gradients.test.ts` and `service-scroll-sequence.test.ts` all assert against the card count, and Task 3 is genuine TDD. It is correct for Tasks 1, 2, 4, 5 and 6.
3. **PRD §1 says to reserve an `#roi-calculator` anchor.** Task 4 leaves a comment marker instead of a real anchor. An anchor pointing at an empty div is the same dead link the PRD's own §9 warns about; the anchor and the Services chip should land together with the calculator in PRD 2.
