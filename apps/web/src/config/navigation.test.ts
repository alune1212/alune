import { describe, expect, it } from "vitest";

import { getVisibleNavigationItems } from "@/config/navigation";

describe("navigation permissions", () => {
  it("shows only menu items allowed by permissions", () => {
    const visibleItems = getVisibleNavigationItems(["menu:dashboard"]);

    expect(visibleItems.map((item) => item.label)).toEqual(["首页"]);
  });

  it("shows all Alune Knowledge menu items for an administrator", () => {
    const visibleItems = getVisibleNavigationItems([
      "menu:dashboard",
      "menu:knowledge",
      "menu:documents",
      "menu:rag_chat",
      "menu:users",
      "menu:roles",
      "menu:departments",
      "menu:audit",
      "menu:dictionaries",
      "menu:files",
    ]);

    expect(visibleItems.map((item) => item.label)).toEqual([
      "首页",
      "知识库",
      "文档中心",
      "知识问答",
      "用户管理",
      "角色权限",
      "空间管理",
      "操作日志",
      "配置字典",
      "文件资源",
    ]);
  });
});
