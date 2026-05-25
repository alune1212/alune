import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { AuditPage } from "@/features/audit/audit-page";
import { rootRoute } from "@/routes/__root";

function ProtectedAuditRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:audit" fallback={<ForbiddenPage />}>
          <AuditPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: ProtectedAuditRoute
});
