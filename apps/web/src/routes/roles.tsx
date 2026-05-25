import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { RolesPage } from "@/features/roles/roles-page";
import { rootRoute } from "@/routes/__root";

function ProtectedRolesRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:roles" fallback={<ForbiddenPage />}>
          <RolesPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roles",
  component: ProtectedRolesRoute
});
