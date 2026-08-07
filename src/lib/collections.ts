import { getCollection, type CollectionEntry } from "astro:content";

import {
  assertValidReferences,
  filterDrafts,
  sortByPublishedDate,
  sortByFeaturedAndDate,
} from "./content";

const studioFiles = import.meta.glob("../content/studio/**/*.{md,mdx}");
const journalFiles = import.meta.glob("../content/journal/**/*.{md,mdx}");
const pageFiles = import.meta.glob("../content/pages/**/*.{md,mdx}");

type ContentGraph = {
  studio: CollectionEntry<"studio">[];
  journal: CollectionEntry<"journal">[];
};

let contentGraphPromise: Promise<ContentGraph> | undefined;

async function getContentGraph(): Promise<ContentGraph> {
  contentGraphPromise ??= Promise.all([
    getCollection("studio"),
    getCollection("journal"),
  ]).then(([studio, journal]) => {
    assertValidReferences(
      studio,
      journal,
      "relatedJournal",
      "studio.relatedJournal",
    );
    assertValidReferences(
      journal,
      studio,
      "relatedStudio",
      "journal.relatedStudio",
    );
    return { studio, journal };
  });

  return contentGraphPromise;
}

export async function getStudioEntries(options: { production?: boolean } = {}) {
  if (Object.keys(studioFiles).length === 0) return [];
  const { studio } = await getContentGraph();
  return sortByFeaturedAndDate(filterDrafts(studio, options));
}

export async function getJournalEntries(
  options: { production?: boolean } = {},
) {
  if (Object.keys(journalFiles).length === 0) return [];
  const { journal } = await getContentGraph();
  return sortByPublishedDate(filterDrafts(journal, options));
}

export async function getSingletonPage(
  kind: "about" | "now",
  options: { production?: boolean } = {},
) {
  if (Object.keys(pageFiles).length === 0) return undefined;
  const pages = filterDrafts(await getCollection("pages"), options).filter(
    (entry) => entry.data.kind === kind,
  );

  if (pages.length > 1) {
    throw new Error(
      `Expected at most one ${kind} page, received ${pages.length}.`,
    );
  }

  return pages[0];
}
