import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { UsersPage } from "@/features/users/users-page";
import { rootRoute } from "@/routes/__root";

function ProtectedUsersRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <UsersPage />
      </AppShell>
    </RequireAuth>
  );
}

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: ProtectedUsersRoute
});
