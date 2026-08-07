import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { domainToASCII, URL } from "node:url";

import { parseFrontmatter } from "astro/markdown";

const root = process.cwd();
const configPath = path.join(root, "src/config/site.config.json");
const errors = [];

const config = JSON.parse(await readFile(configPath, "utf8"));
const reservedHosts = new Set([
  "example.com",
  "example.org",
  "example.net",
  "localhost",
  "127.0.0.1",
  "[::1]",
]);
const reservedHostSuffixes = [
  ".example.com",
  ".example.org",
  ".example.net",
  ".localhost",
  ".invalid",
  ".test",
];

function isReservedHost(value) {
  const hostname = domainToASCII(value.toLowerCase()).replace(/\.+$/, "");
  return (
    !hostname ||
    reservedHosts.has(hostname) ||
    reservedHostSuffixes.some((suffix) => hostname.endsWith(suffix))
  );
}

function isProductionSiteUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      !isReservedHost(url.hostname)
    );
  } catch {
    return false;
  }
}

function isProductionEmail(value) {
  if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return false;
  }
  const domain = value.split("@").at(-1)?.toLowerCase();
  return Boolean(domain && !isReservedHost(domain));
}

if (config.placeholder !== false) {
  errors.push("Set `placeholder` to false in src/config/site.config.json.");
}

if (!isProductionSiteUrl(config.siteUrl)) {
  errors.push(
    "Replace `siteUrl` with a valid HTTPS production origin (no placeholder, query, or fragment).",
  );
}

if (
  !config.author?.name ||
  /^(your\b|todo\b|tbd\b|placeholder\b|你的名字)/i.test(
    config.author.name.trim(),
  )
) {
  errors.push("Replace the placeholder author name.");
}

if (!isProductionEmail(config.author?.email)) {
  errors.push("Replace the placeholder contact email with a valid address.");
}

async function publishedEntries(collection) {
  const directory = path.join(root, "src/content", collection);
  let files;

  try {
    files = await readdir(directory, { recursive: true });
  } catch {
    return [];
  }

  const candidates = files.filter(
    (file) =>
      typeof file === "string" &&
      !file.split(path.sep).some((segment) => segment.startsWith(".")) &&
      /\.(md|mdx)$/.test(file),
  );

  const published = [];
  for (const file of candidates) {
    const source = await readFile(path.join(directory, file), "utf8");
    let frontmatter;
    let frontmatterData;
    try {
      const parsed = parseFrontmatter(source);
      frontmatter = parsed.rawFrontmatter;
      frontmatterData = parsed.frontmatter;
    } catch {
      errors.push(`Invalid YAML frontmatter in ${collection} entry ${file}.`);
      continue;
    }
    if (frontmatterData.draft === true) continue;

    const placeholder = [
      { pattern: /\bTODO\b/i, label: "TODO" },
      { pattern: /\bTBD\b/i, label: "TBD" },
      { pattern: /replace[-_ ]?me/i, label: "replace-me" },
      {
        pattern: /development preview only/i,
        label: "development preview copy",
      },
      { pattern: /待填写/u, label: "待填写" },
      { pattern: /待补充/u, label: "待补充" },
      { pattern: /占位/u, label: "中文占位内容" },
    ].find(({ pattern }) => pattern.test(source));
    const placeholderFrontmatter = [
      {
        pattern: /(?:https?:\/\/)?(?:[\w.-]+\.)?example\.(?:com|org|net)\b/i,
        label: "example domain",
      },
      { pattern: /\bplaceholder\b/i, label: "placeholder value" },
    ].find(({ pattern }) => pattern.test(frontmatter));

    if (placeholder || placeholderFrontmatter) {
      errors.push(
        `Replace ${placeholder?.label ?? placeholderFrontmatter?.label} in published ${collection} entry ${file}.`,
      );
    }
    published.push(file);
  }
  return published;
}

for (const collection of ["studio", "journal"]) {
  const entries = await publishedEntries(collection);
  if (entries.length === 0) {
    errors.push(`Add at least one non-draft ${collection} entry.`);
  }
}

if (errors.length > 0) {
  console.error("Release readiness check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Release metadata and minimum content checks passed.");
