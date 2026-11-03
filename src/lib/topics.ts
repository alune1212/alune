/**
 * Small, content-collection agnostic helpers for topic values.
 *
 * Topics are stored as stable slugs in frontmatter.  Keeping these helpers
 * independent from Astro makes them straightforward to use in routes,
 * tests, and build-time scripts alike.
 */

export interface TopicCarrier {
  topics?: readonly string[] | null;
  draft?: boolean;
}

export interface TopicOptions {
  /** Hide draft entries when preparing a production view. */
  production?: boolean;
}

export function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

export function topicLabel(topic: string): string {
  return normalizeTopic(topic)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Return the distinct topics used by entries, in deterministic display order.
 * Drafts remain visible by default (use `{ production: true }` for a public
 * build).
 */
export function deriveUsedTopics<T extends TopicCarrier>(
  entries: readonly T[],
  options: TopicOptions = {},
): string[] {
  const topics = new Set<string>();
  for (const entry of entries) {
    if (options.production && entry.draft) continue;
    for (const topic of entry.topics ?? []) {
      const normalized = normalizeTopic(topic);
      if (normalized) topics.add(normalized);
    }
  }
  return [...topics].sort((left, right) => left.localeCompare(right));
}

export function countTopics<T extends TopicCarrier>(
  entries: readonly T[],
  options: TopicOptions = {},
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (options.production && entry.draft) continue;
    const normalizedTopics = new Set(
      (entry.topics ?? []).map(normalizeTopic).filter(Boolean),
    );
    for (const normalized of normalizedTopics) {
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return Object.fromEntries(counts);
}
