import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { UsersPage } from "@/features/users/users-page";
import { rootRoute } from "@/routes/__root";

function ProtectedUsersRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:users" fallback={<ForbiddenPage />}>
          <UsersPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: ProtectedUsersRoute
});
