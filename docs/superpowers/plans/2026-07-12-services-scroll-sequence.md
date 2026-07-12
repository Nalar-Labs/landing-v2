# Services Scroll Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the whole site sui.io-style smooth scrolling; make the Services section's 6 cards inflate one at a time (with a distinct brand-gradient color wash) as the user scrolls past them, flipping the "Consultation" heading to "Implementation" once the third card (Vibe-to-Production) has fully highlighted — and back again if the user scrolls back up; and replace the hero headline with a three-line animated block whose first two lines each contain a looping cycling word.

**Architecture:** Site-wide momentum scrolling via `lenis/react`'s `<ReactLenis root>`, wrapped around `App.tsx`. Inside `Services.tsx`, a single Framer Motion `useScroll` progress value (0→1, tracking the whole section's transit through the viewport) is split into 6 equal bands — one per card, in reading order across both groups. Each `ServiceCard` derives its own scale/gradient-opacity/text-color purely from that shared progress value via `useTransform`, so only one card is near-peak intensity at a time and the rest sit at rest — no per-card scroll listeners, no layout change to the existing 3-column grid. The "Consultation" → "Implementation" heading swap is a single reactive threshold on the same progress value, so it's naturally reversible on scroll-up. `prefers-reduced-motion` disables both the Lenis easing and the card motion, falling back to the site's existing static/hover-only behavior. The hero headline is replaced by three lines (data-driven from `content.ts`) that enter with a staggered fade + 20px rise on load; Lines 1 and 2 each embed a `CyclingWord` component that loops through a word list on a 2s-hold / 300ms-transition timer (Line 2 offset by 600ms), and under reduced motion each shows its first word statically.

**Tech Stack:** React + Vite (existing), `motion` v12 (`motion/react`, already a dependency), new dependency `lenis` v1.3.x (`lenis/react`). No test framework exists in this repo (no CI, no Vitest/Jest) — Node 24 is installed and supports running `.ts` files directly, so pure-logic modules are tested with Node's built-in test runner (`node --test`, `node:assert/strict`) with zero new dependencies. Visual/animation behavior is verified manually via `npm run dev` in the browser, since scroll-linked motion isn't meaningfully unit-testable.

## Global Constraints

- Never hard-code hex colors in components — reference the existing CSS variables in `src/styles/theme.css` (`--nalar-brand`, `--nalar-brand-hover`, `--nalar-ink`, `--nalar-ink-soft`, `--nalar-surface`, `--nalar-muted-ink`). One narrow, documented exception: Framer Motion's `useTransform` color interpolation needs literal parseable color strings (it cannot interpolate a `var()` reference), so the two text-color crossfades in Task 5 use literal hex values with a comment naming the token they mirror.
- **No drop shadows** — depth comes from surface color and motion only (`guidelines/Guidelines.md` §5). The inflate effect uses `scale` + gradient-overlay opacity, never `box-shadow`.
- **One accent per view** in spirit — all 6 card gradients are built only from the existing brand tokens (orange, orange-hover, ink, ink-soft); no new hues are introduced.
- Cards keep `rounded-card` (30px) and the existing `gap-6` / 3-column grid — this plan does not change `Services.tsx`'s grid layout.
- Respect `prefers-reduced-motion`: gate both the Lenis smoothing and the card scroll-transforms (`guidelines/Guidelines.md` §6, §8).
- Follow the existing code style: `cn()` + `TYPE`/`SECTION`/`CONTAINER` constants from `src/app/lib/layout.ts`, content data kept out of section components.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Add `lenis` dependency |
| `src/app/lib/use-reduced-motion.ts` (new) | `usePrefersReducedMotion()` hook — single source of truth for the media query |
| `src/app/lib/smooth-scroll.tsx` (new) | `SmoothScroll` component wrapping the app in `<ReactLenis root>`, disabled when reduced motion is preferred |
| `src/app/App.tsx` | Wrap the existing tree in `<SmoothScroll>` |
| `src/app/lib/service-scroll-sequence.ts` (new) | Pure math: card band/intensity calculation, heading-swap threshold — unit tested |
| `src/app/lib/service-scroll-sequence.test.ts` (new) | `node --test` coverage for the above |
| `src/app/lib/service-gradients.ts` (new) | The 6 per-card gradient strings (brand tokens only) |
| `src/app/lib/service-gradients.test.ts` (new) | Guards the gradient list stays in sync with the card count |
| `src/app/components/ServiceCard.tsx` | Accepts scroll progress + index, renders the scroll-driven scale/gradient/text-color, replaces the CSS hover class with `whileHover` so it composes with the scroll `scale` |
| `src/app/sections/Services.tsx` | Owns the `useScroll` target ref, computes global card index per group, renders the reactive "Consultation"/"Implementation" heading |
| `src/app/data/content.ts` | `HERO.headline` replaced by `HERO.lines` (three-line structure with per-line cycling word lists) |
| `src/app/data/content.test.ts` (new) | `node --test` guard on the hero line/cycling-word data shape |
| `src/app/components/CyclingWord.tsx` (new) | Timer-driven looping word with fade + vertical slide transition, reduced-motion fallback |
| `src/app/sections/Hero.tsx` | Renders the three staggered-entrance lines, embedding `CyclingWord` in Lines 1–2 |

