import { LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  label: string;
  to?: string;
  icon: ComponentType<{ className?: string }>;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Employees", icon: Users },
  { label: "Permissions", icon: ShieldCheck }
];
