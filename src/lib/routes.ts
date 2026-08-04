export type PublicCollection = "studio" | "journal";

export function entryPath(collection: PublicCollection, id: string): string {
  return `/${collection}/${id.replace(/^\/+|\/+$/g, "")}/`;
}

export function topicPath(topic: string): string {
  return `/topics/${topic}/`;
}

export function isExternalHref(href: string): boolean {
  return /^(?:https?:)?\/\//.test(href);
}
