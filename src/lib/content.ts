import { z } from "astro/zod";

import {
  countTopics,
  deriveUsedTopics,
  normalizeTopic,
  topicLabel,
} from "./topics";

export { countTopics, deriveUsedTopics, normalizeTopic, topicLabel };

/** Stable slugs are public URL components and are intentionally conservative. */
export const slugSchema = z
  .string()
  .min(1, "slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must use lowercase kebab-case");

/**
 * Astro entry IDs may include directories, while related references should
 * never contain whitespace or punctuation that can be mistaken for a URL.
 */
export const stableIdSchema = z
  .string()
  .min(1, "stable ID is required")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._/-]*$/,
    "stable ID contains unsupported characters",
  );

const nonEmptyString = z.string().trim().min(1);
const safeExternalUrlSchema = z.url().refine(
  (value) => {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    if (url.protocol !== "http:") return false;

    return (
      url.hostname === "localhost" ||
      url.hostname.endsWith(".localhost") ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]"
    );
  },
  {
    message: "external links must use HTTPS (HTTP is allowed only locally)",
  },
);
const topicSchema = slugSchema;
const topicsSchema = z
  .array(topicSchema)
  .default([])
  .superRefine((topics, context) => {
    if (new Set(topics).size !== topics.length) {
      context.addIssue({
        code: "custom",
        message: "topics must be unique",
      });
    }
  });
const referencesSchema = z
  .array(stableIdSchema)
  .default([])
  .superRefine((references, context) => {
    if (new Set(references).size !== references.length) {
      context.addIssue({
        code: "custom",
        message: "references must be unique",
      });
    }
  });

export const contentDateSchema = z.coerce.date();
const coverSchema = nonEmptyString.refine(
  (value) =>
    (value.startsWith("/") && !value.startsWith("//")) ||
    safeExternalUrlSchema.safeParse(value).success,
  {
    message: "cover must use a root-relative path or a safe HTTPS URL",
  },
);

const commonFields = {
  title: nonEmptyString,
  summary: nonEmptyString,
  draft: z.boolean().default(false),
  publishedAt: contentDateSchema.optional(),
  updatedAt: contentDateSchema.optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  topics: topicsSchema,
};

const toolLinksSchema = z
  .object({
    launch: safeExternalUrlSchema,
    source: safeExternalUrlSchema.optional(),
  })
  .strict();

const generalLinksSchema = z
  .object({
    primary: safeExternalUrlSchema.optional(),
    source: safeExternalUrlSchema.optional(),
  })
  .strict();

const openSourceLinksSchema = z
  .object({
    primary: safeExternalUrlSchema.optional(),
    source: safeExternalUrlSchema,
  })
  .strict();

const projectFields = {
  kind: z.literal("project"),
  status: z.enum(["idea", "building", "active", "paused", "archived"]),
  links: generalLinksSchema,
  role: nonEmptyString.optional(),
  outcomes: z.array(nonEmptyString).optional(),
  relatedJournal: referencesSchema,
};

const toolFields = {
  kind: z.literal("tool"),
  status: z.enum(["idea", "building", "active", "paused", "archived"]),
  links: toolLinksSchema,
  relatedJournal: referencesSchema,
};

const experimentFields = {
  kind: z.literal("experiment"),
  status: z.enum(["idea", "building", "active", "paused", "archived"]),
  links: generalLinksSchema,
  relatedJournal: referencesSchema,
};

const openSourceFields = {
  kind: z.literal("open-source"),
  status: z.enum(["idea", "building", "active", "paused", "archived"]),
  links: openSourceLinksSchema,
  relatedJournal: referencesSchema,
};

const studioProjectSchema = z
  .object({ ...commonFields, ...projectFields })
  .strict();
const studioToolSchema = z.object({ ...commonFields, ...toolFields }).strict();
const studioExperimentSchema = z
  .object({ ...commonFields, ...experimentFields })
  .strict();
const studioOpenSourceSchema = z
  .object({ ...commonFields, ...openSourceFields })
  .strict();

function validateDates<T extends { publishedAt?: Date; updatedAt?: Date }>(
  value: T,
  context: z.RefinementCtx,
): void {
  if (
    value.publishedAt &&
    value.updatedAt &&
    value.updatedAt < value.publishedAt
  ) {
    context.addIssue({
      code: "custom",
      path: ["updatedAt"],
      message: "updatedAt cannot be earlier than publishedAt",
    });
  }
}

export const studioSchema = z
  .discriminatedUnion("kind", [
    studioProjectSchema,
    studioToolSchema,
    studioExperimentSchema,
    studioOpenSourceSchema,
  ])
  .superRefine(validateDates);

