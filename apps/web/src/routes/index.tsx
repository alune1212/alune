import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { rootRoute } from "@/routes/__root";

function ProtectedDashboardRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:dashboard" fallback={<ForbiddenPage />}>
          <DashboardPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProtectedDashboardRoute
});
