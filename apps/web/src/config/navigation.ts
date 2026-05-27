import {
  BookOpen,
  FileText,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import { uiCopy } from "@/config/ui-copy";

export type NavigationItem = {
  label: string;
  to?: string;
  icon: ComponentType<{ className?: string }>;
  permission: string;
};

export const navigationItems: NavigationItem[] = [
  {
    label: uiCopy.modules.dashboard,
    to: "/",
    icon: LayoutDashboard,
    permission: "menu:dashboard",
  },
  {
    label: uiCopy.modules.apps,
    to: "/apps",
    icon: Grid2X2,
    permission: "menu:apps",
  },
  {
    label: uiCopy.modules.users,
    to: "/users",
    icon: Users,
    permission: "menu:users",
  },
  {
    label: uiCopy.modules.roles,
    to: "/roles",
    icon: ShieldCheck,
    permission: "menu:roles",
  },
  {
    label: uiCopy.modules.departments,
    to: "/departments",
    icon: Network,
    permission: "menu:departments",
  },
  {
    label: uiCopy.modules.audit,
    to: "/audit",
    icon: ListChecks,
    permission: "menu:audit",
  },
  {
    label: uiCopy.modules.dictionaries,
    to: "/dictionaries",
    icon: BookOpen,
    permission: "menu:dictionaries",
  },
  {
    label: uiCopy.modules.files,
    to: "/files",
    icon: FileText,
    permission: "menu:files",
  },
];

export function getVisibleNavigationItems(
  permissions: readonly string[],
): NavigationItem[] {
  const permissionSet = new Set(permissions);
  return navigationItems.filter((item) => permissionSet.has(item.permission));
}
