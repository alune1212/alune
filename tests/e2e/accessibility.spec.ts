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

test("desktop core pages have no serious WCAG A/AA axe violations", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "The axe audit is intentionally limited to desktop core pages.",
  );

  for (const route of coreRoutes) {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const seriousViolations = results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious",
    );

    expect(
      seriousViolations,
      `${route} has serious axe violations: ${seriousViolations
        .map(({ id, help }) => `${id} (${help})`)
        .join(", ")}`,
    ).toEqual([]);
  }
});
