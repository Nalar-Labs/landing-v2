// Pure logic for the quote form. The dialog itself is manual-verify only,
// per repo convention.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_FILE_BYTES,
  MAX_TOTAL_FILE_BYTES,
  normaliseLink,
  snapshotOutcome,
  submitQuote,
  validateQuoteDraft,
  type QuoteDraft,
} from "./quote.ts";
import { calculateRoi } from "./roi.ts";

const validDraft: QuoteDraft = {
  description: "An internal workflow tool replacing three spreadsheets.",
  email: "ops@example.com",
  links: ["https://example.com/brief", ""],
  fileSizes: [1024],
};

test("a complete draft validates clean", () => {
  assert.deepEqual(validateQuoteDraft(validDraft), []);
});

test("description and email are required", () => {
  const problems = validateQuoteDraft({ ...validDraft, description: "  ", email: "nope" });
  assert.equal(problems.length, 2);
});

test("normaliseLink assumes https and keeps real URLs", () => {
  assert.equal(normaliseLink("figma.com/file/abc"), "https://figma.com/file/abc");
  assert.equal(normaliseLink("https://example.com/x"), "https://example.com/x");
  assert.equal(normaliseLink("  "), null);
});

test("normaliseLink refuses non-web schemes rather than shipping them to a sheet", () => {
  assert.equal(normaliseLink("javascript:alert(1)"), null);
  assert.equal(normaliseLink("ftp://example.com"), null);
});

test("a garbled link row is an error, not a silent drop", () => {
  const problems = validateQuoteDraft({ ...validDraft, links: ["ht tp://???"] });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /link/i);
});

test("blank link rows are not errors", () => {
  assert.deepEqual(validateQuoteDraft({ ...validDraft, links: ["", "  "] }), []);
});

test("file size guards: per-file and total", () => {
  const perFile = validateQuoteDraft({ ...validDraft, fileSizes: [MAX_FILE_BYTES + 1] });
  assert.equal(perFile.length, 1);
  const total = validateQuoteDraft({
    ...validDraft,
    fileSizes: [MAX_FILE_BYTES, MAX_FILE_BYTES, MAX_TOTAL_FILE_BYTES],
  });
  assert.ok(total.length >= 1);
});

test("snapshotOutcome keeps headline figures and drops internals", () => {
  const outcome = calculateRoi({
    selectedAppIds: ["workflow"],
    employees: 100,
    paysForSoftware: true,
    currentMonthlySpend: 600,
    externalUsers: 0,
  });
  const snapshot = snapshotOutcome(outcome);
  assert.ok(snapshot);
  assert.equal(snapshot.tier, "Medium");
  assert.equal(typeof snapshot.newMonthly, "number");
  // buildCost is quoting-internal and must not ride along to the sheet.
  assert.ok(!("buildCost" in snapshot));
  assert.equal(snapshotOutcome(null), null);
});

test("submitQuote without a configured endpoint fails gracefully, not loudly", async () => {
  const result = await submitQuote(
    {
      description: "x",
      links: [],
      email: "a@b.co",
      name: "",
      company: "",
      files: [],
      roi: { inputs: { selectedAppIds: [], employees: 0, paysForSoftware: false, currentMonthlySpend: 0, externalUsers: 0 }, outcome: null },
      submittedAt: "2026-08-16T00:00:00.000Z",
    },
    "",
  );
  assert.deepEqual(result, { ok: false, reason: "not-configured" });
});
