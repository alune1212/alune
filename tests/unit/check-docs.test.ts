import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import {
  createLineNumberLookup,
  markdownLinks,
} from "../../scripts/check-docs-utils.mjs";

describe("documentation link extraction", () => {
  it("preserves inline, image, angle-bracket, and reference link targets and lines", () => {
    const source = [
      "# Links",
      "",
      '[inline](docs/development.md "title")',
      "![image](assets/logo.svg)",
      "[spaced](<path with spaces.md>)",
      "",
      "[reference]: <docs/content-guide.md>",
    ].join("\n");

    expect(markdownLinks(source)).toEqual([
      { target: "docs/development.md", line: 3 },
      { target: "assets/logo.svg", line: 4 },
      { target: "path with spaces.md", line: 5 },
      { target: "docs/content-guide.md", line: 7 },
    ]);
  });

  it.each(["\n", "\r\n"])(
    "keeps reference definitions on their own line with %j endings",
    (newline) => {
      const lines = [
        "",
        "[zero]: zero.md",
        " [one]: one.md",
        "  [two]: two.md",
        "   [three]: three.md",
        "    [four]: four.md",
      ];

      expect(markdownLinks(lines.join(newline))).toEqual([
        { target: "zero.md", line: 2 },
        { target: "one.md", line: 3 },
        { target: "two.md", line: 4 },
        { target: "three.md", line: 5 },
      ]);
    },
  );

  it("handles 20,000 links within a bounded line-lookup budget", () => {
    const linkCount = 20_000;
    const source = Array.from(
      { length: linkCount },
      (_, index) => `[link ${index}](target-${index}.md)`,
    ).join("\n");
    const startedAt = performance.now();

    const links = markdownLinks(source);
    const elapsed = performance.now() - startedAt;

    expect(links).toHaveLength(linkCount);
    expect(links.at(-1)).toEqual({
      target: "target-19999.md",
      line: linkCount,
    });
    expect(elapsed).toBeLessThan(2_000);
  }, 15_000);

  it("keeps a long single-line document on line one", () => {
    const source = `${"x".repeat(1_000_000)}[link](target.md)`;
    const lineNumberAt = createLineNumberLookup(source);

    expect(lineNumberAt(0)).toBe(1);
    expect(lineNumberAt(source.length - 1)).toBe(1);
    expect(markdownLinks(source)).toEqual([{ target: "target.md", line: 1 }]);
  });
});