export const journalSchema = z
  .object({
    ...commonFields,
    kind: z.enum(["essay", "note", "devlog", "update"]),
    series: nonEmptyString.optional(),
    relatedStudio: referencesSchema,
    cover: coverSchema.optional(),
    coverAlt: nonEmptyString.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    validateDates(value, context);
    if (!value.draft && !value.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "publishedAt is required for non-draft journal entries",
      });
    }
    if (value.cover && !value.coverAlt) {
      context.addIssue({
        code: "custom",
        path: ["coverAlt"],
        message: "coverAlt is required when cover is provided",
      });
    }
    if (!value.cover && value.coverAlt) {
      context.addIssue({
        code: "custom",
        path: ["coverAlt"],
        message: "coverAlt requires a cover image",
      });
    }
  });

export const pagesSchema = z
  .object({
    kind: z.enum(["about", "now"]),
    title: nonEmptyString,
    summary: nonEmptyString,
    draft: z.boolean().default(false),
    updatedAt: contentDateSchema,
  })
  .strict();

export type StudioData = z.infer<typeof studioSchema>;
export type JournalData = z.infer<typeof journalSchema>;
export type PageData = z.infer<typeof pagesSchema>;
export type ContentData = StudioData | JournalData | PageData;

export interface ContentEntry<T extends object = ContentData> {
  id: string;
  data: T;
  slug?: string;
  collection?: string;
}

export interface VisibilityOptions {
  production?: boolean;
}

function productionFrom(
  options: boolean | VisibilityOptions | undefined,
): boolean {
  return typeof options === "boolean"
    ? options
    : (options?.production ?? false);
}

export function isDraftEntry<T extends { draft?: boolean }>(entry: {
  data: T;
}): boolean {
  return entry.data.draft === true;
}

/** Return a new list, excluding draft entries only for production views. */
export function filterDrafts<T extends { data: { draft?: boolean } }>(
  entries: readonly T[],
  options: boolean | VisibilityOptions = {},
): T[] {
  return productionFrom(options)
    ? entries.filter((entry) => !isDraftEntry(entry))
    : [...entries];
}

export const withoutDrafts = filterDrafts;
export const getVisibleEntries = filterDrafts;
export const getPublishedEntries = filterDrafts;

