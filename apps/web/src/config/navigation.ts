import { LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  label: string;
  to?: string;
  icon: ComponentType<{ className?: string }>;
  permission: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, permission: "menu:dashboard" },
  { label: "Employees", icon: Users, permission: "menu:employees" },
  { label: "Permissions", icon: ShieldCheck, permission: "menu:permissions" }
];

export function getVisibleNavigationItems(permissions: readonly string[]): NavigationItem[] {
  const permissionSet = new Set(permissions);
  return navigationItems.filter((item) => permissionSet.has(item.permission));
}
