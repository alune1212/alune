import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { rootRoute } from "@/routes/__root";

function ProtectedDashboardRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </RequireAuth>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProtectedDashboardRoute
});
