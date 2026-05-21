import { expect, test } from "@playwright/test";

const adminUsername = process.env.E2E_ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "change-this-password";

const internalPages = [
  { label: "Users", heading: "Users" },
  { label: "Roles", heading: "Roles" },
  { label: "Departments", heading: "Departments" },
  { label: "Audit", heading: "Audit" },
  { label: "Dictionaries", heading: "Dictionaries" },
  { label: "Files", heading: "Files" }
] as const;

test.describe("admin smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("redirects protected routes to the login page", async ({ page }) => {
    await page.goto("/users");

    await expect(page).toHaveURL(/\/login$/u);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("logs in and navigates through internal system pages", async ({ page }) => {
    await page.getByLabel("Username").fill(adminUsername);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("heading", { name: "alune-platform" })).toBeVisible();
    await expect(page.getByText("API").first()).toBeVisible();

    for (const internalPage of internalPages) {
      await page.getByRole("link", { name: internalPage.label }).click();
      await expect(page.getByRole("heading", { name: internalPage.heading })).toBeVisible();
    }
  });
});
