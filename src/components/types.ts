/**
 * Shared, deliberately small view-model types for the public components.
 *
 * These types describe what a component needs to render rather than exposing
 * Astro's content-collection entries.  Pages can map collection data into
 * these shapes at build time without coupling the UI to a content helper.
 */

export interface TopicItem {
  /** Stable topic slug used in links and filtering. */
  slug: string;
  /** Optional display label. When omitted, the slug is humanized. */
  label?: string;
  count?: number;
}

export type TopicValue = string | TopicItem;

export interface EntryPreviewData {
  id: string;
  title: string;
  summary: string;
  href: string;
  /** Collection or content kind, for example `essay` or `project`. */
  kind?: string;
  /** Optional lifecycle status, usually used for Studio entries. */
  status?: string;
  date?: Date | string | number;
  topics?: readonly TopicValue[];
  cover?: string;
  coverAlt?: string;
  /** Override the default action label for this entry. */
  actionLabel?: string;
}
