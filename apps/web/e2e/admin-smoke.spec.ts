import { expect, test } from "@playwright/test";

const adminUsername = process.env.E2E_ADMIN_USERNAME ?? "e2e_admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "change-this-password";

const internalPages = [
  { label: "应用中心", heading: "应用中心" },
  { label: "用户管理", heading: "用户管理" },
  { label: "角色权限", heading: "角色权限" },
  { label: "空间管理", heading: "空间管理" },
  { label: "操作日志", heading: "操作日志" },
  { label: "配置字典", heading: "配置字典" },
  { label: "文件资源", heading: "文件资源" },
] as const;

test.describe("admin smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("redirects protected routes to the login page", async ({ page }) => {
    await page.goto("/users");

    await expect(page).toHaveURL(/\/login(?:\?expired=false)?$/u);
    await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
  });

  test("logs in and navigates through platform pages", async ({ page }) => {
    await page.getByLabel("用户名").fill(adminUsername);
    await page.getByLabel("密码").fill(adminPassword);
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page.getByRole("heading", { name: "Alune Hub" })).toBeVisible();
    await expect(page.getByText("接口服务").first()).toBeVisible();

    for (const internalPage of internalPages) {
      await page.getByRole("link", { name: internalPage.label }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: internalPage.heading }),
      ).toBeVisible();
    }
  });
});
