import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const releaseScript = fileURLToPath(
  new URL("../../scripts/check-release.mjs", import.meta.url),
);

const validSiteUrl = "https://alune.dev";
const validEmail = "hello@alune.dev";

function entry(
  frontmatter: string = "draft: false",
  body = "Published content.",
) {
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

type FixtureOptions = {
  email?: string;
  files?: Record<string, string>;
  siteUrl?: string;
};

async function withFixture(
  options: FixtureOptions,
  callback: (root: string) => void | Promise<void>,
) {
  const root = await mkdtemp(path.join(tmpdir(), "alune-release-"));
  const files = {
    "src/config/site.config.json": JSON.stringify(
      {
        placeholder: false,
        siteUrl: options.siteUrl ?? validSiteUrl,
        author: {
          name: "Alune",
          email: options.email ?? validEmail,
        },
      },
      null,
      2,
    ),
    "src/content/studio/visible.md": entry(),
    "src/content/journal/visible.md": entry(),
    ...options.files,
  };

  try {
    for (const [relative, contents] of Object.entries(files)) {
      const destination = path.join(root, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, contents);
    }
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function runRelease(root: string) {
  const result = spawnSync(process.execPath, [releaseScript], {
    cwd: root,
    encoding: "utf8",
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

describe("check-release", () => {
  it("reads draft only from boolean YAML frontmatter", async () => {
    await withFixture(
      {
        files: {
          "src/content/studio/commented-draft.md": entry(
            "draft: true # private",
            "TODO",
          ),
          "src/content/studio/bom-draft.md": `\uFEFF${entry(
            "draft: true",
            "TODO",
          )}`,
          "src/content/journal/body-draft-marker.md": entry(
            "draft: false",
            "Published content.\ndraft: true\nTODO",
          ),
        },
      },
      (root) => {
        const result = runRelease(root);

        expect(result.status).toBe(1);
        expect(result.output).toContain(
          "Replace TODO in published journal entry body-draft-marker.md.",
        );
        expect(result.output).not.toContain("commented-draft.md");
        expect(result.output).not.toContain("bom-draft.md");
      },
    );
  });

  it("matches Astro's case-sensitive, dot-excluding markdown glob", async () => {
    const placeholderFiles = [
      ".hidden.md",
      ".private/nested.md",
      "UPPER.MD",
      "UPPER.MDX",
    ];
    const files = Object.fromEntries(
      placeholderFiles.map((relative) => [
        `src/content/studio/${relative}`,
        entry("draft: false", "TODO"),
      ]),
    );

    await withFixture({ files }, (root) => {
      const result = runRelease(root);

      expect(result.status).toBe(0);
      expect(result.output).toContain(
        "Release metadata and minimum content checks passed.",
      );
    });
  });

  it("checks underscore-prefixed entries that Astro includes", async () => {
    await withFixture(
      {
        files: {
          "src/content/studio/_private.md": entry("draft: false", "TODO"),
          "src/content/studio/_group/nested.md": entry("draft: false", "TODO"),
        },
      },
      (root) => {
        const result = runRelease(root);

        expect(result.status).toBe(1);
        expect(result.output).toContain(
          "Replace TODO in published studio entry _private.md.",
        );
        expect(result.output).toContain(
          `Replace TODO in published studio entry _group${path.sep}nested.md.`,
        );
      },
    );
  });

  const reservedHostCases = [
    {
      siteUrl: "https://example.com.",
      email: validEmail,
      expected: "siteUrl",
    },
    {
      siteUrl: "https://localhost.",
      email: validEmail,
      expected: "siteUrl",
    },
    {
      siteUrl: "https://preview.localhost.",
      email: validEmail,
      expected: "siteUrl",
    },
    {
      siteUrl: "https://portfolio.example.com.",
      email: validEmail,
      expected: "siteUrl",
    },
    {
      siteUrl: validSiteUrl,
      email: "hello@example.com.",
      expected: "placeholder contact email",
    },
    {
      siteUrl: validSiteUrl,
      email: "hello@example.com。",
      expected: "placeholder contact email",
    },
    {
      siteUrl: validSiteUrl,
      email: "hello@localhost.",
      expected: "placeholder contact email",
    },
  ] as const;

  it.each(reservedHostCases)(
    "rejects trailing-dot reserved hosts in site and email metadata",
    async ({ siteUrl, email, expected }) => {
      await withFixture({ siteUrl, email }, (root) => {
        const result = runRelease(root);

        expect(result.status).toBe(1);
        expect(result.output).toContain(expected);
      });
    },
  );
});
