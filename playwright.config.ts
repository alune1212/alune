import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4321";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "node_modules/.bin/astro preview --host 127.0.0.1 --port 4321",
    url: baseURL,
    // These checks assert production-only behavior such as draft filtering and
    // empty states, so never reuse an already-running development server.
    reuseExistingServer: false,
    env: { ASTRO_TELEMETRY_DISABLED: "1" },
    timeout: 120_000,
  },
});
