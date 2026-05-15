import { createRootRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const rootRoute = createRootRoute({
  component: RootLayout
});
