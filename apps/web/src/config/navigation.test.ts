import { describe, expect, it } from "vitest";

import { getVisibleNavigationItems } from "@/config/navigation";

describe("navigation permissions", () => {
  it("shows only menu items allowed by permissions", () => {
    const visibleItems = getVisibleNavigationItems(["menu:dashboard"]);

    expect(visibleItems.map((item) => item.label)).toEqual(["Dashboard"]);
  });

  it("shows all default MVP menu items for an administrator", () => {
    const visibleItems = getVisibleNavigationItems([
      "menu:dashboard",
      "menu:users",
      "menu:roles",
      "menu:departments",
      "menu:audit",
      "menu:dictionaries",
      "menu:files",
    ]);

    expect(visibleItems.map((item) => item.label)).toEqual([
      "Dashboard",
      "Users",
      "Roles",
      "Departments",
      "Audit",
      "Dictionaries",
      "Files",
    ]);
  });
});
