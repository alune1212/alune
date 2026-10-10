import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

function fixedPage(kind = "about", draft = false, body = "A complete page.") {
  return entry(
    `kind: ${kind}\ntitle: About this site\nsummary: A complete page.\nupdatedAt: 2026-08-07\ndraft: ${draft}`,
    body,
  );
}

type FixtureOptions = {
  authorName?: string;
  email?: string;
  files?: Record<string, string>;
  omitCollection?: "studio" | "journal";
  placeholder?: boolean;
  siteUrl?: string;
  config?: Record<string, unknown>;
};

async function withFixture(
  options: FixtureOptions,
  callback: (root: string) => void | Promise<void>,
) {
  const root = await mkdtemp(path.join(tmpdir(), "alune-release-"));
  const files = {
    "src/config/site.config.json": JSON.stringify(
      {
        placeholder: options.placeholder ?? false,
        siteUrl: options.siteUrl ?? validSiteUrl,
        name: "ALUNE",
        title: "ALUNE Test Site",
        description: "A complete release fixture.",
        locale: "zh-CN",
        author: {
          name: options.authorName ?? "Alune",
          email: options.email ?? validEmail,
        },
        hero: {
          eyebrow: "Test",
          title: "Test site",
          summary: "Complete fixture.",
        },
        about: { lead: "About", body: "About this fixture." },
        now: { updatedAt: "2026-08-07", summary: "Testing release readiness." },
        socials: [],
        ...options.config,
      },
      null,
      2,
    ),
    "src/content/studio/visible.md": entry(
      "title: Studio\nsummary: Published studio.\nkind: experiment\nstatus: active\nlinks: {}\nrelatedJournal: []\ndraft: false",
    ),
    "src/content/journal/visible.md": entry(
      "title: Journal\nsummary: Published journal.\nkind: note\nrelatedStudio: []\npublishedAt: 2026-08-07\ndraft: false",
    ),
    ...options.files,
  };
  if (options.omitCollection) {
    delete files[`src/content/${options.omitCollection}/visible.md`];
  }

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
  it("accepts a complete non-placeholder fixture", async () => {
    await withFixture({}, (root) => {
      const result = runRelease(root);
      expect(result.status).toBe(0);
      expect(result.output).toContain(
        "Release metadata and minimum content checks passed.",
      );
    });
  });

  it.each(["eyebrow", "title", "summary"])(
    "rejects a placeholder hero.%s",
    async (field) => {
      await withFixture(
        {
          config: {
            hero: {
              eyebrow: "Test",
              title: "Test site",
              summary: "Complete fixture.",
              [field]: "待补充",
            },
          },
        },
        (root) => {
          const result = runRelease(root);
          expect(result.status).toBe(1);
          expect(result.output).toContain(`site config hero.${field}`);
        },
      );
    },
  );

  it.each([
    [
      "hero",
      {
        eyebrow: "Test",
        title: "Test",
        summary: "第一版定义了系统，最终的故事仍待你书写。",
      },
      "hero.summary",
    ],
    [
      "about",
      {
        lead: "这里留给你的故事、原则，以及串联工作的线索。",
        body: "A complete story.",
      },
      "about.lead",
    ],
    ["about", { lead: "About", body: "请替换这段临时文案。" }, "about.body"],
    [
      "now",
      {
        updatedAt: "2026-08-07",
        summary: "网站基础正在成形，内容与品牌语言将在之后展开。",
      },
      "now.summary",
    ],
  ])("rejects existing scaffold copy in %s", async (section, value, field) => {
    await withFixture({ config: { [section]: value } }, (root) => {
      const result = runRelease(root);
      expect(result.status).toBe(1);
      expect(result.output).toContain(`site config ${field}`);
    });
  });

  it("checks the homepage now summary even with a published now page", async () => {
    await withFixture(
      {
        config: { now: { updatedAt: "2026-08-07", summary: "TODO" } },
        files: { "src/content/pages/now.md": fixedPage("now") },
      },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(1);
        expect(result.output).toContain("site config now.summary");
      },
    );
  });

  it("checks about fallback when the only about page is a draft", async () => {
    await withFixture(
      {
        config: { about: { lead: "TODO", body: "A complete story." } },
        files: {
          "src/content/pages/about.md": fixedPage("about", true, "TODO"),
        },
      },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(1);
        expect(result.output).toContain("site config about.lead");
        expect(result.output).not.toContain("published pages entry about.md");
      },
    );
  });

  it("accepts the existing name story and ignores unused about fallback and YAML comments", async () => {
    const story = await readFile(
      new URL("../../src/content/pages/about.md", import.meta.url),
      "utf8",
    );
    await withFixture(
      {
        config: { about: { lead: "TODO", body: "占位" } },
        files: {
          "src/content/pages/about.md": story.replace(
            "kind: about",
            "# TODO: authoring note\nkind: about",
          ),
        },
      },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(0);
      },
    );
  });

  it.each(["title", "summary", "body"])(
    "rejects placeholders in published page %s",
    async (field) => {
      const page =
        field === "body"
          ? fixedPage("about", false, "待填写")
          : fixedPage().replace(
              `${field}: ${field === "title" ? "About this site" : "A complete page."}`,
              `${field}: 待填写`,
            );
      await withFixture(
        { files: { "src/content/pages/about.md": page } },
        (root) => {
          const result = runRelease(root);
          expect(result.status).toBe(1);
          expect(result.output).toContain(
            "Replace 待填写 in published pages entry about.md.",
          );
        },
      );
    },
  );

  it.each(["TODO", "TBD", "placeholder"])(
    "rejects %s on a later line of a YAML block scalar",
    async (marker) => {
      const page = fixedPage().replace(
        "summary: A complete page.",
        `summary: |\n  A first line.\n  ${marker}`,
      );
      await withFixture(
        { files: { "src/content/pages/about.md": page } },
        (root) => {
          const result = runRelease(root);
          expect(result.status).toBe(1);
          expect(result.output).toContain("published pages entry about.md");
        },
      );
    },
  );

  it.each([
    ["invalid schema", entry("kind: contact"), "Fix invalid frontmatter"],
    ["invalid YAML", entry("kind: ["), "Invalid YAML frontmatter"],
    [
      "string draft",
      fixedPage().replace("draft: false", 'draft: "true"'),
      "Fix invalid frontmatter",
    ],
  ])("rejects a page with %s", async (_label, page, expected) => {
    await withFixture(
      { files: { "src/content/pages/about.md": page } },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(1);
        expect(result.output).toContain(`${expected} in pages entry about.md.`);
      },
    );
  });

  it("rejects duplicate published singleton pages", async () => {
    await withFixture(
      {
        files: {
          "src/content/pages/about.md": fixedPage(),
          "src/content/pages/nested/about.md": fixedPage(),
        },
      },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(1);
        expect(result.output).toContain(
          "Keep at most one non-draft about page.",
        );
      },
    );
  });

  it("uses the same glob exclusions and boolean draft filtering for pages", async () => {
    await withFixture(
      {
        config: { about: { lead: "TODO", body: "A complete story." } },
        files: {
          "src/content/pages/.hidden.md": fixedPage("about", false, "TODO"),
          "src/content/pages/.private/nested.md": fixedPage(
            "about",
            false,
            "TODO",
          ),
          "src/content/pages/UPPER.MD": fixedPage("about", false, "TODO"),
          "src/content/pages/draft.md": fixedPage("about", true, "TODO"),
          "src/content/pages/_group/about.md": fixedPage(),
        },
      },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(0);
      },
    );
  });

  it.each([
    ["placeholder", { placeholder: true }, "Set `placeholder` to false"],
    ["HTTP site URL", { siteUrl: "http://alune.dev" }, "siteUrl"],
    ["reserved site URL", { siteUrl: "https://example.com" }, "siteUrl"],
    ["placeholder author", { authorName: "TODO" }, "placeholder author name"],
    ["invalid email", { email: "invalid" }, "placeholder contact email"],
    [
      "missing Studio",
      { omitCollection: "studio" as const },
      "non-draft studio",
    ],
    [
      "missing Journal",
      { omitCollection: "journal" as const },
      "non-draft journal",
    ],
  ])("rejects %s", async (_label, options, expected) => {
    await withFixture(options, (root) => {
      const result = runRelease(root);
      expect(result.status).toBe(1);
      expect(result.output).toContain(expected);
    });
  });

  it("rejects published placeholders and invalid frontmatter independently", async () => {
    await withFixture(
      {
        files: {
          "src/content/studio/todo.md": entry("draft: false", "TODO"),
          "src/content/journal/invalid.md": entry(
            "title: Invalid\ndraft: false",
          ),
        },
      },
      (root) => {
        const result = runRelease(root);
        expect(result.status).toBe(1);
        expect(result.output).toContain(
          "Replace TODO in published studio entry todo.md.",
        );
        expect(result.output).toContain(
          "Fix invalid frontmatter in journal entry invalid.md.",
        );
      },
    );
  });

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
