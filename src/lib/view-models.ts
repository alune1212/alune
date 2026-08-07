import type { CollectionEntry } from "astro:content";

import type { EntryPreviewData } from "../components/types";
import { formatDate } from "./dates";
import { entryPath } from "./routes";

function dateLabel(date: Date | undefined): string | undefined {
  return date ? formatDate(date) : undefined;
}

export function studioViewModel(
  entry: CollectionEntry<"studio">,
): EntryPreviewData {
  return {
    id: entry.id,
    title: entry.data.title,
    summary: entry.data.summary,
    href: entryPath("studio", entry.id),
    kind: entry.data.kind,
    status: entry.data.status,
    date: entry.data.updatedAt ?? entry.data.publishedAt,
    dateLabel: dateLabel(entry.data.updatedAt ?? entry.data.publishedAt),
    topics: entry.data.topics,
    featured: entry.data.featured,
    actionLabel: "查看作品",
  };
}

export function journalViewModel(
  entry: CollectionEntry<"journal">,
): EntryPreviewData {
  return {
    id: entry.id,
    title: entry.data.title,
    summary: entry.data.summary,
    href: entryPath("journal", entry.id),
    kind: entry.data.kind,
    date: entry.data.publishedAt ?? entry.data.updatedAt,
    dateLabel: dateLabel(entry.data.publishedAt ?? entry.data.updatedAt),
    topics: entry.data.topics,
    cover: entry.data.cover,
    coverAlt: entry.data.coverAlt,
    featured: entry.data.featured,
    actionLabel: "阅读文章",
  };
}
