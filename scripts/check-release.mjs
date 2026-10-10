import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { domainToASCII, URL } from "node:url";

import { parseFrontmatter } from "astro/markdown";

import { siteConfigSchema } from "../src/config/site-schema.ts";
import {
  journalSchema,
  pagesSchema,
  studioSchema,
} from "../src/lib/content.ts";

const root = process.cwd();
const configPath = path.join(root, "src/config/site.config.json");
const errors = [];

const config = JSON.parse(await readFile(configPath, "utf8"));
const parsedConfig = siteConfigSchema.safeParse(config);
if (!parsedConfig.success) {
  errors.push("Fix invalid fields in src/config/site.config.json.");
}
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

const placeholderMarkers = [
  { pattern: /\bTODO\b/i, label: "TODO" },
  { pattern: /\bTBD\b/i, label: "TBD" },
  { pattern: /replace[-_ ]?me/i, label: "replace-me" },
  { pattern: /development preview only/i, label: "development preview copy" },
  { pattern: /仅供开发预览/u, label: "development preview copy" },
  { pattern: /待填写/u, label: "待填写" },
  { pattern: /待补充/u, label: "待补充" },
  { pattern: /占位/u, label: "中文占位内容" },
  { pattern: /临时文案/u, label: "临时文案" },
];
const placeholderValues = [
  {
    pattern: /(?:https?:\/\/)?(?:[\w.-]+\.)?example\.(?:com|org|net)\b/i,
    label: "example domain",
  },
  { pattern: /\bplaceholder\b/i, label: "placeholder value" },
];
const scaffoldCopy = {
  "hero.summary": "第一版定义了系统，最终的故事仍待你书写。",
  "about.lead": "这里留给你的故事、原则，以及串联工作的线索。",
  "now.summary": "网站基础正在成形，内容与品牌语言将在之后展开。",
};

function checkConfigCopy(field, value) {
  if (typeof value !== "string") return;
  const placeholder = [...placeholderMarkers, ...placeholderValues].find(
    ({ pattern }) => pattern.test(value),
  );
  const scaffold = scaffoldCopy[field];
  if (placeholder || (scaffold && value.includes(scaffold))) {
    errors.push(
      `Replace ${placeholder?.label ?? "scaffold copy"} in site config ${field}.`,
    );
  }
}

for (const [field, value] of [
  ["name", config.name],
  ["title", config.title],
  ["description", config.description],
  ["hero.eyebrow", config.hero?.eyebrow],
  ["hero.title", config.hero?.title],
  ["hero.summary", config.hero?.summary],
  // This summary appears on the home page even when a now page overrides /now/.
  ["now.summary", config.now?.summary],
]) {
  checkConfigCopy(field, value);
}
if (Array.isArray(config.socials)) {
  config.socials.forEach((social, index) => {
    checkConfigCopy(`socials[${index}].label`, social?.label);
    checkConfigCopy(`socials[${index}].href`, social?.href);
  });
}

const collectionSchemas = {
  studio: studioSchema,
  journal: journalSchema,
  pages: pagesSchema,
};

function textValues(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(textValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(textValues);
  }
  return [];
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
    let frontmatterData;
    let body;
    try {
      const parsed = parseFrontmatter(source);
      frontmatterData = parsed.frontmatter;
      body = parsed.content;
    } catch {
      errors.push(`Invalid YAML frontmatter in ${collection} entry ${file}.`);
      continue;
    }
    if (frontmatterData.draft === true) continue;

    // Inspect parsed values and visible body, not authoring comments in YAML.
    const frontmatter = textValues(frontmatterData).join("\n");
    const placeholder = placeholderMarkers.find(({ pattern }) =>
      pattern.test(`${frontmatter}\n${body}`),
    );
    const placeholderFrontmatter = placeholderValues.find(({ pattern }) =>
      pattern.test(frontmatter),
    );

    if (placeholder || placeholderFrontmatter) {
      errors.push(
        `Replace ${placeholder?.label ?? placeholderFrontmatter?.label} in published ${collection} entry ${file}.`,
      );
    }
    const parsedEntry =
      collectionSchemas[collection].safeParse(frontmatterData);
    if (!parsedEntry.success) {
      errors.push(`Fix invalid frontmatter in ${collection} entry ${file}.`);
      continue;
    }
    published.push({ file, data: parsedEntry.data });
  }
  return published;
}

for (const collection of ["studio", "journal"]) {
  const entries = await publishedEntries(collection);
  if (entries.length === 0) {
    errors.push(`Add at least one non-draft ${collection} entry.`);
  }
}

const pages = await publishedEntries("pages");
for (const kind of ["about", "now"]) {
  if (pages.filter(({ data }) => data.kind === kind).length > 1) {
    errors.push(`Keep at most one non-draft ${kind} page.`);
  }
}
if (!pages.some(({ data }) => data.kind === "about")) {
  checkConfigCopy("about.lead", config.about?.lead);
  checkConfigCopy("about.body", config.about?.body);
}

if (errors.length > 0) {
  console.error("Release readiness check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Release metadata and minimum content checks passed.");
