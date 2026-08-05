import { describe, expect, it } from "vitest";

import {
  journalSchema,
  pagesSchema,
  studioSchema,
} from "../../src/lib/content";

const shared = {
  title: "A stable title",
  summary: "A useful summary",
  draft: false,
  publishedAt: "2026-01-01",
  updatedAt: "2026-01-02",
  featured: false,
  order: 0,
  topics: ["web"],
  status: "active",
  relatedJournal: [],
};

describe("content collection schemas", () => {
  it("validates each strict studio discriminator and its links", () => {
    expect(
      studioSchema.safeParse({
        ...shared,
        kind: "tool",
        links: { launch: "https://example.com/tool" },
      }).success,
    ).toBe(true);

    expect(
      studioSchema.safeParse({
        ...shared,
        kind: "open-source",
        links: { source: "https://github.com/example/tool" },
      }).success,
    ).toBe(true);

    expect(
      studioSchema.safeParse({
        ...shared,
        kind: "tool",
        links: { source: "https://github.com/example/tool" },
      }).success,
    ).toBe(false);
  });

  it("allows HTTPS and local HTTP links but rejects executable protocols", () => {
    for (const launch of [
      "https://example.com/tool",
      "http://localhost:4321/tool",
      "http://127.0.0.1:4321/tool",
    ]) {
      expect(
        studioSchema.safeParse({
          ...shared,
          kind: "tool",
          links: { launch },
        }).success,
      ).toBe(true);
    }

    for (const launch of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "ftp://example.com/tool",
      "http://example.com/tool",
    ]) {
      expect(
        studioSchema.safeParse({
          ...shared,
          kind: "tool",
          links: { launch },
        }).success,
      ).toBe(false);
    }
  });

  it("rejects unknown frontmatter and duplicate stable references", () => {
    const result = studioSchema.safeParse({
      ...shared,
      kind: "project",
      links: {},
      relatedJournal: ["journal-one", "journal-one"],
      unexpected: true,
    });
    expect(result.success).toBe(false);
  });

  it("provides safe defaults and rejects stale dates", () => {
    const result = studioSchema.safeParse({
      title: "A project",
      summary: "Summary",
      kind: "project",
      status: "active",
      links: {},
      publishedAt: "2026-02-01",
      updatedAt: "2026-01-01",
    });
    expect(result.success).toBe(false);

    const parsed = journalSchema.parse({
      title: "A note",
      summary: "Summary",
      kind: "note",
      publishedAt: "2026-01-01",
    });
    expect(parsed.draft).toBe(false);
    expect(parsed.topics).toEqual([]);
    expect(parsed.relatedStudio).toEqual([]);
  });

  it("requires accessible, safe Journal cover metadata", () => {
    const entry = {
      title: "A visual note",
      summary: "Summary",
      kind: "note",
      publishedAt: "2026-01-01",
    };

    expect(
      journalSchema.safeParse({
        ...entry,
        cover: "/images/visual-note.webp",
        coverAlt: "A diagram connecting three ideas",
      }).success,
    ).toBe(true);
    expect(
      journalSchema.safeParse({
        ...entry,
        cover: "/images/visual-note.webp",
      }).success,
    ).toBe(false);
    expect(
      journalSchema.safeParse({
        ...entry,
        cover: "javascript:alert(1)",
        coverAlt: "Unsafe cover",
      }).success,
    ).toBe(false);
    expect(
      journalSchema.safeParse({
        ...entry,
        coverAlt: "Missing cover",
      }).success,
    ).toBe(false);
  });

  it("keeps pages smaller than studio and journal entries", () => {
    const parsed = pagesSchema.parse({
      kind: "about",
      title: "About",
      summary: "Summary",
      updatedAt: "2026-01-02",
    });
    expect(parsed.draft).toBe(false);
    expect(pagesSchema.safeParse({ ...parsed, extra: true }).success).toBe(
      false,
    );
    expect(
      pagesSchema.safeParse({
        kind: "about",
        title: "About",
        summary: "Summary",
      }).success,
    ).toBe(false);
  });
});
