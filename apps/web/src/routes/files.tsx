import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { FilesPage } from "@/features/files/files-page";
import { rootRoute } from "@/routes/__root";

function ProtectedFilesRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:files" fallback={<ForbiddenPage />}>
          <FilesPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/files",
  component: ProtectedFilesRoute
});
