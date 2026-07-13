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
