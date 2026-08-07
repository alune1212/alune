import { z } from "astro/zod";

const nonEmptyText = z.string().trim().min(1);
const httpsOrigin = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash
  );
}, "siteUrl must be an HTTPS origin without credentials, path, query, or fragment");
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    );
  }, "date must be a valid ISO calendar date");

export const siteConfigSchema = z
  .object({
    placeholder: z.boolean(),
    siteUrl: httpsOrigin,
    name: nonEmptyText,
    title: nonEmptyText,
    description: nonEmptyText,
    locale: z.literal("zh-CN"),
    author: z.object({ name: nonEmptyText, email: z.email() }).strict(),
    hero: z
      .object({
        eyebrow: nonEmptyText,
        title: nonEmptyText,
        summary: nonEmptyText,
      })
      .strict(),
    about: z.object({ lead: nonEmptyText, body: nonEmptyText }).strict(),
    now: z.object({ updatedAt: isoDate, summary: nonEmptyText }).strict(),
    socials: z.array(
      z
        .object({
          label: nonEmptyText,
          href: z
            .url()
            .refine((value) => new URL(value).protocol === "https:", {
              message: "social links must use HTTPS",
            }),
        })
        .strict(),
    ),
  })
  .strict();

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type SocialLink = SiteConfig["socials"][number];
