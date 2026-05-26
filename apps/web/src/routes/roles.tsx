import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { RolesPage } from "@/features/roles/roles-page";
import { rootRoute } from "@/routes/__root";

export const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roles",
  component: () => (
    <ProtectedPage permission="menu:roles">
      <RolesPage />
    </ProtectedPage>
  ),
});
