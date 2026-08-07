import rawSite from "./site.config.json";

export type SocialLink = {
  label: string;
  href: string;
};

export type SiteConfig = Omit<typeof rawSite, "socials"> & {
  socials: SocialLink[];
};

export const site = rawSite satisfies SiteConfig;

export const primaryNavigation = [
  { label: "作品", href: "/studio/" },
  { label: "文章", href: "/journal/" },
  { label: "关于", href: "/about/" },
] as const;
