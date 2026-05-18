import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { DepartmentsPage } from "@/features/departments/departments-page";
import { rootRoute } from "@/routes/__root";

function ProtectedDepartmentsRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <DepartmentsPage />
      </AppShell>
    </RequireAuth>
  );
}

export const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/departments",
  component: ProtectedDepartmentsRoute
});
