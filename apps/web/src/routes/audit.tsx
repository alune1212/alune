import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { AuditPage } from "@/features/audit/audit-page";
import { rootRoute } from "@/routes/__root";

function ProtectedAuditRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <AuditPage />
      </AppShell>
    </RequireAuth>
  );
}

export const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: ProtectedAuditRoute
});
