import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { FilesPage } from "@/features/files/files-page";
import { rootRoute } from "@/routes/__root";

function ProtectedFilesRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <FilesPage />
      </AppShell>
    </RequireAuth>
  );
}

export const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/files",
  component: ProtectedFilesRoute
});
