import { defineConfig, devices } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT ?? 5173);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${webPort}`;
const apiBaseUrl = process.env.E2E_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const shouldStartWebServer = process.env.E2E_START_WEB_SERVER === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: shouldStartWebServer
    ? {
        command: `VITE_API_BASE_URL=${apiBaseUrl} pnpm dev --host 0.0.0.0`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
