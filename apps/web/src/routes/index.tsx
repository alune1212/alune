import { createRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { rootRoute } from "@/routes/__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage
});
