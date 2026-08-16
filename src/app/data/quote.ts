// "Get Accurate Quote" form: pure logic + submission. UI lives in
// components/QuoteDialog.tsx. Everything here must run under `node --test`
// (no Vite APIs, no React) — see quote.test.ts.
import type { RoiInputs, RoiOutcome } from "./roi.ts";

/**
 * Google Apps Script Web App URL — the sheet + notification email backend.
 * Empty until the company Google account exists; while empty, submitQuote
 * fails gracefully and logs the payload instead of sending it.
 * Setup steps: docs/quote-endpoint-setup.md.
 */
export const QUOTE_ENDPOINT = "";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_FILE_BYTES = 10 * 1024 * 1024;

export type QuoteFilePayload = {
  name: string;
  type: string;
  size: number;
  /** Content encoded for transport; Apps Script decodes into Drive. */
  base64: string;
};

/** The calculator state that rides along with every quote request. */
export type RoiSnapshot = {
  inputs: RoiInputs;
  outcome: {
    mode: RoiOutcome["mode"];
    tier: RoiOutcome["tier"];
    buildMonths: number;
    newMonthly: number;
    percentOfAgency: number | null;
  } | null;
};

export type QuotePayload = {
  description: string;
  links: string[];
  email: string;
  name: string;
  company: string;
  files: QuoteFilePayload[];
  roi: RoiSnapshot;
  submittedAt: string;
};

/**
 * Trim link rows, drop empties, and assume https:// when the visitor omitted
 * the scheme ("figma.com/file/x" is a link, not an error). Returns null for
 * a row that still fails to parse — the caller reports it, never drops it
 * silently.
 */
export function normaliseLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    // Only web links make sense here; a "javascript:" row must not survive
    // normalisation and land in a sheet cell someone might click.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export type QuoteDraft = {
  description: string;
  email: string;
  /** Raw link rows as typed, including blanks. */
  links: string[];
  /** Sizes in bytes of the chosen files, in order. */
  fileSizes: number[];
};

/**
 * Human-readable problems with a draft, empty when submittable. Blank link
 * rows are fine (the visitor just never used them); a non-blank row that
 * cannot become a URL is an error rather than a silent drop.
 */
export function validateQuoteDraft(draft: QuoteDraft): string[] {
  const problems: string[] = [];

  if (draft.description.trim() === "") {
    problems.push("Tell us what you want to build.");
  }
  // Deliberately loose: verifying deliverability is the backend's job; this
  // only catches "not an email at all".
  if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
    problems.push("A valid email is needed so we can send the quote back.");
  }
  const badLinks = draft.links.filter(
    (link) => link.trim() !== "" && normaliseLink(link) === null,
  );
  if (badLinks.length > 0) {
    problems.push(`This link doesn't look right: ${badLinks[0].trim()}`);
  }
  if (draft.fileSizes.some((size) => size > MAX_FILE_BYTES)) {
    problems.push("Each file must be 5 MB or smaller.");
  }
  const total = draft.fileSizes.reduce((sum, size) => sum + size, 0);
  if (total > MAX_TOTAL_FILE_BYTES) {
    problems.push("All files together must stay under 10 MB.");
  }
  return problems;
}

/** The outcome fields worth sending — headline numbers, not internals. */
export function snapshotOutcome(outcome: RoiOutcome | null): RoiSnapshot["outcome"] {
  if (outcome === null) return null;
  return {
    mode: outcome.mode,
    tier: outcome.tier,
    buildMonths: outcome.buildMonths,
    newMonthly: outcome.newMonthly,
    percentOfAgency: outcome.percentOfAgency,
  };
}

export type SubmitResult = { ok: true } | { ok: false; reason: "not-configured" | "network" };

/**
 * POST as text/plain: Apps Script cannot answer a CORS preflight, and a
 * text/plain body doesn't trigger one. The script JSON-parses
 * `e.postData.contents` on its side.
 */
export async function submitQuote(
  payload: QuotePayload,
  endpoint: string = QUOTE_ENDPOINT,
): Promise<SubmitResult> {
  if (endpoint === "") {
    // Backend not wired up yet (see QUOTE_ENDPOINT doc comment). Log so a
    // developer testing the flow can see exactly what would have been sent.
    console.warn("Quote endpoint not configured; payload:", payload);
    return { ok: false, reason: "not-configured" };
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return response.ok ? { ok: true } : { ok: false, reason: "network" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
