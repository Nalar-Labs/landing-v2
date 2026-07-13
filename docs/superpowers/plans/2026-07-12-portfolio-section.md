# Portfolio Section (Glide.js Carousel + Detail Modal + Git-based CMS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `#portfolio` section below Approach: a Glide.js carousel of project cards with Instagram-style dot navigation and swipe, where clicking a card opens a rich, scrollable detail modal — with all content editable through a git-based CMS admin UI.

**Architecture:** Portfolio content lives as JSON files in `src/content/portfolio/` (one file per project, body as a markdown string). A pure parser module validates/sorts them (testable under `node --test`, matching this repo's pattern); a thin Vite `import.meta.glob` loader pulls them into the bundle. The carousel is Glide.js mounted via a small React hook that mirrors the active slide into React state, so the dots are plain Tailwind buttons. The modal reuses the existing shadcn/Radix `Dialog` with `react-markdown` for the body. The CMS is Sveltia CMS — two static files under `public/admin/`, no server, editing the same JSON files through git.

**Tech Stack:** React 18 + Vite 6 + Tailwind v4 (existing). New runtime deps: `@glidejs/glide@3.7.1`, `react-markdown@10.1.0`. New dev deps: `@types/glidejs__glide@3.6.6`, `@tailwindcss/typography`. Tests: Node 24 built-in runner (`node --test`, `node:assert/strict`) — no test framework in this repo, per precedent in `docs/superpowers/plans/2026-07-12-services-scroll-sequence.md`. Visual behavior (carousel, modal, swipe) is verified manually via `npm run dev`, as with the Services scroll work.

---

## CMS evaluation — read this and decide (recommendation: Sveltia CMS)

**Context that drives the recommendation.** This site is a static Vite SPA in a GitHub repo (`Nalar-Labs/landing-v2`) with no server or database. All copy already lives in the repo (`src/app/data/content.ts` — "content in one place, components purely presentational"). Portfolio updates are low-frequency marketing edits. That profile strongly favors a **git-based CMS**: the admin UI reads/writes files in the repo, so content stays versioned with the site, deploys with the site, and costs nothing to host.

### Recommended: Sveltia CMS

[Sveltia CMS](https://github.com/sveltia/sveltia-cms) is the actively-maintained modern successor to Netlify/Decap CMS — same architecture and same `config.yml` format, rewritten with a current UI and hundreds of fixes.

- **Zero infrastructure.** The entire CMS is one `<script>` tag in a static `public/admin/index.html` plus a `config.yml`. Nothing to host, no database, no accounts service.
- **Local editing works immediately, with no auth setup.** Open `http://localhost:5173/admin/index.html` while `npm run dev` runs, click "Work with Local Repository" (uses the browser File System Access API — Chrome/Edge), edit content, and the JSON files change on disk. Review with `git diff`, commit, push, deploy. This is the workflow this plan sets up.
- **Content stays in git.** Full history, PR review possible, no second source of truth, and the site remains fully static — no API calls, no loading states, no CMS outage can take content down.
- **Cheap escape hatches.** The config format is Decap-compatible, so switching to Decap CMS is a one-line script-tag change. And since content is just JSON files, dropping the CMS entirely (hand-editing) or moving to any other system later loses nothing.
- **Trade-offs to know about:** (1) Editing from the *deployed* site (e.g. by a non-technical teammate without the repo cloned) additionally requires a free OAuth proxy — a ~5-minute Cloudflare Worker deploy of [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) plus registering a GitHub OAuth app. That's an optional follow-up documented in Task 6, not needed for you to edit locally. (2) It's a younger project than Decap (though far more actively maintained).

### Alternatives considered

| Option | Type | Why not (for this site) |
|---|---|---|
| **Decap CMS** (ex-Netlify CMS) | Git-based, static admin page | Same architecture as Sveltia and ~10 years battle-tested, but the UI is dated, maintenance has slowed since the rebrand, and local editing needs an extra `decap-server` proxy process. Pick this over Sveltia only if maximum maturity outweighs UX. Switching between the two later is a one-line change. |
| **TinaCMS** | Git-based with visual inline editing | Visual editing is genuinely nicer for editors, but the project steers you toward paid Tina Cloud; fully self-hosting its backend means running a separate service + auth. Heavier build integration than this one-collection use case justifies. |
| **Keystatic** | Git-based, TypeScript-native schemas | Great DX, but its first-class adapters are Next.js/Astro/Remix — there is no plain-Vite-SPA integration, so it would fight this stack. |
| **Strapi / Payload / Directus** | Self-hosted headless CMS (server + database) | Real admin apps with roles/workflows, but they require paid always-on hosting, add an API fetch layer (loading states, runtime failure modes) to a page that is currently fully static, and move content out of git. Only worth it if non-technical editors must manage many content types daily. |
| **No CMS** (hand-edit JSON) | — | Genuinely viable here — the content files this plan creates are human-editable. The CMS layer (Task 6) is purely additive; you could skip it. |

**Impact of your decision on this plan:** Tasks 1–5 are CMS-agnostic (they only depend on JSON files in `src/content/portfolio/`). Only Task 6 is CMS-specific, and Decap↔Sveltia differ by one script tag. Choosing Tina/Keystatic/Strapi instead would replace Task 6 and the loader in Task 2.

**One more flag — the carousel library.** `embla-carousel-react@8.6.0` (plus a shadcn `carousel.tsx` wrapper) is already in `package.json` as unused scaffolding from the Figma Make export. The spec names Glide.js, so this plan uses Glide (`@glidejs/glide`, v3.7.1, ~7 kB gzip, dependency-free); if you'd rather avoid the extra dependency, only Task 4 would change.

---

## Global Constraints

- New runtime dependencies limited to: `@glidejs/glide@3.7.1`, `react-markdown@10.1.0`. New dev dependencies: `@types/glidejs__glide@3.6.6`, `@tailwindcss/typography`.
- No test framework may be added — tests use Node 24's built-in runner: `node --test`, `node:assert/strict`, importing `.ts` files directly (type stripping). Pure-logic modules must not import Vite-only APIs (`import.meta.glob`).
- Package manager: `npm` (repo has `package-lock.json`; prior plan used npm commands).
- The section anchor must be `id="portfolio"` — `NAV_LINKS` in `src/app/data/content.ts:16` already points at `#portfolio`.
- Reuse the shared layout/typography constants from `src/app/lib/layout.ts` (`cn`, `CONTAINER`, `SECTION`, `TYPE`) and the Tailwind brand utilities defined in `src/styles/theme.css` (`bg-surface`, `text-muted-ink`, `border-line`, `rounded-card`, `bg-brand`).
- Respect reduced motion via `usePrefersReducedMotion()` from `src/app/lib/use-reduced-motion.ts` (Glide gets `animationDuration: 0`).
- The site scrolls through Lenis (`src/app/lib/smooth-scroll.tsx`). Any independently-scrollable overlay (the modal body) MUST carry `data-lenis-prevent`, or Lenis swallows wheel events and the modal cannot scroll.
- Glide's `keyboard` option must be `false` — it binds arrow-key listeners document-wide and would hijack arrow keys for the entire page.
- Content-model rule: invalid content files **throw at module load** (fails the build / shows the Vite dev overlay) rather than being silently skipped — a broken item must never silently vanish for visitors. Draft items (`"draft": true`) are the one deliberate skip.
- Commit after every task; message style follows repo history (`feat:`, `fix:`, `test:`, `chore:`).

## File Structure

| File | Responsibility |
|---|---|
| `src/app/data/portfolio.ts` (new) | `PortfolioItem` type + `parsePortfolioItems()` — pure validation/sort logic, no Vite APIs |
| `src/app/data/portfolio.test.ts` (new) | `node --test` coverage for the parser |
| `src/content/portfolio/*.json` (new, 4 seed files) | One JSON file per project; the files the CMS edits |
| `src/app/data/portfolio-items.ts` (new) | Vite-only `import.meta.glob` loader → `PORTFOLIO_ITEMS` |
| `src/app/data/portfolio-content.test.ts` (new) | `node --test` guard that every real content file parses (reads dir via `node:fs`) |
| `src/app/components/PortfolioCard.tsx` (new) | Clickable project card (cover image / gradient placeholder, title, client, summary) |
| `src/app/lib/use-glide.ts` (new) | React hook owning the Glide.js lifecycle; exposes `rootRef`, `activeIndex`, `goTo` |
| `src/app/components/PortfolioCarousel.tsx` (new) | Glide markup (track/slides) + Tailwind dot navigation |
| `src/app/components/PortfolioModal.tsx` (new) | Radix Dialog detail view; markdown body via `react-markdown`; `data-lenis-prevent` scroll area |
| `src/app/sections/Portfolio.tsx` (new) | Section shell: heading, carousel, selected-item state, modal |
| `src/app/App.tsx` (modify) | Mount `<Portfolio />` between `<Approach />` and `<CTA />` |
| `src/styles/tailwind.css` (modify) | Register `@tailwindcss/typography` for modal prose styling |
| `public/admin/index.html`, `public/admin/config.yml` (new) | Sveltia CMS admin page + collection schema |
| `docs/cms.md` (new) | Editor workflow (local editing, publishing, optional production auth) |

---

### Task 1: Portfolio content model + parser (pure logic, TDD)

**Files:**
- Create: `src/app/data/portfolio.ts`
- Test: `src/app/data/portfolio.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces: `type PortfolioItem = { title: string; client?: string; summary: string; coverImage?: string; tags: string[]; order: number; body: string }` and `parsePortfolioItems(raw: unknown[]): PortfolioItem[]` — validates, filters `draft: true` entries, treats empty strings as absent for optional fields, defaults `tags` to `[]` and `order` to `0`, sorts ascending by `order`, throws `Error` naming the offending field on invalid input. Tasks 2, 3, 4, 5 all import from here.

- [ ] **Step 1: Write the failing test**

Create `src/app/data/portfolio.test.ts`:

```ts
// Structural guards for the portfolio content pipeline. Content copy is free
// to change; the shapes the carousel and modal rely on must hold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePortfolioItems } from "./portfolio.ts";

const valid = {
  title: "Project A",
  summary: "Did a thing.",
  tags: ["React"],
  order: 1,
  body: "## Heading\n\nBody copy.",
};

test("parses a valid item and applies defaults for optional fields", () => {
  const [item] = parsePortfolioItems([valid]);
  assert.equal(item.title, "Project A");
  assert.equal(item.client, undefined);
  assert.equal(item.coverImage, undefined);
  assert.deepEqual(item.tags, ["React"]);
});

test("sorts items by order ascending", () => {
  const items = parsePortfolioItems([
    { ...valid, title: "B", order: 2 },
    { ...valid, title: "A", order: 1 },
  ]);
  assert.deepEqual(
    items.map((item) => item.title),
    ["A", "B"],
  );
});

test("filters out draft items", () => {
  const items = parsePortfolioItems([
    valid,
    { ...valid, title: "Hidden", draft: true },
  ]);
  assert.deepEqual(
    items.map((item) => item.title),
    ["Project A"],
  );
});

test('treats empty-string optional fields as absent (CMS clears fields to "")', () => {
  const [item] = parsePortfolioItems([{ ...valid, coverImage: "", client: "" }]);
  assert.equal(item.coverImage, undefined);
  assert.equal(item.client, undefined);
});

test("defaults tags to an empty array and order to 0", () => {
  const [item] = parsePortfolioItems([
    { title: "T", summary: "S", body: "B" },
  ]);
  assert.deepEqual(item.tags, []);
  assert.equal(item.order, 0);
});

test("throws a descriptive error on missing required fields", () => {
  assert.throws(() => parsePortfolioItems([{ ...valid, title: "" }]), /title/);
  assert.throws(
    () => parsePortfolioItems([{ ...valid, summary: undefined }]),
    /summary/,
  );
  assert.throws(
    () => parsePortfolioItems([{ ...valid, body: undefined }]),
    /body/,
  );
});

test("throws on non-object entries (malformed content file)", () => {
  assert.throws(() => parsePortfolioItems(["nope"]), /object/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/app/data/portfolio.test.ts`
Expected: FAIL — `Cannot find module` for `./portfolio.ts`.

- [ ] **Step 3: Write the implementation**

Create `src/app/data/portfolio.ts`:

```ts
// Portfolio content model. Pure logic only — no Vite APIs — so it runs under
// node --test like the other data modules. The matching Vite loader lives in
// portfolio-items.ts.

export type PortfolioItem = {
  title: string;
  /** Client or company name shown under the title. */
  client?: string;
  /** One-liner shown on the card and as the modal intro. */
  summary: string;
  /** Path under public/, e.g. "/images/portfolio/foo.jpg". Cards render a gradient placeholder when absent. */
  coverImage?: string;
  tags: string[];
  /** Carousel position, ascending. */
  order: number;
  /** Markdown, rendered inside the detail modal. */
  body: string;
};

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    const label = typeof record.title === "string" && record.title !== "" ? record.title : "(untitled)";
    throw new Error(`Portfolio item "${label}": missing required field "${key}"`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  // The CMS writes "" when a field is cleared; treat that as absent.
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Validates raw JSON content into PortfolioItems. Throws (rather than
 * skipping) on invalid input so a broken content file fails the build /
 * dev overlay instead of an item silently vanishing for visitors. Draft
 * items are the one deliberate skip.
 */
export function parsePortfolioItems(raw: unknown[]): PortfolioItem[] {
  const items: PortfolioItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Portfolio content files must contain JSON objects");
    }
    const record = entry as Record<string, unknown>;
    if (record.draft === true) continue;
    items.push({
      title: requireString(record, "title"),
      client: optionalString(record, "client"),
      summary: requireString(record, "summary"),
      coverImage: optionalString(record, "coverImage"),
      tags: Array.isArray(record.tags)
        ? record.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      order: typeof record.order === "number" ? record.order : 0,
      body: requireString(record, "body"),
    });
  }
  return items.sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/app/data/portfolio.test.ts`
Expected: PASS — 7 tests, 0 failures.

- [ ] **Step 5: Run the whole existing suite (regression check)**

Run: `node --test "src/app/**/*.test.ts"`
Expected: PASS — all pre-existing tests plus the 7 new ones.

- [ ] **Step 6: Commit**

```bash
git add src/app/data/portfolio.ts src/app/data/portfolio.test.ts
git commit -m "feat: portfolio content model with validating parser"
```

---

### Task 2: Seed content files + Vite loader

**Files:**
- Create: `src/content/portfolio/internal-ops-dashboard.json`
- Create: `src/content/portfolio/ai-document-pipeline.json`
- Create: `src/content/portfolio/customer-portal.json`
- Create: `src/content/portfolio/cost-audit.json`
- Create: `src/app/data/portfolio-items.ts`
- Test: `src/app/data/portfolio-content.test.ts`

**Interfaces:**
- Consumes: `parsePortfolioItems`, `PortfolioItem` from `src/app/data/portfolio.ts` (Task 1).
- Produces: `PORTFOLIO_ITEMS: PortfolioItem[]` exported from `src/app/data/portfolio-items.ts` (Vite-only module — never import it in tests). Content files follow the JSON shape from Task 1; these are also the files the CMS (Task 6) edits, so field names must match the `config.yml` there exactly.

- [ ] **Step 1: Write the failing content-guard test**

Create `src/app/data/portfolio-content.test.ts`:

```ts
// Guards the real content files: everything in src/content/portfolio must
// satisfy the parser the site boots with, because parse errors there crash
// the build. Reads the dir via node:fs since import.meta.glob is Vite-only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePortfolioItems } from "./portfolio.ts";

const contentDir = fileURLToPath(
  new URL("../../content/portfolio/", import.meta.url),
);

function loadAll(): unknown[] {
  return readdirSync(contentDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(contentDir, name), "utf8")));
}

test("there is at least one portfolio content file", () => {
  assert.ok(loadAll().length >= 1);
});

test("every content file parses cleanly", () => {
  assert.doesNotThrow(() => parsePortfolioItems(loadAll()));
});

test("published items have unique titles (used as React keys)", () => {
  const titles = parsePortfolioItems(loadAll()).map((item) => item.title);
  assert.equal(new Set(titles).size, titles.length);
});

test("published items have unique orders (stable carousel/dot order)", () => {
  const orders = parsePortfolioItems(loadAll()).map((item) => item.order);
  assert.equal(new Set(orders).size, orders.length);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/app/data/portfolio-content.test.ts`
Expected: FAIL — `ENOENT` reading `src/content/portfolio/` (directory doesn't exist yet).

- [ ] **Step 3: Create the four seed content files**

These are placeholder-but-plausible projects; the user replaces copy via the CMS later. No `coverImage` yet (cards render the gradient placeholder), so no fake image assets are committed.

Create `src/content/portfolio/internal-ops-dashboard.json`:

```json
{
  "title": "Internal Ops Dashboard",
  "client": "Logistics company",
  "summary": "Replaced three SaaS subscriptions with one custom dashboard the team fully owns.",
  "coverImage": "",
  "tags": ["Internal tools", "React", "Cost reduction"],
  "order": 0,
  "draft": false,
  "body": "## The problem\n\nThe operations team was paying for three overlapping SaaS tools — one for tracking, one for reporting, one for scheduling — and still stitching the gaps together in spreadsheets.\n\n## What we built\n\nA single internal dashboard that pulls from the same data sources, tailored to the team's actual workflow instead of a vendor's idea of it.\n\n- Live shipment tracking board\n- One-click weekly reports\n- Role-based access for warehouse and office staff\n\n## Outcome\n\nThe three subscriptions were cancelled within a quarter, and the tool now runs on infrastructure the client controls."
}
```

Create `src/content/portfolio/ai-document-pipeline.json`:

```json
{
  "title": "AI Document Pipeline",
  "client": "Professional services firm",
  "summary": "An agentic pipeline that classifies, extracts, and files inbound documents automatically.",
  "coverImage": "",
  "tags": ["AI", "Automation"],
  "order": 1,
  "draft": false,
  "body": "## The problem\n\nHundreds of inbound PDFs a week were being read, renamed, and filed by hand.\n\n## What we built\n\nA document pipeline with an LLM-based classification and extraction step, human review for low-confidence cases, and automatic filing into the existing document store.\n\n## Outcome\n\nManual handling dropped to the review queue only, with a full audit trail for every automated decision."
}
```

Create `src/content/portfolio/customer-portal.json`:

```json
{
  "title": "Customer Portal",
  "client": "B2B distributor",
  "summary": "A customer-facing ordering portal architected to grow from hundreds to millions of requests.",
  "coverImage": "",
  "tags": ["Product development", "External"],
  "order": 2,
  "draft": false,
  "body": "## The problem\n\nOrders arrived by email and phone, and every one of them was retyped into the ERP by hand.\n\n## What we built\n\nA self-service portal where customers browse live inventory, place orders, and track deliveries — integrated directly with the existing ERP.\n\n## Outcome\n\nOrder-entry errors disappeared, and the sales team's time moved from data entry to actual selling."
}
```

Create `src/content/portfolio/cost-audit.json`:

```json
{
  "title": "Technical Cost Audit",
  "client": "Seed-stage startup",
  "summary": "A systems audit that cut monthly infrastructure and tooling spend roughly in half.",
  "coverImage": "",
  "tags": ["Consultation", "Cost reduction"],
  "order": 3,
  "draft": false,
  "body": "## The problem\n\nCloud and tooling costs had crept up release by release, and nobody could say which line items actually mattered.\n\n## What we did\n\nA structured audit of infrastructure, third-party services, and build pipelines, with a prioritized list of cuts and consolidations — each with its risk spelled out.\n\n## Outcome\n\nThe client applied the top recommendations themselves using our runbook, cutting monthly spend roughly in half without a migration project."
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/app/data/portfolio-content.test.ts`
Expected: PASS — 4 tests, 0 failures.

- [ ] **Step 5: Write the Vite loader**

Create `src/app/data/portfolio-items.ts`:

```ts
// Vite-only loader: bundles every JSON file in src/content/portfolio at
// build time. Kept apart from portfolio.ts so the pure logic stays runnable
// under node --test (import.meta.glob does not exist outside Vite).
import { parsePortfolioItems, type PortfolioItem } from "./portfolio";

const modules = import.meta.glob("../../content/portfolio/*.json", {
  eager: true,
  import: "default",
});

export const PORTFOLIO_ITEMS: PortfolioItem[] = parsePortfolioItems(
  Object.values(modules),
);
```

- [ ] **Step 6: Verify the loader compiles in a real build**

Run: `npm run build`
Expected: build completes with no errors (the glob resolves and the JSON parses at module init).

- [ ] **Step 7: Run the whole suite**

Run: `node --test "src/app/**/*.test.ts"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/content/portfolio src/app/data/portfolio-items.ts src/app/data/portfolio-content.test.ts
git commit -m "feat: seed portfolio content and Vite content loader"
```

---

### Task 3: Portfolio card + section skeleton wired into the app

**Files:**
- Create: `src/app/components/PortfolioCard.tsx`
- Create: `src/app/sections/Portfolio.tsx`
- Modify: `src/app/App.tsx:5-22` (import + mount between `<Approach />` and `<CTA />`)

**Interfaces:**
- Consumes: `PORTFOLIO_ITEMS` from `portfolio-items.ts` (Task 2), `PortfolioItem` from `portfolio.ts` (Task 1), `cn`/`CONTAINER`/`SECTION`/`TYPE` from `src/app/lib/layout.ts`.
- Produces: `PortfolioCard({ item, onOpen }: { item: PortfolioItem; onOpen: () => void })` — Tasks 4 and 5 rely on this exact prop shape. `Portfolio()` section component — Task 4 replaces its temporary grid with the carousel; Task 5 wires the modal into it.

- [ ] **Step 1: Write the card component**

Create `src/app/components/PortfolioCard.tsx`:

```tsx
import { cn, TYPE } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";

type PortfolioCardProps = {
  item: PortfolioItem;
  /** Opens the detail modal for this item. */
  onOpen: () => void;
};

export function PortfolioCard({ item, onOpen }: PortfolioCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-card bg-surface text-left",
        "transition-transform duration-300 ease-out hover:-translate-y-1",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      )}
    >
      {item.coverImage ? (
        <img
          src={item.coverImage}
          alt=""
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[16/10] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
        />
      )}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h3 className={cn(TYPE.cardTitle, "mb-2")}>{item.title}</h3>
        {item.client && (
          <p className="mb-4 text-sm text-muted-ink">{item.client}</p>
        )}
        <p className={cn(TYPE.body, "text-muted-ink")}>{item.summary}</p>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Write the section skeleton (temporary grid — Task 4 swaps in the carousel)**

Create `src/app/sections/Portfolio.tsx`:

```tsx
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import { PortfolioCard } from "../components/PortfolioCard";

export function Portfolio() {
  if (PORTFOLIO_ITEMS.length === 0) return null;

  return (
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      {/* Temporary grid — replaced by PortfolioCarousel in the next task. */}
      <div className="grid gap-6 md:grid-cols-3">
        {PORTFOLIO_ITEMS.map((item) => (
          <PortfolioCard key={item.title} item={item} onOpen={() => {}} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Mount the section in the app**

In `src/app/App.tsx`, add the import after the `Approach` import (line 5):

```tsx
import { Portfolio } from "./sections/Portfolio";
```

and add `<Portfolio />` between `<Approach />` and `<CTA />` inside `<main>`:

```tsx
          <main>
            <Hero />
            <Services />
            <Approach />
            <Portfolio />
            <CTA />
          </main>
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev` and open the printed localhost URL.
Check:
- A "Portfolio" heading styled like "Approach" appears between the Approach timeline and the CTA.
- Four cards render with gradient placeholder covers, titles, client lines, and summaries.
- Clicking "Portfolio" in the navbar smooth-scrolls to the section (nav link already existed).
- Cards lift slightly on hover; tabbing to a card shows the orange focus outline.

- [ ] **Step 5: Run the suite and commit**

Run: `node --test "src/app/**/*.test.ts"` — expected: PASS.

```bash
git add src/app/components/PortfolioCard.tsx src/app/sections/Portfolio.tsx src/app/App.tsx
git commit -m "feat: portfolio section skeleton with project cards"
```

---

### Task 4: Glide.js carousel with Instagram-style dots and swipe

**Files:**
- Create: `src/app/lib/use-glide.ts`
- Create: `src/app/components/PortfolioCarousel.tsx`
- Modify: `src/app/sections/Portfolio.tsx` (swap grid → carousel)
- Modify: `package.json` (via npm install)

**Interfaces:**
- Consumes: `PortfolioCard` (Task 3), `PortfolioItem` (Task 1), `usePrefersReducedMotion` from `src/app/lib/use-reduced-motion.ts`.
- Produces: `useGlide(slideCount: number, reducedMotion: boolean): { rootRef: RefObject<HTMLDivElement | null>; activeIndex: number; goTo: (index: number) => void }` and `PortfolioCarousel({ items, onOpen, reducedMotion }: { items: PortfolioItem[]; onOpen: (item: PortfolioItem) => void; reducedMotion: boolean })`. Task 5 passes a real `onOpen`.

- [ ] **Step 1: Install Glide.js**

```bash
npm install @glidejs/glide@3.7.1
npm install -D @types/glidejs__glide@3.6.6
```

Expected: both appear in `package.json`; no peer-dependency warnings.

- [ ] **Step 2: Write the Glide lifecycle hook**

Create `src/app/lib/use-glide.ts`:

```ts
import { useEffect, useRef, useState } from "react";
import Glide from "@glidejs/glide";

/**
 * Owns a Glide.js instance mounted on `rootRef` and mirrors the active slide
 * index into React state, so dot controls can be plain Tailwind-styled
 * buttons instead of Glide's CSS-class-driven bullets.
 */
export function useGlide(slideCount: number, reducedMotion: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glideRef = useRef<Glide | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || slideCount === 0) return;

    const glide = new Glide(root, {
      type: "carousel",
      perView: 3,
      gap: 24,
      // Glide's keyboard module listens document-wide and would hijack
      // arrow keys for the whole page; the dot buttons are the keyboard path.
      keyboard: false,
      animationDuration: reducedMotion ? 0 : 400,
      breakpoints: {
        1280: { perView: 2 },
        768: { perView: 1 },
      },
    });

    glide.on("run", () => setActiveIndex(glide.index));
    glide.mount();
    glideRef.current = glide;

    return () => {
      glide.destroy();
      glideRef.current = null;
    };
  }, [slideCount, reducedMotion]);

  const goTo = (index: number) => {
    glideRef.current?.go(`=${index}`);
  };

  return { rootRef, activeIndex, goTo };
}
```

- [ ] **Step 3: Write the carousel component**

Create `src/app/components/PortfolioCarousel.tsx`:

```tsx
import "@glidejs/glide/dist/css/glide.core.min.css";
import { cn } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";
import { useGlide } from "../lib/use-glide";
import { PortfolioCard } from "./PortfolioCard";

type PortfolioCarouselProps = {
  items: PortfolioItem[];
  onOpen: (item: PortfolioItem) => void;
  reducedMotion: boolean;
};

export function PortfolioCarousel({
  items,
  onOpen,
  reducedMotion,
}: PortfolioCarouselProps) {
  const { rootRef, activeIndex, goTo } = useGlide(items.length, reducedMotion);

  return (
    <div ref={rootRef} className="glide">
      <div className="glide__track" data-glide-el="track">
        {/* glide.core.css makes glide__slides a flex row, so slides stretch
            to equal height; the card fills it via h-full. */}
        <ul className="glide__slides">
          {items.map((item) => (
            <li key={item.title} className="glide__slide">
              <PortfolioCard item={item} onOpen={() => onOpen(item)} />
            </li>
          ))}
        </ul>
      </div>

      {/* Instagram-style dots: plain buttons driven by useGlide state. */}
      <div className="mt-10 flex justify-center gap-3">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show ${item.title}`}
            aria-current={index === activeIndex}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-6 bg-black"
                : "w-2 bg-black/20 hover:bg-black/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Swap the section's grid for the carousel**

Replace the full contents of `src/app/sections/Portfolio.tsx` with:

```tsx
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import { PortfolioCarousel } from "../components/PortfolioCarousel";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

export function Portfolio() {
  const reducedMotion = usePrefersReducedMotion();

  if (PORTFOLIO_ITEMS.length === 0) return null;

  return (
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      <PortfolioCarousel
        items={PORTFOLIO_ITEMS}
        onOpen={() => {}}
        reducedMotion={reducedMotion}
      />
    </section>
  );
}
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`
Check:
- Desktop (>1280px): three cards visible with 24px gaps; the carousel loops (dragging past the last card wraps to the first).
- Dots: one dot per project; the active dot is a stretched black pill; clicking a dot animates to that slide and the pill follows; hover dims inactive dots.
- Swipe/drag: mouse-drag on desktop and touch-swipe in devtools device mode both change slides, and the active dot tracks.
- Resize to ~1000px → two cards per view; below 768px → one card per view.
- Arrow keys do NOT move the carousel (keyboard hijack guard) and page scrolling stays normal.
- DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce": slide changes jump instantly (no 400ms glide) and Lenis smooth scroll is already off.
- No console errors (including on hot-reload, which exercises `glide.destroy()`).

- [ ] **Step 6: Run the suite and commit**

Run: `node --test "src/app/**/*.test.ts"` — expected: PASS.

```bash
git add package.json package-lock.json src/app/lib/use-glide.ts src/app/components/PortfolioCarousel.tsx src/app/sections/Portfolio.tsx
git commit -m "feat: glide.js portfolio carousel with dot navigation and swipe"
```

---

### Task 5: Detail modal (rich scrollable mini page)

**Files:**
- Create: `src/app/components/PortfolioModal.tsx`
- Modify: `src/app/sections/Portfolio.tsx` (selected-item state + modal)
- Modify: `src/styles/tailwind.css` (typography plugin)
- Modify: `package.json` (via npm install)

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription` from `src/app/components/ui/dialog.tsx` (existing shadcn/Radix); `PortfolioItem` (Task 1); `PortfolioCarousel` (Task 4).
- Produces: `PortfolioModal({ item, onClose }: { item: PortfolioItem | null; onClose: () => void })` — open when `item` is non-null.

- [ ] **Step 1: Install the markdown renderer and typography plugin**

```bash
npm install react-markdown@10.1.0
npm install -D @tailwindcss/typography
```

- [ ] **Step 2: Register the typography plugin**

In `src/styles/tailwind.css`, add one line after the existing imports so the file reads:

```css
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';

@import 'tw-animate-css';
@plugin '@tailwindcss/typography';
```

- [ ] **Step 3: Write the modal component**

Create `src/app/components/PortfolioModal.tsx`:

```tsx
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { cn, TYPE } from "../lib/layout";
import type { PortfolioItem } from "../data/portfolio";

type PortfolioModalProps = {
  /** The modal is open while this is non-null. */
  item: PortfolioItem | null;
  onClose: () => void;
};

export function PortfolioModal({ item, onClose }: PortfolioModalProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-card border-line p-0 sm:max-w-3xl">
        {item && (
          /* data-lenis-prevent: Lenis owns wheel events site-wide; without
             it the modal body cannot scroll independently of the page.
             Scrolling an inner div (not DialogContent) keeps the close X
             pinned while long content scrolls. */
          <div data-lenis-prevent className="max-h-[85vh] overflow-y-auto">
            {item.coverImage ? (
              <img
                src={item.coverImage}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="aspect-[21/9] w-full bg-gradient-to-br from-[#3c3c3c33] to-[#ffffff33]"
              />
            )}
            <article className="p-8 md:p-12">
              <DialogTitle className={cn(TYPE.cardTitle, "mb-1")}>
                {item.title}
              </DialogTitle>
              {item.client && (
                <p className="mb-4 text-sm text-muted-ink">{item.client}</p>
              )}
              <DialogDescription
                className={cn(TYPE.body, "mb-6 text-muted-ink")}
              >
                {item.summary}
              </DialogDescription>
              {item.tags.length > 0 && (
                <ul className="mb-8 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-line px-3 py-1 text-sm text-muted-ink"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown>{item.body}</ReactMarkdown>
              </div>
            </article>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Wire selection state into the section**

Replace the full contents of `src/app/sections/Portfolio.tsx` with:

```tsx
import { useState } from "react";
import { cn, CONTAINER, SECTION, TYPE } from "../lib/layout";
import { PORTFOLIO_ITEMS } from "../data/portfolio-items";
import type { PortfolioItem } from "../data/portfolio";
import { PortfolioCarousel } from "../components/PortfolioCarousel";
import { PortfolioModal } from "../components/PortfolioModal";
import { usePrefersReducedMotion } from "../lib/use-reduced-motion";

export function Portfolio() {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  if (PORTFOLIO_ITEMS.length === 0) return null;

  return (
    <section id="portfolio" className={cn(CONTAINER, SECTION.wrap)}>
      <h2 className={cn(TYPE.h2, SECTION.titleGap)}>Portfolio</h2>
      <PortfolioCarousel
        items={PORTFOLIO_ITEMS}
        onOpen={setSelected}
        reducedMotion={reducedMotion}
      />
      <PortfolioModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`
Check:
- Clicking any card opens the modal with that project's cover area, title, client, summary, tag pills, and the markdown body rendered with real headings/lists (typography plugin working — `## The problem` renders as a styled heading, the bullet list in the first project renders as a list).
- The modal body scrolls with the mouse wheel while the page behind stays put (`data-lenis-prevent` working); the close X stays pinned top-right while scrolling.
- Esc, the X button, and clicking the overlay all close the modal; focus returns to the card that opened it (Radix default).
- On a ~375px viewport the modal fits with a 1rem margin and still scrolls.
- A card click after swiping does not misfire (drag vs click: Glide's `dragThreshold` swallows drags, click fires only on a clean tap) — verify by dragging across a card, releasing, and confirming no modal opened.

- [ ] **Step 6: Build check, suite, commit**

Run: `npm run build` — expected: success.
Run: `node --test "src/app/**/*.test.ts"` — expected: PASS.

```bash
git add package.json package-lock.json src/styles/tailwind.css src/app/components/PortfolioModal.tsx src/app/sections/Portfolio.tsx
git commit -m "feat: portfolio detail modal with markdown body"
```

---

### Task 6: Sveltia CMS admin (skip or swap per the CMS decision above)

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`
- Create: `docs/cms.md`

**Interfaces:**
- Consumes: the content shape from Task 1/2 — the `config.yml` fields MUST stay in sync with `PortfolioItem` and the seed JSON (field names: `title`, `client`, `summary`, `coverImage`, `tags`, `order`, `draft`, `body`).
- Produces: an admin UI at `/admin/index.html` editing `src/content/portfolio/*.json` and uploading images to `public/images/portfolio/`.

- [ ] **Step 1: Create the admin page**

Create `public/admin/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nalar Content Manager</title>
  </head>
  <body>
    <!-- Sveltia CMS. Decap-compatible: to switch to Decap CMS, replace this
         script with https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js -->
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create the collection config**

Create `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: Nalar-Labs/landing-v2
  branch: main

# Uploaded images land in the repo and are served by Vite from /images/...
media_folder: public/images/portfolio
public_folder: /images/portfolio

collections:
  - name: portfolio
    label: Portfolio
    folder: src/content/portfolio
    format: json
    extension: json
    create: true
    identifier_field: title
    summary: "{{title}} — {{client}}"
    sortable_fields: [order, title]
    fields:
      - { name: title, label: Title, widget: string }
      - { name: client, label: Client, widget: string, required: false }
      - { name: summary, label: Summary, widget: text, hint: "One sentence shown on the card and at the top of the popup." }
      - { name: coverImage, label: Cover image, widget: image, required: false }
      - { name: tags, label: Tags, widget: list, required: false, default: [] }
      - { name: order, label: Order, widget: number, value_type: int, default: 0, hint: "Carousel position, lowest first. Keep unique." }
      - { name: draft, label: Draft, widget: boolean, default: false, hint: "Drafts are hidden from the site." }
      - { name: body, label: Body, widget: markdown, hint: "The popup page content. Headings, lists, links, and images all work." }
```

- [ ] **Step 3: Write the editor guide**

Create `docs/cms.md`:

```markdown
# Editing portfolio content

Portfolio projects are JSON files in `src/content/portfolio/` — one file per
project. They are edited through Sveltia CMS, a git-based CMS: saving in the
CMS writes these files; publishing is a normal git commit + push + deploy.

## Local editing (no setup required)

1. `npm run dev`
2. Open http://localhost:5173/admin/index.html in Chrome or Edge
   (the local workflow uses the File System Access API, which Firefox and
   Safari don't support).
3. Click **Work with Local Repository** and select the repo folder.
4. Edit / add projects. Saving writes the JSON files to disk.
5. Review with `git diff`, then commit and push to publish.

Field notes:
- **Order** controls carousel position (lowest first) and must be unique.
- **Draft** hides an item from the site without deleting it.
- **Body** is the popup's content (markdown).
- Required fields (title, summary, body) must be non-empty — an invalid
  file fails the build on purpose rather than silently dropping the item.

## Editing from the deployed site (optional, not yet set up)

To let someone edit at https://<site>/admin/ without cloning the repo, the
GitHub backend needs OAuth:

1. Deploy https://github.com/sveltia/sveltia-cms-auth to Cloudflare Workers
   (free tier is fine).
2. Register a GitHub OAuth app and give its credentials to the Worker.
3. Add `base_url: https://<worker-url>` under `backend:` in
   `public/admin/config.yml`.

Until then, `/admin/` on the deployed site will show a GitHub sign-in that
cannot complete — that is expected.
```

- [ ] **Step 4: Verify the CMS end-to-end locally**

Run: `npm run dev`, then in Chrome or Edge open `http://localhost:5173/admin/index.html`.
Check:
- The Sveltia UI loads with a "Portfolio" collection listing the 4 seed projects (title — client summaries).
- "Work with Local Repository" → select the repo folder → open "Internal Ops Dashboard", change the summary, save. Confirm `git diff src/content/portfolio/internal-ops-dashboard.json` shows exactly that change, and the running site hot-reloads with the new summary.
- Revert the test edit: `git checkout -- src/content/portfolio/internal-ops-dashboard.json`.
- Create a new entry with Draft = true, save, confirm a new JSON file appears and the site does NOT show it; then delete the entry from the CMS (or `rm` the file) to leave the tree clean.
- Run `node --test "src/app/**/*.test.ts"` — expected: PASS (content guards still hold).

- [ ] **Step 5: Commit**

```bash
git add public/admin docs/cms.md
git commit -m "feat: sveltia cms admin for portfolio content"
```

---

## Final verification (after all tasks)

- [ ] `node --test "src/app/**/*.test.ts"` — all tests pass.
- [ ] `npm run build` — production build succeeds; `npx vite preview` and spot-check the portfolio section (carousel, dots, swipe, modal, `/admin/index.html` loads).
- [ ] Full manual pass on the dev server: navbar → Portfolio anchor, carousel at 3 breakpoints, dots, swipe, modal open/scroll/close, reduced-motion emulation.
- [ ] Use superpowers:verification-before-completion, then superpowers:requesting-code-review / superpowers:finishing-a-development-branch to integrate.

## Execution notes

- **Branch:** the working tree currently has uncommitted scroll/hero changes on `feat/scroll-hero-animations`. Land or stash that work first, then create `feat/portfolio-section` off the up-to-date main branch before starting Task 1.
- **Deploy/production CMS auth** is intentionally out of scope (Task 6 documents it as a manual follow-up) because the hosting platform isn't captured in the repo.
