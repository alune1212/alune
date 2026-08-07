import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pageRoutes = [
  "/",
  "/studio/",
  "/studio/page/2/",
  "/journal/",
  "/journal/page/2/",
  "/about/",
  "/now/",
  "/topics/",
  "/topics/shared-topic/",
  "/studio/nested/anchor/",
  "/journal/notes/anchor/",
] as const;

test("populated build generates every public content route", async ({
  page,
}) => {
  for (const route of pageRoutes) {
    const response = await page.goto(route);
    expect(response?.ok(), `${route} should succeed`).toBeTruthy();
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://fixture.alune.dev${route}`,
    );
  }
});

test("nested entries preserve relations, topics, metadata, and prose styles", async ({
  page,
}) => {
  await page.goto("/studio/nested/anchor/");
  await expect(
    page.getByRole("link", { name: "Fixture Journal Anchor" }),
  ).toHaveAttribute("href", "/journal/notes/anchor/");
  await expect(
    page.getByRole("link", { name: /Shared Topic/i }).first(),
  ).toHaveAttribute("href", "/topics/shared-topic/");
  expect(
    await page.locator('script[type="application/ld+json"]').textContent(),
  ).toContain("Fixture Studio Anchor");

  await page.goto("/journal/");
  await expect(page.locator('img[alt="Abstract fixture cover"]')).toBeVisible();

  await page.goto("/journal/notes/anchor/");
  await expect(
    page.getByRole("link", { name: "Fixture Studio Anchor" }),
  ).toHaveAttribute("href", "/studio/nested/anchor/");
  expect(
    await page.locator('script[type="application/ld+json"]').textContent(),
  ).toContain("Fixture Journal Anchor");
  expect(
    await page
      .locator(".prose ul")
      .first()
      .evaluate((node) => getComputedStyle(node).listStyleType),
  ).not.toBe("none");
  expect(
    await page
      .locator(".prose ol")
      .evaluate((node) => getComputedStyle(node).listStyleType),
  ).not.toBe("none");
  expect(
    await page
      .locator(".prose a")
      .evaluate((node) => getComputedStyle(node).textDecorationLine),
  ).toContain("underline");
});

test("draft content is absent from lists, topics, feed, and generated routes", async ({
  page,
  request,
}) => {
  for (const route of ["/", "/journal/", "/topics/shared-topic/"]) {
    await page.goto(route);
    await expect(page.getByText("Fixture Draft Secret")).toHaveCount(0);
  }
  expect((await request.get("/journal/draft-note/")).status()).toBe(404);
  const feed = await (await request.get("/rss.xml")).text();
  expect(feed).toContain("Fixture Journal Anchor");
  expect(feed).toContain("https://fixture.alune.dev/journal/notes/anchor/");
  expect(feed).not.toContain("Fixture Draft Secret");
});

test("content routes have no WCAG A/AA violations or horizontal overflow", async ({
  page,
}) => {
  for (const route of [
    "/studio/nested/anchor/",
    "/journal/notes/anchor/",
    "/topics/shared-topic/",
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      `${route}: ${results.violations.map(({ id }) => id).join(", ")}`,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