---

### Task 1: Pure scroll-sequence math (`service-scroll-sequence.ts`)

**Files:**
- Create: `src/app/lib/service-scroll-sequence.ts`
- Test: `src/app/lib/service-scroll-sequence.test.ts`

**Interfaces:**
- Produces: `SERVICE_CARD_COUNT: number`, `HEADING_SWAP_PROGRESS: number`, `getCardIntensity(progress: number, index: number, count?: number): number`, `getServicesHeadingLabel(progress: number): "Consultation" | "Implementation"` — consumed by `ServiceCard.tsx` and `Services.tsx` in later tasks.

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/lib/service-scroll-sequence.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_CARD_COUNT,
  HEADING_SWAP_PROGRESS,
  getCardIntensity,
  getServicesHeadingLabel,
} from "./service-scroll-sequence.ts";

test("SERVICE_CARD_COUNT is 6 (3 Consultation + 3 End-to-End Implementation cards)", () => {
  assert.equal(SERVICE_CARD_COUNT, 6);
});

test("getCardIntensity is 0 at the very start of a card's band", () => {
  assert.equal(getCardIntensity(0, 0), 0);
});

test("getCardIntensity peaks at 1 in the middle of a card's band", () => {
  // card 0's band is [0, 1/6], peak at 1/12
  assert.equal(getCardIntensity(1 / 12, 0), 1);
  // card 2's band is [2/6, 3/6], peak at 2.5/6
  assert.equal(getCardIntensity(2.5 / 6, 2), 1);
});

test("getCardIntensity is 0 outside a card's band", () => {
  assert.equal(getCardIntensity(0.9, 0), 0);
  assert.equal(getCardIntensity(0, 5), 0);
});

test("getCardIntensity ramps linearly between band start and peak", () => {
  // card 0 band [0, 1/6], peak 1/12 -> halfway to peak should be ~0.5
  const halfway = getCardIntensity(1 / 24, 0);
  assert.ok(Math.abs(halfway - 0.5) < 1e-9, `expected ~0.5, got ${halfway}`);
});

test("HEADING_SWAP_PROGRESS is the peak of the 3rd card (index 2)", () => {
  assert.equal(HEADING_SWAP_PROGRESS, 2.5 / 6);
});

test("getServicesHeadingLabel stays Consultation before the 3rd card peaks", () => {
  assert.equal(getServicesHeadingLabel(0), "Consultation");
  assert.equal(getServicesHeadingLabel(HEADING_SWAP_PROGRESS - 0.01), "Consultation");
});

test("getServicesHeadingLabel flips to Implementation at and after the 3rd card's peak", () => {
  assert.equal(getServicesHeadingLabel(HEADING_SWAP_PROGRESS), "Implementation");
  assert.equal(getServicesHeadingLabel(1), "Implementation");
});

