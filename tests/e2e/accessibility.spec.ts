import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const coreRoutes = [
  "/",
  "/studio/",
  "/journal/",
  "/about/",
  "/now/",
  "/topics/",
] as const;

test("core pages have no WCAG A/AA axe violations", async ({ page }) => {
  for (const route of coreRoutes) {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(
      results.violations,
      `${route} has axe violations: ${results.violations
        .map(({ id, help }) => `${id} (${help})`)
        .join(", ")}`,
    ).toEqual([]);
  }
});
