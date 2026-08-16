# Plan — "Get Accurate Quote" form

Status: **PENDING** — decisions below, built same day at owner's direction;
review the open items in §6 before flipping to DEVELOPED.
Last updated 2026-08-16.

Goal: the calculator produces an estimate; this form converts the estimate into
a real quote request — with enough context (description, links, files, and the
visitor's calculator state) that the first reply can already be substantive.

---

## 1. Placement and hierarchy

A **"Get Accurate Quote"** button sits beside **"Book a call"** in the result
panel, visible once an outcome is rendered.

- Book a call stays the single orange primary (design system: one accent per
  view). The quote button is **ink** (black pill) — a strong secondary, not a
  competing primary.
- Clicking opens a modal dialog (existing shadcn/Radix `Dialog` primitive).

## 2. Fields

| Field | Required | Notes |
|---|---|---|
| Describe what you want to build | **Yes** | Textarea, the heart of the request |
| Links | No | Repeatable rows; `https://` assumed when scheme omitted; must parse as a URL |
| Files | No | Multiple; ≤ 5 MB each, ≤ 10 MB total (Apps Script POST limit head-room) |
| Email | **Yes** | A quote needs a reply address |
| Name, Company | No | The "optional form fields" |

**Interpretation note.** The owner's spec listed "Optional Form Fields" as item
4 without naming them; chosen here: name + company optional, email required.
Revisit if the owner meant something else.

**Calculator snapshot rides along automatically** (owner requirement): the
selected apps, employees/users, spend, and the computed outcome (tier, months,
run cost, headline figures). The visitor does not re-type what the calculator
already knows, and the reply can reference their exact scenario.

## 3. Backend: Google Apps Script, not a form SaaS

**Decision.** Submissions POST to a **Google Apps Script Web App** bound to a
Google Sheet owned by the company email (account being created by the owner):

- appends one row per submission to the sheet,
- saves uploads into a Drive folder, links them from the row,
- emails the company address via `MailApp`,
- costs nothing and is owned outright — which is literally this company's pitch.

The endpoint URL is a constant (`QUOTE_ENDPOINT` in `src/app/data/quote.ts`),
empty until the account exists. While empty, submission fails gracefully with
an on-brand message and the payload logged to the console for debugging.
Setup steps + paste-ready script: [`docs/quote-endpoint-setup.md`](../quote-endpoint-setup.md).

**CORS.** The POST is sent as `text/plain` so the browser skips preflight
(Apps Script cannot answer OPTIONS); the script parses `e.postData.contents`.

**Rejected — Formspree/Basin/Tally.** Faster, but a monthly fee, a third party
holding lead data, and exactly the SaaS dependence the landing page argues
against. **Rejected — own backend.** There is no server in this project and a
quote form does not justify one.

## 4. Dialog behaviour

- Form state resets **when the dialog opens**, not on close — Radix keeps the
  tree mounted ~200 ms after close (repo gotcha), so close-time resets flash.
- Submit: validate → encode files to base64 → POST → success state inside the
  dialog (green check + "we'll get back to you"), or inline error with the
  payload preserved for retry.
- Errors listed above the submit button, fields marked; focus jumps to the
  first invalid field.

## 5. Testing

Pure logic in `src/app/data/quote.ts` (link normalisation, validation, size
guards, payload shape) is covered by `quote.test.ts` under `node --test`.
Dialog interaction is manual-only, per repo convention.

## 6. Open before DEVELOPED

- [ ] Company Google account created; sheet + script deployed; real
      `QUOTE_ENDPOINT` pasted in.
- [ ] Owner confirms the optional-field interpretation (§2).
- [ ] End-to-end test against the real sheet (row lands, email arrives,
      files in Drive).
