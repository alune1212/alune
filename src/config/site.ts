import rawSite from "./site.config.json";
import { siteConfigSchema } from "./site-schema";

export { siteConfigSchema } from "./site-schema";
export type { SiteConfig, SocialLink } from "./site-schema";

export const site = siteConfigSchema.parse(rawSite);

export const primaryNavigation = [
  { label: "作品", href: "/studio/" },
  { label: "文章", href: "/journal/" },
  { label: "关于", href: "/about/" },
] as const;

export const sectionLabels = {
  studio: primaryNavigation[0].label,
  journal: primaryNavigation[1].label,
  about: primaryNavigation[2].label,
  now: "近况",
  topics: "主题",
} as const;
