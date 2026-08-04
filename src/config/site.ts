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
  { label: "Studio", href: "/studio/" },
  { label: "Journal", href: "/journal/" },
  { label: "About", href: "/about/" },
] as const;
