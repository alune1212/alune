import { describe, expect, it } from "vitest";

import { getVisibleNavigationItems } from "@/config/navigation";

describe("navigation permissions", () => {
  it("shows only menu items allowed by permissions", () => {
    const visibleItems = getVisibleNavigationItems(["menu:dashboard"]);

    expect(visibleItems.map((item) => item.label)).toEqual(["仪表盘"]);
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
      "仪表盘",
      "用户管理",
      "角色管理",
      "部门管理",
      "审计日志",
      "字典管理",
      "文件管理",
    ]);
  });
});
