import { type CSSProperties, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUiStore } from "@/stores/ui-store";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-950"
      style={{ "--sidebar-width": isSidebarCollapsed ? "5rem" : "16rem" } as CSSProperties}
    >
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-[var(--sidebar-width)]">
        <Topbar />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
