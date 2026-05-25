import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { DepartmentsPage } from "@/features/departments/departments-page";
import { rootRoute } from "@/routes/__root";

function ProtectedDepartmentsRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:departments" fallback={<ForbiddenPage />}>
          <DepartmentsPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/departments",
  component: ProtectedDepartmentsRoute
});
