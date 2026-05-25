import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";
import { DictionariesPage } from "@/features/dictionaries/dictionaries-page";
import { rootRoute } from "@/routes/__root";

function ProtectedDictionariesRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission="menu:dictionaries" fallback={<ForbiddenPage />}>
          <DictionariesPage />
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}

export const dictionariesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dictionaries",
  component: ProtectedDictionariesRoute
});
