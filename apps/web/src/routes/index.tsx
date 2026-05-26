import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { rootRoute } from "@/routes/__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <ProtectedPage permission="menu:dashboard">
      <DashboardPage />
    </ProtectedPage>
  ),
});
