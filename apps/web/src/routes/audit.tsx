import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { AuditPage } from "@/features/audit/audit-page";
import { rootRoute } from "@/routes/__root";

export const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: () => (
    <ProtectedPage permission="menu:audit">
      <AuditPage />
    </ProtectedPage>
  ),
});
