import { describe, expect, it } from "vitest";

import { site, siteConfigSchema } from "../../src/config/site";

const validConfig = {
  ...site,
  placeholder: false,
  siteUrl: "https://alune.example.dev",
  author: { name: "Alune", email: "hello@alune.example.dev" },
  socials: [{ label: "GitHub", href: "https://github.com/alune" }],
};

describe("site config schema", () => {
  it("accepts the complete strict site contract", () => {
    expect(siteConfigSchema.parse(validConfig)).toEqual(validConfig);
  });

  it.each([
    ["unknown field", { ...validConfig, extra: true }],
    ["blank text", { ...validConfig, title: "   " }],
    ["HTTP origin", { ...validConfig, siteUrl: "http://alune.dev" }],
    [
      "origin with a path",
      { ...validConfig, siteUrl: "https://alune.dev/blog" },
    ],
    [
      "invalid email",
      { ...validConfig, author: { name: "Alune", email: "nope" } },
    ],
    ["unexpected locale", { ...validConfig, locale: "en-US" }],
    [
      "invalid date",
      { ...validConfig, now: { ...validConfig.now, updatedAt: "2026-02-30" } },
    ],
    [
      "non-HTTPS social",
      {
        ...validConfig,
        socials: [{ label: "Profile", href: "http://alune.dev" }],
      },
    ],
  ])("rejects %s", (_label, config) => {
    expect(siteConfigSchema.safeParse(config).success).toBe(false);
  });
});
