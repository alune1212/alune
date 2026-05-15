import { Link } from "@tanstack/react-router";
import { Building2, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { platformName } from "@alune/shared";

export function Sidebar() {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex lg:flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <Building2 className="size-5" />
          </div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{platformName}</p>
              <p className="truncate text-xs text-slate-500">Internal Admin</p>
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navigationItems.map((item) => (
          "to" in item ? (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                isCollapsed && "justify-center px-0"
              )}
              activeProps={{ className: "bg-slate-950 text-white hover:bg-slate-950 hover:text-white" }}
            >
              <item.icon className="size-4 shrink-0" />
              {!isCollapsed ? <span>{item.label}</span> : null}
            </Link>
          ) : (
            <div
              key={item.label}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400",
                isCollapsed && "justify-center px-0"
              )}
              aria-disabled="true"
            >
              <item.icon className="size-4 shrink-0" />
              {!isCollapsed ? <span>{item.label}</span> : null}
            </div>
          )
        ))}
      </nav>
    </aside>
  );
}
