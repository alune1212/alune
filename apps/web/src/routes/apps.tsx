import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { AppsPage } from "@/features/apps/apps-page";
import { rootRoute } from "@/routes/__root";

export const appsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apps",
  component: () => (
    <ProtectedPage permission="menu:apps">
      <AppsPage />
    </ProtectedPage>
  ),
});
