import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

import { site } from "../config/site";
import { getJournalEntries } from "../lib/collections";
import { entryPath } from "../lib/routes";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

function absoluteContentUrl(value: string): string | undefined {
  try {
    return new URL(value, site.siteUrl).href;
  } catch {
    return undefined;
  }
}

function renderFeedContent(source: string): string {
  return sanitizeHtml(markdown.render(source), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "title"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => {
        const href = attributes.href
          ? absoluteContentUrl(attributes.href)
          : undefined;
        return {
          tagName,
          attribs: href ? { ...attributes, href } : {},
        };
      },
      img: (tagName, attributes) => {
        const src = attributes.src
          ? absoluteContentUrl(attributes.src)
          : undefined;
        const attribs: Record<string, string> = { ...attributes };
        if (src) attribs.src = src;
        else delete attribs.src;
        attribs.alt ??= "";
        return {
          tagName,
          attribs,
        };
      },
    },
  });
}

export async function GET(context: APIContext) {
  const entries = await getJournalEntries({ production: true });

  return rss({
    title: `${site.name} Journal`,
    description: site.description,
    site: context.site ?? site.siteUrl,
    customData: `<language>${site.locale}</language>`,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      link: entryPath("journal", entry.id),
      content: renderFeedContent(entry.body ?? ""),
      categories: entry.data.topics,
      ...(entry.data.publishedAt ? { pubDate: entry.data.publishedAt } : {}),
    })),
  });
}
