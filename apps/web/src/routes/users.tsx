import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { UsersPage } from "@/features/users/users-page";
import { rootRoute } from "@/routes/__root";

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: () => (
    <ProtectedPage permission="menu:users">
      <UsersPage />
    </ProtectedPage>
  ),
});
