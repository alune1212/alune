import type { APIRoute } from "astro";

import { site } from "../config/site";

export const GET: APIRoute = ({ site: configuredSite }) => {
  const origin = configuredSite ?? new URL(site.siteUrl);
  const body = [
    "User-agent: *",
    site.placeholder ? "Disallow: /" : "Allow: /",
    `Sitemap: ${new URL("sitemap-index.xml", origin).href}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
