import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { RolesPage } from "@/features/roles/roles-page";
import { rootRoute } from "@/routes/__root";

function ProtectedRolesRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RolesPage />
      </AppShell>
    </RequireAuth>
  );
}

export const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roles",
  component: ProtectedRolesRoute
});
