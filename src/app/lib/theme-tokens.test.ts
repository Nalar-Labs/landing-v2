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