function entryDate(entry: {
  data: { updatedAt?: Date | string; publishedAt?: Date | string };
}): number {
  const value = entry.data.updatedAt ?? entry.data.publishedAt;
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

/**
 * Sort featured entries first, then explicit order, then newest date. The
 * original array is never mutated and the ID is a deterministic final tie
 * breaker.
 */
export function sortByFeaturedAndDate<
  T extends {
    id: string;
    data: {
      featured?: boolean;
      order?: number;
      title?: string;
      updatedAt?: Date | string;
      publishedAt?: Date | string;
    };
  },
>(entries: readonly T[]): T[] {
  return [...entries].sort((left, right) => {
    const featuredDifference =
      Number(Boolean(right.data.featured)) -
      Number(Boolean(left.data.featured));
    if (featuredDifference) return featuredDifference;

    const orderDifference = (left.data.order ?? 0) - (right.data.order ?? 0);
    if (orderDifference) return orderDifference;

    const dateDifference = entryDate(right) - entryDate(left);
    if (dateDifference) return dateDifference;

    const titleDifference = (left.data.title ?? "").localeCompare(
      right.data.title ?? "",
    );
    return titleDifference || left.id.localeCompare(right.id);
  });
}

export const sortContentEntries = sortByFeaturedAndDate;
export const sortEntries = sortByFeaturedAndDate;

/** Journal archives stay chronological even when an entry is featured. */
export function sortByPublishedDate<
  T extends {
    id: string;
    data: {
      title?: string;
      publishedAt?: Date | string;
      updatedAt?: Date | string;
    };
  },
>(entries: readonly T[]): T[] {
  const publishedTimestamp = (entry: T) => {
    const value = entry.data.publishedAt ?? entry.data.updatedAt;
    if (!value) return Number.NEGATIVE_INFINITY;
    const timestamp =
      value instanceof Date ? value.getTime() : Date.parse(value);
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  };

  return [...entries].sort((left, right) => {
    const dateDifference = publishedTimestamp(right) - publishedTimestamp(left);
    if (dateDifference) return dateDifference;

    const titleDifference = (left.data.title ?? "").localeCompare(
      right.data.title ?? "",
    );
    return titleDifference || left.id.localeCompare(right.id);
  });
}

interface EntryIdentity {
  id: string;
  slug?: string;
  data: object;
}

function entryKeys(entry: EntryIdentity): string[] {
  // Astro's loader owns `id` and `slug`; they are intentionally not repeated
  // in frontmatter schemas (doing so raises ContentSchemaContainsSlugError).
  const dataSlug = (entry.data as { slug?: unknown }).slug;
  return [entry.id, entry.slug, dataSlug].filter(
    (key): key is string => typeof key === "string" && key.length > 0,
  );
}

export function resolveReferences<Target extends EntryIdentity>(
  references: readonly string[] | undefined,
  targets: readonly Target[],
): Target[] {
  if (!references?.length) return [];
  const byKey = new Map<string, Target>();
  for (const target of targets) {
    for (const key of entryKeys(target)) byKey.set(key, target);
  }
  const resolved: Target[] = [];
  const seen = new Set<string>();
  for (const reference of references) {
    const target = byKey.get(reference);
    if (target && !seen.has(target.id)) {
      resolved.push(target);
      seen.add(target.id);
    }
  }
  return resolved;
}

export function resolveRelatedJournal<
  Studio extends { data: { relatedJournal?: readonly string[] } },
  Journal extends EntryIdentity & { data: { draft?: boolean } },
>(
  studio: Studio,
  journals: readonly Journal[],
  options: VisibilityOptions = {},
): Journal[] {
  return resolveReferences(
    studio.data.relatedJournal,
    filterDrafts(journals, options),
  );
}

export function resolveRelatedStudio<
  Journal extends { data: { relatedStudio?: readonly string[] } },
  Studio extends EntryIdentity & { data: { draft?: boolean } },
>(
  journal: Journal,
  studios: readonly Studio[],
  options: VisibilityOptions = {},
): Studio[] {
  return resolveReferences(
    journal.data.relatedStudio,
    filterDrafts(studios, options),
  );
}

export function resolveStudioRelationships<
  Studio extends { id: string; data: { relatedJournal?: readonly string[] } },
  Journal extends EntryIdentity & { data: { draft?: boolean } },
>(
  studio: Studio,
  journals: readonly Journal[],
  options: VisibilityOptions = {},
) {
  return resolveRelatedJournal(studio, journals, options);
}

export function resolveJournalRelationships<
  Journal extends { id: string; data: { relatedStudio?: readonly string[] } },
  Studio extends EntryIdentity & { data: { draft?: boolean } },
>(
  journal: Journal,
  studios: readonly Studio[],
  options: VisibilityOptions = {},
) {
  return resolveRelatedStudio(journal, studios, options);
}

export function findDuplicateSlugs<T extends EntryIdentity>(
  entries: readonly T[],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const slug = entryKeys(entry).at(-1) ?? entry.id;
    if (seen.has(slug)) duplicates.add(slug);
    seen.add(slug);
  }
  return [...duplicates].sort();
}

export function assertUniqueSlugs<T extends EntryIdentity>(
  entries: readonly T[],
  collectionName = "content",
): void {
  const duplicates = findDuplicateSlugs(entries);
  if (duplicates.length) {
    throw new Error(
      `${collectionName} contains duplicate slugs: ${duplicates.join(", ")}`,
    );
  }
}

export function findMissingReferences<
  Source extends { id: string; data: object },
  Target extends EntryIdentity,
>(
  sources: readonly Source[],
  targets: readonly Target[],
  relation: "relatedJournal" | "relatedStudio",
): Array<{ sourceId: string; reference: string }> {
  const targetKeys = new Set(targets.flatMap(entryKeys));
  const missing: Array<{ sourceId: string; reference: string }> = [];
  for (const source of sources) {
    const references = (source.data as Record<string, unknown>)[relation];
    if (!Array.isArray(references)) continue;
    for (const reference of references) {
      if (typeof reference === "string" && !targetKeys.has(reference)) {
        missing.push({ sourceId: source.id, reference });
      }
    }
  }
  return missing;
}

export function assertValidReferences<
  Source extends { id: string; data: object },
  Target extends EntryIdentity,
>(
  sources: readonly Source[],
  targets: readonly Target[],
  relation: "relatedJournal" | "relatedStudio",
  collectionName: string = relation,
): void {
  const missing = findMissingReferences(sources, targets, relation);
  if (missing.length) {
    const detail = missing
      .map(({ sourceId, reference }) => `${sourceId} -> ${reference}`)
      .join(", ");
    throw new Error(`${collectionName} contains missing references: ${detail}`);
  }
}
