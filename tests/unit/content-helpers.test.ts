import { describe, expect, it } from "vitest";

import {
  assertValidReferences,
  filterDrafts,
  sortByPublishedDate,
  sortByFeaturedAndDate,
} from "../../src/lib/content";

function entry(id: string, data: Record<string, unknown>) {
  return { id, data } as { id: string; data: typeof data };
}

describe("content helpers", () => {
  it("filters drafts only for production and never mutates input", () => {
    const entries = [
      entry("draft", { draft: true }),
      entry("public", { draft: false }),
    ];
    expect(
      filterDrafts(entries, { production: true }).map(({ id }) => id),
    ).toEqual(["public"]);
    expect(
      filterDrafts(entries, { production: false }).map(({ id }) => id),
    ).toEqual(["draft", "public"]);
    expect(entries.map(({ id }) => id)).toEqual(["draft", "public"]);
  });

  it("sorts featured content before ordered and newly dated content", () => {
    const entries = [
      entry("old", {
        featured: false,
        order: 0,
        publishedAt: new Date("2026-01-01"),
      }),
      entry("featured", {
        featured: true,
        order: 99,
        publishedAt: new Date("2025-01-01"),
      }),
      entry("new", {
        featured: false,
        order: 0,
        publishedAt: new Date("2026-02-01"),
      }),
    ];
    expect(sortByFeaturedAndDate(entries).map(({ id }) => id)).toEqual([
      "featured",
      "new",
      "old",
    ]);
  });

  it("keeps Journal entries chronological regardless of editorial flags", () => {
    const entries = [
      entry("older-featured", {
        featured: true,
        order: -10,
        publishedAt: new Date("2026-01-01"),
      }),
      entry("newer", {
        featured: false,
        order: 99,
        publishedAt: new Date("2026-02-01"),
      }),
    ];

    expect(sortByPublishedDate(entries).map(({ id }) => id)).toEqual([
      "newer",
      "older-featured",
    ]);
  });

  it("reports references missing from Astro entry IDs", () => {
    const source = [entry("project", { relatedJournal: ["missing"] })];
    const target = [entry("journal", {})];
    expect(() =>
      assertValidReferences(source, target, "relatedJournal"),
    ).toThrow(/missing/);
  });
});
