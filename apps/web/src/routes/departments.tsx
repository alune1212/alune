import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { DepartmentsPage } from "@/features/departments/departments-page";
import { rootRoute } from "@/routes/__root";

export const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/departments",
  component: () => (
    <ProtectedPage permission="menu:departments">
      <DepartmentsPage />
    </ProtectedPage>
  ),
});
