import { BookOpen, FileText, LayoutDashboard, ListChecks, Network, ShieldCheck, Users } from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  label: string;
  to?: string;
  icon: ComponentType<{ className?: string }>;
  permission: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, permission: "menu:dashboard" },
  { label: "Users", to: "/users", icon: Users, permission: "menu:users" },
  { label: "Roles", to: "/roles", icon: ShieldCheck, permission: "menu:roles" },
  { label: "Departments", to: "/departments", icon: Network, permission: "menu:departments" },
  { label: "Audit", to: "/audit", icon: ListChecks, permission: "menu:audit" },
  { label: "Dictionaries", to: "/dictionaries", icon: BookOpen, permission: "menu:dictionaries" },
  { label: "Files", to: "/files", icon: FileText, permission: "menu:files" }
];

export function getVisibleNavigationItems(permissions: readonly string[]): NavigationItem[] {
  const permissionSet = new Set(permissions);
  return navigationItems.filter((item) => permissionSet.has(item.permission));
}
