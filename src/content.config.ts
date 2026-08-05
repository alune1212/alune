import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { journalSchema, pagesSchema, studioSchema } from "./lib/content";

/**
 * Collection roots deliberately exclude `_templates`: templates are authoring
 * aids, never public entries.
 */
const studio = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/studio" }),
  schema: studioSchema,
});

const journal = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/journal" }),
  schema: journalSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: pagesSchema,
});

export const collections = { studio, journal, pages };
