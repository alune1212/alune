import type { CollectionEntry } from "astro:content";

import { site } from "../config/site";
import { toIsoDate } from "./dates";
import { entryPath } from "./routes";

export type StructuredData = Record<string, unknown>;

export function personStructuredData(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.author.name,
    url: site.siteUrl,
    email: site.author.email,
    sameAs: site.socials.map(({ href }) => href),
  };
}

export function journalStructuredData(
  entry: CollectionEntry<"journal">,
): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.data.title,
    description: entry.data.summary,
    url: new URL(entryPath("journal", entry.id), site.siteUrl).href,
    author: {
      "@type": "Person",
      name: site.author.name,
      url: site.siteUrl,
    },
    datePublished: entry.data.publishedAt
      ? toIsoDate(entry.data.publishedAt)
      : undefined,
    dateModified: entry.data.updatedAt
      ? toIsoDate(entry.data.updatedAt)
      : undefined,
    keywords: entry.data.topics,
  };
}

export function studioStructuredData(
  entry: CollectionEntry<"studio">,
): StructuredData {
  const type =
    entry.data.kind === "tool" ? "SoftwareApplication" : "CreativeWork";

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: entry.data.title,
    description: entry.data.summary,
    url: new URL(entryPath("studio", entry.id), site.siteUrl).href,
    creator: {
      "@type": "Person",
      name: site.author.name,
      url: site.siteUrl,
    },
    datePublished: entry.data.publishedAt
      ? toIsoDate(entry.data.publishedAt)
      : undefined,
    dateModified: entry.data.updatedAt
      ? toIsoDate(entry.data.updatedAt)
      : undefined,
    keywords: entry.data.topics,
  };
}
