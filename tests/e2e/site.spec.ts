import { expect, test } from "@playwright/test";

const coreRoutes = [
  "/",
  "/studio/",
  "/journal/",
  "/about/",
  "/now/",
  "/topics/",
] as const;

const primaryNavigation = [
  { label: "作品", href: "/studio/" },
  { label: "文章", href: "/journal/" },
  { label: "关于", href: "/about/" },
] as const;

test.describe("site structure", () => {
  test("core routes render a document with a main heading", async ({
    page,
  }) => {
    for (const route of coreRoutes) {
      const response = await page.goto(route);

      expect(response, `${route} should return a response`).not.toBeNull();
      expect(
        response?.ok(),
        `${route} should return a successful response`,
      ).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
      await expect(page.locator("main")).toBeVisible();
      await expect(
        page.locator("main").getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
    }
  });

  test("desktop primary navigation exposes the wordmark and fixed destinations", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The desktop navigation is covered in the desktop project.",
    );

    await page.goto("/");

    const banner = page.getByRole("banner");
    await expect(
      banner.getByRole("link", { name: "跳转到主要内容" }),
    ).toHaveAttribute("href", "#main-content");
    await expect(
      banner.getByRole("link", { name: /首页$/ }).first(),
    ).toHaveAttribute("href", "/");

    const navigation = banner.getByRole("navigation", {
      name: "主导航",
    });
    await expect(navigation.getByRole("link")).toHaveCount(
      primaryNavigation.length,
    );

    for (const item of primaryNavigation) {
      const link = navigation.getByRole("link", {
        name: item.label,
        exact: true,
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", item.href);
    }
  });

  test("home sections keep their semantic order and core headings", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The home structure is covered in the desktop project.",
    );

    await page.goto("/");

    const sectionIds = await page
      .locator("main > section[aria-labelledby]")
      .evaluateAll((sections) =>
        sections.map((section) => section.getAttribute("aria-labelledby")),
      );

    expect(sectionIds).toEqual([
      "hero-title",
      "featured-studio",
      "latest-journal",
      "now-title",
    ]);
    await expect(
      page.locator("main").getByRole("heading", { level: 1 }),
    ).toHaveCount(1);
    await expect(page.locator("#hero-title")).toHaveText(/\S+/);
    await expect(page.locator("#featured-studio")).toHaveText(/\S+/);
    await expect(page.locator("#latest-journal")).toHaveText(/\S+/);
    await expect(page.locator("#now-title")).toHaveText(/\S+/);
  });

  test("production Studio and Journal listings expose their empty states", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The production empty state is covered in the desktop project.",
    );

    for (const route of ["/studio/", "/journal/"] as const) {
      await page.goto(route);

      const emptyState = page.locator('main [role="status"]');
      await expect(
        emptyState,
        `${route} should show its empty state`,
      ).toHaveCount(1);
      await expect(emptyState.getByRole("heading", { level: 2 })).toHaveCount(
        1,
      );
      await expect(emptyState.getByRole("heading", { level: 2 })).toHaveText(
        /\S+/,
      );
    }
  });

  test("RSS is served as an XML feed", async ({ request }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The feed contract is covered in the desktop project.",
    );

    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/xml/i);

    const body = await response.text();
    expect(body).toMatch(/<rss\b/i);
    expect(body).toMatch(/<channel>/i);
    expect(body).toMatch(/<language>zh-CN<\/language>/i);
  });

  test("robots.txt advertises the placeholder crawl policy and sitemap", async ({
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The robots contract is covered in the desktop project.",
    );

    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^text\/plain/i);

    const body = await response.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Disallow: /");
    expect(body).toMatch(/^Sitemap:\s+\S+/m);
  });

  test("placeholder pages expose canonical, description, and noindex metadata", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The metadata contract is covered in the desktop project.",
    );

    for (const route of coreRoutes) {
      await page.goto(route);

      const description = page.locator('meta[name="description"]');
      await expect(
        description,
        `${route} should have one description`,
      ).toHaveCount(1);
      await expect(description).toHaveAttribute("content", /\S+/);

      const openGraphLocale = page.locator('meta[property="og:locale"]');
      await expect(
        openGraphLocale,
        `${route} should expose the Chinese Open Graph locale`,
      ).toHaveCount(1);
      await expect(openGraphLocale).toHaveAttribute("content", "zh_CN");

      const canonical = page.locator('link[rel="canonical"]');
      await expect(
        canonical,
        `${route} should have one canonical link`,
      ).toHaveCount(1);
      const canonicalHref = await canonical.getAttribute("href");
      expect(
        canonicalHref,
        `${route} canonical href should be present`,
      ).toBeTruthy();
      expect(new URL(canonicalHref!, page.url()).pathname).toBe(route);

      const robots = page.locator('meta[name="robots"]');
      await expect(
        robots,
        `${route} should be noindex while the site is a placeholder`,
      ).toHaveCount(1);
      await expect(robots).toHaveAttribute("content", /noindex/i);
    }
  });

  test("theme toggle updates data-theme and persists through reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.removeItem("alune-theme"));
    await page.reload();

    const root = page.locator("html");
    const initialTheme = await root.getAttribute("data-theme");
    expect(initialTheme).toMatch(/^(light|dark)$/);
    await expect(page.locator("[data-theme-toggle]").first()).toHaveAttribute(
      "aria-label",
      /主题/,
    );

    await page.locator("[data-theme-toggle]").first().click();

    const changedTheme = await root.getAttribute("data-theme");
    expect(changedTheme).toBe(initialTheme === "dark" ? "light" : "dark");
    expect(
      await page.evaluate(() => window.localStorage.getItem("alune-theme")),
    ).toBe(changedTheme);

    await page.reload();
    await expect(root).toHaveAttribute("data-theme", changedTheme!);
  });

  test("the generated not-found document renders when exposed by the build", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "The not-found document is covered in the desktop project.",
    );

    const response = await page.goto("/404.html");
    if (!response || response.status() !== 200) {
      test.skip(
        true,
        "This preview does not expose Astro's generated 404.html document.",
      );
    }

    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.locator("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/i,
    );
  });
});

test.describe("mobile navigation", () => {
  test("mobile menu opens and reaches every primary route", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chromium",
      "The mobile menu is covered in the mobile project.",
    );

    for (const item of primaryNavigation) {
      await page.goto("/");
      const homeUrl = page.url();

      const menu = page.locator("details.site-header__menu");
      await expect(menu.locator("summary")).toHaveAttribute(
        "aria-label",
        /导航/,
      );
      await menu.locator("summary").click();

      const navigation = menu.getByRole("navigation", {
        name: "移动导航",
      });
      await expect(navigation).toBeVisible();

      const link = navigation.getByRole("link", {
        name: item.label,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", item.href);
      await link.click();
      await expect(page).toHaveURL(new URL(item.href, homeUrl).href);
      await expect(
        page.locator("main").getByRole("heading", { level: 1 }),
      ).toBeVisible();
    }
  });
});