test("getServicesHeadingLabel reverts to Consultation when progress drops back down (scroll-up)", () => {
  assert.equal(getServicesHeadingLabel(0.9), "Implementation");
  assert.equal(getServicesHeadingLabel(0.1), "Consultation");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/app/lib/service-scroll-sequence.test.ts`
Expected: FAIL — `Cannot find module './service-scroll-sequence.ts'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/app/lib/service-scroll-sequence.ts
/**
 * Pure math for the Services section's scroll-driven card sequence.
 * No DOM, no React — safe to unit test directly with `node --test`.
 */

/** 3 Consultation cards + 3 End-to-End Implementation cards. */
export const SERVICE_CARD_COUNT = 6;

/**
 * Progress (0-1) at which the 3rd card (index 2, "Vibe-to-Production")
 * reaches full intensity — the moment all 3 Consultation cards have been
 * sequentially highlighted. Reused as the heading-swap threshold.
 */
export const HEADING_SWAP_PROGRESS = 2.5 / SERVICE_CARD_COUNT;

/**
 * Returns 0-1: how "inflated" the card at `index` should be at the given
 * overall scroll `progress`. Each card owns an equal band of the 0-1 range
 * and ramps linearly up to 1 at the band's midpoint, then back down to 0 —
 * so only the card whose band contains `progress` is ever significantly
 * inflated, matching a spotlight passing across the cards as you scroll.
 */
export function getCardIntensity(
  progress: number,
  index: number,
  count: number = SERVICE_CARD_COUNT,
): number {
  const band = 1 / count;
  const start = index * band;
  const peak = start + band / 2;
  const end = start + band;

  if (progress <= start || progress >= end) return 0;
  if (progress <= peak) return (progress - start) / (peak - start);
  return (end - progress) / (end - peak);
}

/**
 * The Services group heading swaps from "Consultation" to "Implementation"
 * once the 3rd card has fully highlighted, and reverts if the user scrolls
 * back above that point.
 */
export function getServicesHeadingLabel(
  progress: number,
): "Consultation" | "Implementation" {
  return progress >= HEADING_SWAP_PROGRESS ? "Implementation" : "Consultation";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/app/lib/service-scroll-sequence.test.ts`
Expected: PASS — all 9 assertions green, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/service-scroll-sequence.ts src/app/lib/service-scroll-sequence.test.ts
git commit -m "feat: add pure scroll-sequence math for Services cards"
```

---

### Task 2: Per-card gradient tokens (`service-gradients.ts`)

**Files:**
- Create: `src/app/lib/service-gradients.ts`
- Test: `src/app/lib/service-gradients.test.ts`

**Interfaces:**
- Consumes: `SERVICE_CARD_COUNT` from `./service-scroll-sequence.ts` (Task 1).
- Produces: `SERVICE_CARD_GRADIENTS: readonly string[]` — consumed by `ServiceCard.tsx` in Task 5.

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/lib/service-gradients.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SERVICE_CARD_GRADIENTS } from "./service-gradients.ts";
import { SERVICE_CARD_COUNT } from "./service-scroll-sequence.ts";

test("there is exactly one gradient per card", () => {
  assert.equal(SERVICE_CARD_GRADIENTS.length, SERVICE_CARD_COUNT);
});

test("every gradient only references brand CSS variables, never a raw hex", () => {
  const hexPattern = /#[0-9a-fA-F]{3,8}/;
  for (const gradient of SERVICE_CARD_GRADIENTS) {
    assert.equal(
      hexPattern.test(gradient),
      false,
      `gradient "${gradient}" contains a hard-coded hex value`,
    );
    assert.match(gradient, /^linear-gradient\(/);
  }
});

test("adjacent cards never use the exact same gradient", () => {
  for (let i = 1; i < SERVICE_CARD_GRADIENTS.length; i++) {
    assert.notEqual(SERVICE_CARD_GRADIENTS[i], SERVICE_CARD_GRADIENTS[i - 1]);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/app/lib/service-gradients.test.ts`
Expected: FAIL — `Cannot find module './service-gradients.ts'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/app/lib/service-gradients.ts
/**
 * One gradient per Services card, in the same reading order Services.tsx
 * renders them (Consultation row, then End-to-End Implementation row).
 * Built only from the brand tokens in src/styles/theme.css — alternating
 * angle and stop order keeps each one visually distinct without
 * introducing any new hues (guidelines/Guidelines.md §2, "one accent per
 * view").
 */
export const SERVICE_CARD_GRADIENTS = [
  // 0 — AI Strategy & Implementation Roadmap
  "linear-gradient(135deg, var(--nalar-brand) 0%, var(--nalar-ink-soft) 100%)",
  // 1 — Technical Cost Optimisation
  "linear-gradient(135deg, var(--nalar-ink-soft) 0%, var(--nalar-brand-hover) 100%)",
  // 2 — Vibe-to-Production
  "linear-gradient(135deg, var(--nalar-brand-hover) 0%, var(--nalar-ink) 100%)",
  // 3 — Internal Tool Building
  "linear-gradient(225deg, var(--nalar-ink) 0%, var(--nalar-brand) 100%)",
  // 4 — External Product Development
  "linear-gradient(225deg, var(--nalar-brand) 0%, var(--nalar-brand-hover) 100%)",
  // 5 — Agentic Deployment
  "linear-gradient(225deg, var(--nalar-brand-hover) 0%, var(--nalar-ink-soft) 100%)",
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/app/lib/service-gradients.test.ts`
Expected: PASS — all 3 assertions (well, 2 direct + 6 loop assertions) green.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/service-gradients.ts src/app/lib/service-gradients.test.ts
git commit -m "feat: add brand-token gradients for Services scroll sequence"
```

---

### Task 3: `usePrefersReducedMotion` hook

**Files:**
- Create: `src/app/lib/use-reduced-motion.ts`

**Interfaces:**
- Produces: `usePrefersReducedMotion(): boolean` — consumed by `smooth-scroll.tsx` (Task 4), `Services.tsx` (Task 6), and `CyclingWord.tsx` (Task 8).

This hook reads `window.matchMedia`, so it can't run under Node's test runner (no DOM). It's verified manually in Task 4/6's browser checks. Keep the step numbering consistent with the rest of the plan; there's no automated red/green cycle for this step.

- [ ] **Step 1: Write the hook**

```typescript
// src/app/lib/use-reduced-motion.ts
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the user's OS/browser requests reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const onChange = () => setPrefersReduced(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}
```

- [ ] **Step 2: Manually verify in isolation**

Run: `npm run dev`, open the site, open Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`. Add a temporary `console.log(usePrefersReducedMotion())` inside `Hero.tsx` (or any mounted component) to confirm it logs `true` with the emulation on and `false` with it off/`no-preference`. Remove the temporary log before committing.

Expected: logged value flips between `true`/`false` as the emulation is toggled, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/use-reduced-motion.ts
git commit -m "feat: add usePrefersReducedMotion hook"
```

---

### Task 4: Site-wide smooth scroll (`SmoothScroll` + Lenis)

**Files:**
- Modify: `package.json`
- Create: `src/app/lib/smooth-scroll.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion()` from Task 3.
- Produces: `SmoothScroll` component (default export) wrapping `children` — consumed by `App.tsx` only.

- [ ] **Step 1: Add the dependency**

```bash
npm install lenis@^1.3.25
```

Run: `npm ls lenis`
Expected: prints `lenis@1.3.x` (no `UNMET DEPENDENCY` / `empty`).

- [ ] **Step 2: Write the `SmoothScroll` wrapper**

```tsx
// src/app/lib/smooth-scroll.tsx
import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Site-wide momentum scrolling (sui.io-style). Lenis moves the real
 * document scroll position each frame, so Framer Motion's `useScroll`
 * (which listens to native `scroll` events) picks up the eased values
 * automatically — no extra bridging needed.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
```

- [ ] **Step 3: Wrap the app**

```tsx
// src/app/App.tsx
import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { Services } from "./sections/Services";
import { Approach } from "./sections/Approach";
import { CTA } from "./sections/CTA";
import { SmoothScroll } from "./lib/smooth-scroll";

export default function App() {
  return (
    <SmoothScroll>
      <div className="min-h-screen overflow-x-hidden bg-white font-display text-black selection:bg-brand selection:text-white">
        <Navbar />
        <main>
          <Hero />
          <Services />
          <Approach />
          <CTA />
        </main>
      </div>
    </SmoothScroll>
  );
}
```

- [ ] **Step 4: Manually verify**

Run: `npm run dev`, open the printed local URL in the browser.
- Scroll with the mouse wheel/trackpad on the full page: motion should have a short eased "catch-up" instead of stopping instantly (Lenis momentum).
- Open DevTools → Rendering → set `prefers-reduced-motion: reduce` → reload the page → scroll again: it should now scroll natively/instantly with no easing (confirms the reduced-motion bailout in Step 2 works).
- Check the DevTools console: no errors.

Expected: momentum scroll present by default, disabled entirely under reduced motion, zero console errors either way.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/lib/smooth-scroll.tsx src/app/App.tsx
git commit -m "feat: add site-wide smooth scrolling with Lenis"
```

---

### Task 5: Scroll-driven `ServiceCard` visuals

**Files:**
- Modify: `src/app/components/ServiceCard.tsx`

**Interfaces:**
- Consumes: `getCardIntensity` from `service-scroll-sequence.ts` (Task 1), `SERVICE_CARD_GRADIENTS` from `service-gradients.ts` (Task 2).
- Produces: `ServiceCard` now requires `index: number`, `cardCount: number`, `scrollYProgress: MotionValue<number>`, `reducedMotion: boolean` in addition to its existing `Service` props — consumed by `Services.tsx` in Task 7 (renders and passes these).

Since `useTransform` output can't be asserted with `node --test` (it needs a live Framer Motion render context and a DOM), this task is verified manually in the browser, checking the actual rendered styles as scroll progress changes.

- [ ] **Step 1: Rewrite the component**

```tsx
// src/app/components/ServiceCard.tsx
import { motion, useTransform, type MotionValue } from "motion/react";
import { cn, TYPE } from "../lib/layout";
import type { Service } from "../data/content";
import { getCardIntensity } from "../lib/service-scroll-sequence";
import { SERVICE_CARD_GRADIENTS } from "../lib/service-gradients";

type ServiceCardProps = Service & {
  /** This card's position among all 6 Services cards (0-5), reading order. */
  index: number;
  cardCount: number;
  /** Shared 0-1 progress for the whole Services section, from Services.tsx. */
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
};

// Mirrors --nalar-ink / --nalar-muted-ink in theme.css. Framer Motion's
// color interpolation needs literal color strings, not var() references.
const REST_TITLE_COLOR = "#1e1e1e";
const REST_BODY_COLOR = "#9a9a9a";
const INFLATED_TEXT_COLOR = "#ffffff";

export function ServiceCard({
  title,
  description,
  gradient = false,
  index,
  cardCount,
  scrollYProgress,
  reducedMotion,
}: ServiceCardProps) {
  const intensity = useTransform(scrollYProgress, (progress) =>
    getCardIntensity(progress, index, cardCount),
  );
  const scale = useTransform(intensity, [0, 1], [1, 1.06]);
  const gradientOpacity = useTransform(intensity, [0, 1], [0, 0.92]);
  const titleColor = useTransform(intensity, [0, 1], [REST_TITLE_COLOR, INFLATED_TEXT_COLOR]);
  const bodyColor = useTransform(intensity, [0, 1], [REST_BODY_COLOR, INFLATED_TEXT_COLOR]);

  return (
    <motion.div
      style={reducedMotion ? undefined : { scale }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-card p-8 md:p-[30px]",
        gradient
          ? "bg-surface bg-gradient-to-r from-[#3c3c3c33] to-[#ffffff33]"
          : "bg-surface",
      )}
    >
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: gradientOpacity, backgroundImage: SERVICE_CARD_GRADIENTS[index] }}
          className="pointer-events-none absolute inset-0 rounded-card"
        />
      )}
      <motion.h4
        style={reducedMotion ? undefined : { color: titleColor }}
        className={cn(TYPE.cardTitle, "relative z-10 mb-8")}
      >
        {title}
      </motion.h4>
      <motion.p
        style={reducedMotion ? undefined : { color: bodyColor }}
        className={cn(TYPE.body, "relative z-10")}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
```

- [ ] **Step 2: Manually verify**

`Services.tsx` doesn't pass the new props yet (that's Task 6), so this step alone will show a TypeScript error / missing props in the editor — that's expected and fine; the goal here is just to confirm the file compiles once wired. Move to Task 6 before doing the full visual check. Do not run `npm run dev` as the final check for this task in isolation — the combined check happens at the end of Task 6, Step 2.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ServiceCard.tsx
git commit -m "feat: drive ServiceCard scale/gradient/text-color from scroll progress"
```

---

### Task 6: Wire `Services.tsx` — shared progress + reactive heading

**Files:**
- Modify: `src/app/sections/Services.tsx`

**Interfaces:**
- Consumes: `getServicesHeadingLabel` from `service-scroll-sequence.ts` (Task 1), `usePrefersReducedMotion` from Task 3, the updated `ServiceCard` props from Task 5.

- [ ] **Step 1: Rewrite the section**

```tsx
// src/app/sections/Services.tsx
import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { SERVICE_GROUPS } from "../data/content";
import { ServiceCard } from "../components/ServiceCard";
import { SERVICE_CARD_COUNT, getServicesHeadingLabel } from "../lib/service-scroll-sequence";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

// Global card index (0-5) each group's items start at, in render order.
const GROUP_INDEX_OFFSETS = SERVICE_GROUPS.reduce<number[]>((offsets, group, i) => {
  offsets.push(i === 0 ? 0 : offsets[i - 1] + SERVICE_GROUPS[i - 1].items.length);
  return offsets;
}, []);

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [headingLabel, setHeadingLabel] = useState<"Consultation" | "Implementation">(
    "Consultation",
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (reducedMotion) return;
    setHeadingLabel(getServicesHeadingLabel(progress));
  });

  return (
    <section id="services" ref={sectionRef} className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Key Services</h2>

      <div className="space-y-16 md:space-y-24">
        {SERVICE_GROUPS.map((group, groupIndex) => {
          const displayHeading =
            group.heading === "Consultation" ? headingLabel : group.heading;

          return (
            <div key={group.heading}>
              <h3 className={cn(TYPE.h3, "mb-10 md:mb-12")}>{displayHeading}</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {group.items.map((service, itemIndex) => (
                  <ServiceCard
                    key={service.title}
                    {...service}
                    index={GROUP_INDEX_OFFSETS[groupIndex] + itemIndex}
                    cardCount={SERVICE_CARD_COUNT}
                    scrollYProgress={scrollYProgress}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Manually verify the full sequence**

Run: `npm run dev`, open the site, scroll down slowly through the Services section (mouse wheel or drag the scrollbar) while watching the 6 cards and the "Consultation" heading.

Checklist:
1. Above the section: all cards at rest (no gradient wash, normal text color).
2. As the section enters, "AI Strategy & Implementation Roadmap" is the first to visibly inflate (scale up slightly) with its orange→ink-soft gradient washing in and its text turning white; the other 5 stay at rest.
3. Continuing to scroll, "Technical Cost Optimisation" inflates while "AI Strategy" relaxes back to normal — only one card near-peak at a time.
4. When "Vibe-to-Production" (3rd card) reaches its peak inflation, the heading above the first row flips from **"Consultation"** to **"Implementation"** at that same moment.
5. Continue scrolling through the second row (Internal Tool Building → External Product Development → Agentic Deployment) — same one-at-a-time inflate behavior, heading stays "Implementation".
6. **Scroll back up** past the "Vibe-to-Production" peak: heading reverts from "Implementation" back to **"Consultation"**.
7. Hover a card with the mouse (not scrolling): it still lifts `-4px` on hover independent of whatever the scroll-scale is doing (confirms `whileHover` composes correctly with the scroll-driven `scale`).
8. DevTools → Rendering → `prefers-reduced-motion: reduce` → reload: cards no longer scale/gradient/recolor on scroll, heading stays "Consultation" throughout, no console errors.
9. Resize to a mobile width (e.g. 390px): grid collapses to 1 column (existing responsive behavior, unchanged) and the same sequential-inflate behavior still plays as you scroll through the now-stacked cards.

Expected: every checklist item matches, no TypeScript errors in the terminal running `npm run dev`, no console errors/warnings in the browser.

- [ ] **Step 3: Commit**

```bash
git add src/app/sections/Services.tsx
git commit -m "feat: sequence Services card highlight off scroll progress, swap heading"
```

---

### Task 7: Hero headline data (`content.ts`)

**Files:**
- Modify: `src/app/data/content.ts:19-26` (the `HERO` constant)
- Modify: `src/app/sections/Hero.tsx:18-20` (stop referencing the removed `HERO.headline` — full rewrite lands in Task 9, but the build must stay green after this task, so swap the reference in the same commit)
- Test: `src/app/data/content.test.ts`

**Interfaces:**
- Produces: `HeroLine = { static: string; cycling?: readonly string[] }` and `HERO.lines: readonly HeroLine[]` (replaces `HERO.headline`; `HERO.links` unchanged) — consumed by `Hero.tsx` (Task 9). `content.ts` has no imports, so it runs under `node --test` directly.

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/data/content.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { HERO } from "./content.ts";

test("hero has exactly three lines", () => {
  assert.equal(HERO.lines.length, 3);
});

test("line 1 copy and cycling words match the spec", () => {
  assert.equal(HERO.lines[0].static, "You don't need expensive");
  assert.deepEqual(HERO.lines[0].cycling, ["tools", "SaaS", "paid software"]);
});

test("line 2 copy and cycling words match the spec", () => {
  assert.equal(HERO.lines[1].static, "You don't need to hire");
  assert.deepEqual(HERO.lines[1].cycling, [
    "consultants",
    "developers",
    "designers",
    "marketers",
  ]);
});

test("line 3 is fully static (no cycling list)", () => {
  assert.equal(
    HERO.lines[2].static,
    "You just need the right partners for your business.",
  );
  assert.equal(HERO.lines[2].cycling, undefined);
});

test("every cycling list has at least two words (a 1-word loop would look broken)", () => {
  for (const line of HERO.lines) {
    if (line.cycling) assert.ok(line.cycling.length >= 2);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/app/data/content.test.ts`
Expected: FAIL — `HERO.lines` is undefined (current `HERO` only has `headline` and `links`).

- [ ] **Step 3: Update the `HERO` constant**

Replace `src/app/data/content.ts` lines 19–26 with:

```typescript
export type HeroLine = {
  /** The part of the line that never changes. */
  static: string;
  /** Words the trailing slot loops through; omit for a fully static line. */
  cycling?: readonly string[];
};

export const HERO = {
  lines: [
    {
      static: "You don't need expensive",
      cycling: ["tools", "SaaS", "paid software"],
    },
    {
      static: "You don't need to hire",
      cycling: ["consultants", "developers", "designers", "marketers"],
    },
    { static: "You just need the right partners for your business." },
  ],
  links: [
    { label: "Book a call", href: "#contact" },
    { label: "Refer someone-else", href: "#refer" },
  ],
} as const satisfies { lines: readonly HeroLine[]; links: readonly { label: string; href: string }[] };
```

Then, in `src/app/sections/Hero.tsx`, replace the single `{HERO.headline}` reference (line 19) with a temporary static render so the build stays green until Task 9's full rewrite:

```tsx
<h1 className={cn(TYPE.hero, "mx-auto mb-16 max-w-[1345px] md:mb-24")}>
  {HERO.lines.map((line) => (
    <span key={line.static} className="block">
      {line.static}
      {line.cycling ? ` ${line.cycling[0]}` : ""}
    </span>
  ))}
</h1>
```

- [ ] **Step 4: Run test to verify it passes, and the build still compiles**

Run: `node --test src/app/data/content.test.ts`
Expected: PASS — all 5 tests green.

Run: `npm run build`
Expected: succeeds — no remaining references to `HERO.headline` anywhere.

- [ ] **Step 5: Commit**

```bash
git add src/app/data/content.ts src/app/data/content.test.ts src/app/sections/Hero.tsx
git commit -m "feat: restructure hero copy into three lines with cycling word lists"
```

---

### Task 8: `CyclingWord` component

**Files:**
- Create: `src/app/components/CyclingWord.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion()` from Task 3.
- Produces: `CyclingWord({ words, offsetMs?, className? })` — `words: readonly string[]`, `offsetMs?: number` (delay before this instance's first transition, default 0), `className?: string`. Consumed by `Hero.tsx` (Task 9).

Timer + DOM component — no `node --test` cycle; verified in the browser at the end of Task 9 (it has no host to render in until `Hero.tsx` uses it).

- [ ] **Step 1: Write the component**

```tsx
// src/app/components/CyclingWord.tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../lib/layout";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

/** How long each word holds before transitioning out. */
const HOLD_MS = 2000;
/** Fade/slide transition duration (spec: ~300ms ease-out). */
const TRANSITION_S = 0.3;

type CyclingWordProps = {
  words: readonly string[];
  /**
   * Delay before this instance's first transition, so multiple instances
   * (hero lines 1 and 2) change at a visible offset instead of in lockstep.
   */
  offsetMs?: number;
  className?: string;
};

/**
 * Loops through `words` indefinitely: each word holds for ~2s, then the
 * outgoing word fades out sliding up while the incoming word fades in
 * rising from below. Under prefers-reduced-motion, renders the first
 * word statically and never starts the timer.
 */
export function CyclingWord({ words, offsetMs = 0, className }: CyclingWordProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || words.length < 2) return;

    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setIndex((i) => (i + 1) % words.length);
      interval = window.setInterval(() => {
        setIndex((i) => (i + 1) % words.length);
      }, HOLD_MS + TRANSITION_S * 1000);
    }, HOLD_MS + TRANSITION_S * 1000 + offsetMs);

    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [prefersReducedMotion, words, offsetMs]);

  if (prefersReducedMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span
      className={cn(
        // inline-grid stacks entering/exiting words in the same cell so the
        // line doesn't jump; overflow-hidden clips the vertical slide.
        "relative inline-grid overflow-hidden align-bottom",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: "0.5em" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-0.5em" }}
          transition={{ duration: TRANSITION_S, ease: "easeOut" }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/CyclingWord.tsx
git commit -m "feat: add CyclingWord looping-text component"
```

---

### Task 9: Hero rewrite — staggered lines + cycling words

**Files:**
- Modify: `src/app/sections/Hero.tsx`

**Interfaces:**
- Consumes: `HERO.lines` from Task 7, `CyclingWord` from Task 8.

- [ ] **Step 1: Rewrite the hero**

```tsx
// src/app/sections/Hero.tsx
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn, TYPE } from "../lib/layout";
import { HERO } from "../data/content";
import { CyclingWord } from "../components/CyclingWord";

/** Line 2's cycle fires this long after Line 1's (spec: ~600ms offset). */
const CYCLE_OFFSET_MS = 600;

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-32"
    >
      <div className="w-full max-w-[1400px] text-center">
        <h1 className={cn(TYPE.hero, "mx-auto mb-16 max-w-[1345px] md:mb-24")}>
          {HERO.lines.map((line, lineIndex) => (
            <motion.span
              key={line.static}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: lineIndex * 0.2 }}
              className="block"
            >
              {line.static}
              {line.cycling && (
                <>
                  {" "}
                  <CyclingWord
                    words={line.cycling}
                    offsetMs={lineIndex * CYCLE_OFFSET_MS}
                  />
                </>
              )}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-8 font-body text-xl sm:flex-row sm:gap-16 md:text-[24px]"
        >
          {HERO.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-60"
            >
              {link.label}
            </a>
          ))}
        </motion.div>
      </div>

      {/* Scroll affordance — mobile */}
      <a
        href="#services"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-soft px-5 py-2 text-sm font-light text-white md:hidden"
      >
        Explore Nalar
        <ArrowRight className="size-4" />
      </a>
    </section>
  );
}
```

Notes on intent, for the implementer:
- The old single `motion.div` wrapper around the whole hero is replaced by per-line `motion.span`s (staggered `delay: 0, 0.2, 0.4`) plus a `delay: 0.6` wrapper for the links row, so the three lines visibly enter one after another and the links come in last.
- The cycling word inherits the headline's color and type styles — no `text-brand` accent, keeping the "one accent per view" rule (the orange stays reserved for the nav CTA).
- `offsetMs={lineIndex * CYCLE_OFFSET_MS}` gives Line 1 `0` and Line 2 `600` — the spec's independent-but-offset cycling. Line 3 has no `cycling` list so it renders static.

- [ ] **Step 2: Manually verify**

Run: `npm run dev`, open the site, watch the hero.

Checklist:
1. On load: Line 1 fades/rises in first, Line 2 ~0.2s later, Line 3 ~0.4s later, then the two links (~0.6s). No layout jump when lines land.
2. After ~2.3s, Line 1's word transitions `tools → SaaS`: outgoing word slides up and fades, incoming rises from below and fades in, ~300ms, and the rest of the line doesn't move.
3. Line 2's first transition (`consultants → developers`) happens visibly *after* Line 1's (~600ms later), and the two lines stay offset on every subsequent cycle.
4. Let it run through at least two full loops: Line 1 cycles `tools → SaaS → paid software → tools…`, Line 2 cycles all four words, both loop indefinitely with a ~2s hold per word.
5. Line 3 never animates after its entrance.
6. Words of different lengths (`SaaS` vs `paid software`, `consultants` vs `marketers`) don't cause the line to jitter vertically; a modest horizontal reflow of the line is acceptable, ugly jumps are not — if it's visually bad, add a `min-w` on the `CyclingWord` wrapper sized to the longest word and note it in the commit.
7. DevTools → Rendering → `prefers-reduced-motion: reduce` → reload: hero shows "You don't need expensive tools" / "You don't need to hire consultants" / Line 3, with **no** word cycling ever starting; no console errors.
8. Mobile width (390px): the three lines wrap acceptably at the `48px` hero size and the cycling word stays on-screen.

Expected: all items pass, no console errors or warnings.

- [ ] **Step 3: Commit**

```bash
git add src/app/sections/Hero.tsx
git commit -m "feat: animated three-line hero with staggered entrance and cycling words"
```

---

### Task 10: Final integration pass

**Files:** none (verification only)

- [ ] **Step 1: Run every unit test**

Run: `node --test src/app/lib/*.test.ts src/app/data/*.test.ts`
Expected: all suites pass (Task 1's 9 assertions + Task 2's assertions + Task 7's 5 hero-data tests), 0 failures.

- [ ] **Step 2: Full production build**

Run: `npm run build`
Expected: build succeeds with no TypeScript/ESBuild errors (this project has no separate `tsc` check — `vite build` is the only build-time signal).

- [ ] **Step 3: Re-run the Task 6, Step 2 (Services) and Task 9, Step 2 (Hero) browser checklists once more** on the production build (`npm run build && npx vite preview`), to confirm nothing regressed between dev and prod bundling (Lenis and Framer Motion both behave slightly differently under minification in rare cases).

- [ ] **Step 4: Commit** (only if Step 3 required fixes; otherwise nothing to commit)

```bash
git add -A
git commit -m "fix: address production-build issues in Services scroll sequence"
```

---

## Self-Review Notes

- **Spec coverage:** sequential per-card inflate with distinct gradients ✅ (Task 5/6), heading swap at 3-cards-highlighted ✅ (Task 1 threshold, Task 6 wiring), reversible on scroll-up ✅ (Task 1 test + Task 6 checklist item 6), 3-column grid preserved ✅ (Task 6 unchanged grid classes), site-wide smooth scroll ✅ (Task 4), "background stays, component reacts" ✅ (no pinning, section scrolls normally, only card-local styles react). Hero: three lines with staggered entrance ✅ (Task 9), exact spec copy + cycling lists ✅ (Task 7, unit-tested verbatim), 2s hold / ~300ms ease-out fade-and-slide transition ✅ (Task 8 `HOLD_MS`/`TRANSITION_S`), Line 2 offset 600ms ✅ (Task 9 `CYCLE_OFFSET_MS`), infinite loop ✅ (modulo cycling, Task 8), reduced-motion shows first word statically ✅ (Task 8 early return + Task 9 checklist item 7).
- **Placeholder scan:** no TBD/"add error handling"/"similar to Task N" — every step has full code.
- **Type consistency:** `getCardIntensity(progress, index, count)` signature matches its Task 1 definition through to its Task 5 call site; `ServiceCard` prop names (`index`, `cardCount`, `scrollYProgress`, `reducedMotion`) match between Task 5's definition and Task 6's call site; `getServicesHeadingLabel` return type (`"Consultation" | "Implementation"`) matches the `useState` type in Task 6; `HeroLine` (`static`, optional `cycling`) matches between Task 7's definition and Task 9's `line.static`/`line.cycling` usage; `CyclingWord` props (`words`, `offsetMs`, `className`) match between Task 8's definition and Task 9's call site.
- **Build-greenness between tasks:** removing `HERO.headline` (Task 7) would break `Hero.tsx` if left dangling, so Task 7 includes the temporary static-line render in the same commit; Task 9 replaces it with the animated version.
