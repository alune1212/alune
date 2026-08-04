import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import site from "./src/config/site.config.json";

export default defineConfig({
  site: site.siteUrl,
  output: "static",
  trailingSlash: "always",
  integrations: [mdx(), react(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
  vite: {
    plugins: tailwindcss(),
  },
});
