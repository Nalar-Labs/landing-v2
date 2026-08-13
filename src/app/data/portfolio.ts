// Portfolio content model. Pure logic only — no Vite APIs — so it runs under
// node --test like the other data modules. The matching Vite loader lives in
// portfolio-items.ts.

import { parseVideoSource } from "../lib/video-source.ts";

export type PortfolioItem = {
  title: string;
  /** Client or company name shown under the title. */
  client?: string;
  /** One-liner shown on the card and as the modal intro. */
  summary: string;
  /** Path under public/, e.g. "/images/portfolio/foo.jpg". Cards render a gradient placeholder when absent. */
  coverImage?: string;
  /** Path under public/, e.g. "/images/portfolio/logos/company.png". Displayed in top-left corner. */
  logo?: string;
  /** External video URL (YouTube/Vimeo). Never a local file — see docs/PRDs. */
  video?: string;
  /** Extra images shown after the video in the modal gallery. */
  gallery: string[];
  tags: string[];
  /** Carousel position, ascending. */
  order: number;
  /** Markdown, rendered inside the detail modal. */
  body: string;
};

function labelOf(record: Record<string, unknown>): string {
  return typeof record.title === "string" && record.title.trim() !== ""
    ? record.title
    : "(untitled)";
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Portfolio item "${labelOf(record)}": missing required field "${key}"`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  // The CMS writes "" when a field is cleared; treat that as absent.
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function tagsOf(record: Record<string, unknown>): string[] {
  const value = record.tags;
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error(`Portfolio item "${labelOf(record)}": "tags" must be an array of strings`);
  }
  return value as string[];
}

function videoOf(record: Record<string, unknown>): string | undefined {
  const value = optionalString(record, "video");
  if (value === undefined) return undefined;
  if (parseVideoSource(value) === null) {
    throw new Error(
      `Portfolio item "${labelOf(record)}": "video" must be a YouTube or Vimeo URL ` +
        `(got "${value}"). Videos are hosted externally — upload to YouTube/Vimeo ` +
        `and paste the link.`,
    );
  }
  return value;
}

function galleryOf(record: Record<string, unknown>): string[] {
  const value = record.gallery;
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    // Gallery entries land directly in <img src>. An absolute third-party
    // URL is not an XSS risk there, but it is an uncontrolled outbound
    // request to whatever host is named — require site-relative paths, same
    // as how strictly `video` is validated.
    value.some((entry) => typeof entry !== "string" || !entry.startsWith("/"))
  ) {
    throw new Error(
      `Portfolio item "${labelOf(record)}": "gallery" must be an array of site-relative image paths (starting with "/")`,
    );
  }
  return value as string[];
}

function orderOf(record: Record<string, unknown>): number {
  const value = record.order;
  if (value === undefined) return 0;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Portfolio item "${labelOf(record)}": "order" must be a number`);
  }
  return value;
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
      logo: optionalString(record, "logo"),
      video: videoOf(record),
      gallery: galleryOf(record),
      tags: tagsOf(record),
      order: orderOf(record),
      body: requireString(record, "body"),
    });
  }
  return items.sort((a, b) => a.order - b.order);
}
