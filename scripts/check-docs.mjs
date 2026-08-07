import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLineNumberLookup, markdownLinks } from "./check-docs-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function relative(file) {
  return path.relative(root, file) || ".";
}

function addError(file, line, message) {
  errors.push(`${relative(file)}:${line}: ${message}`);
}

async function walk(directory, extensions) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute, extensions)));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(absolute);
    }
  }

  return files;
}

function localLinkPath(fromFile, target) {
  if (
    !target ||
    target.startsWith("#") ||
    target.startsWith("/") ||
    target.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/iu.test(target)
  ) {
    return undefined;
  }

  const withoutFragment = target.split("#", 1)[0].split("?", 1)[0];
  if (!withoutFragment) return undefined;

  try {
    return path.resolve(
      path.dirname(fromFile),
      decodeURIComponent(withoutFragment),
    );
  } catch {
    return path.resolve(path.dirname(fromFile), withoutFragment);
  }
}

const rootMarkdown = ["README.md", "AGENTS.md", "CONTENT_LICENSE.md"].map(
  (file) => path.join(root, file),
);
const docsDirectory = path.join(root, "docs");
const contentDirectory = path.join(root, "src", "content");
const docsFiles = await walk(docsDirectory, new Set([".md", ".mdx"]));
const contentFiles = await walk(contentDirectory, new Set([".md", ".mdx"]));
const markdownFiles = [...rootMarkdown, ...docsFiles, ...contentFiles];
const canonicalDocs = [...rootMarkdown, ...docsFiles];
const sources = new Map();

for (const file of markdownFiles) {
  sources.set(file, await readFile(file, "utf8"));
}

for (const [file, source] of sources) {
  for (const { target, line } of markdownLinks(source)) {
    const resolved = localLinkPath(file, target);
    if (!resolved) continue;

    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      addError(file, line, `local link escapes the repository: ${target}`);
      continue;
    }

    try {
      await access(resolved);
    } catch {
      addError(file, line, `broken local link: ${target}`);
    }
  }
}

const readmePath = path.join(root, "README.md");
const readme = sources.get(readmePath);
const readmeTargets = new Set(
  markdownLinks(readme)
    .map(({ target }) => localLinkPath(readmePath, target))
    .filter(Boolean),
);

for (const file of docsFiles) {
  if (!readmeTargets.has(file)) {
    addError(file, 1, "docs file is not indexed directly from README.md");
  }
}

const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const packageScripts = new Set(Object.keys(packageJson.scripts ?? {}));
const pnpmBuiltins = new Set([
  "add",
  "approve-builds",
  "audit",
  "bin",
  "config",
  "create",
  "deploy",
  "dlx",
  "doctor",
  "env",
  "exec",
  "fetch",
  "import",
  "init",
  "install",
  "licenses",
  "link",
  "list",
  "outdated",
  "pack",
  "patch",
  "patch-commit",
  "prune",
  "publish",
  "rebuild",
  "remove",
  "root",
  "run",
  "setup",
  "store",
  "unlink",
  "update",
  "view",
  "why",
]);

for (const file of canonicalDocs) {
  const source = sources.get(file);
  const lineNumberAt = createLineNumberLookup(source);
  const commandPattern = /\bpnpm\s+(?:run\s+)?([a-z][\w:-]*)/giu;
  for (const match of source.matchAll(commandPattern)) {
    const command = match[1];
    if (pnpmBuiltins.has(command) || packageScripts.has(command)) continue;
    addError(
      file,
      lineNumberAt(match.index ?? 0),
      `pnpm script does not exist in package.json: ${command}`,
    );
  }
}

const forbiddenReferences = [
  ["CLAUDE.md", /\bCLAUDE\.md\b/iu],
  ["docs/architecture.md", /(?:docs\/)?architecture\.md\b/iu],
  ["docs/maintenance.md", /(?:docs\/)?maintenance\.md\b/iu],
  ["alune-platform", /\balune-platform\b/iu],
  ["legacy RAG", /\bRAG\b/u],
  ["legacy apps path", /\bapps\/(?:api|web)\b/iu],
  ["legacy packages path", /\bpackages\/api-client\b/iu],
  ["legacy infrastructure path", /\binfra\/(?:docker|nginx|postgres)\b/iu],
  ["legacy compose file", /\bdocker-compose\.ya?ml\b/iu],
];
const patchVersion = /\b(?:pnpm|Node(?:\.js)?)(?:@|\s+v?)(\d+\.\d+\.\d+)\b/giu;

for (const file of canonicalDocs) {
  const source = sources.get(file);
  const lineNumberAt = createLineNumberLookup(source);
  for (const [label, pattern] of forbiddenReferences) {
    const match = pattern.exec(source);
    pattern.lastIndex = 0;
    if (match) {
      addError(
        file,
        lineNumberAt(match.index ?? 0),
        `forbidden legacy reference: ${label}`,
      );
    }
  }

  for (const match of source.matchAll(patchVersion)) {
    addError(
      file,
      lineNumberAt(match.index ?? 0),
      "do not copy Node.js or pnpm patch versions into docs; reference the canonical config",
    );
  }
}

if (!readme.includes(".node-version")) {
  addError(
    readmePath,
    1,
    "README must reference .node-version as the Node source of truth",
  );
}
if (!readme.includes("packageManager")) {
  addError(
    readmePath,
    1,
    "README must reference package.json#packageManager as the pnpm source of truth",
  );
}

const navigationSource = await readFile(
  path.join(root, "src", "config", "site.ts"),
  "utf8",
);
const navigationBlock = navigationSource.match(
  /export const primaryNavigation\s*=\s*\[([\s\S]*?)\]\s*as const/u,
);
const navigationItems = navigationBlock
  ? [
      ...navigationBlock[1].matchAll(
        /\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)"\s*\}/gu,
      ),
    ].map((match) => ({ label: match[1], href: match[2] }))
  : [];

if (navigationItems.length === 0) {
  errors.push("src/config/site.ts: unable to read primaryNavigation");
} else {
  let labelCursor = 0;
  for (const item of navigationItems) {
    const labelIndex = readme.indexOf(item.label, labelCursor);
    if (labelIndex === -1) {
      addError(
        readmePath,
        1,
        `primary navigation label is missing or out of order: ${item.label}`,
      );
    } else {
      labelCursor = labelIndex + item.label.length;
    }
    if (!readme.includes(`\`${item.href}\``)) {
      addError(
        readmePath,
        1,
        `primary navigation path is missing: ${item.href}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Documentation checks failed:\n");
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Documentation checks passed (${markdownFiles.length} Markdown files, ${docsFiles.length} indexed docs).`,
);
