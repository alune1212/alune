import type { CollectionEntry } from "astro:content";

import type { EntryPreviewData } from "../components/types";
import { entryPath } from "./routes";

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
    topics: entry.data.topics,
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
    topics: entry.data.topics,
    cover: entry.data.cover,
    coverAlt: entry.data.coverAlt,
    actionLabel: "阅读文章",
  };
}
