import { createRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/require-auth";
import { DictionariesPage } from "@/features/dictionaries/dictionaries-page";
import { rootRoute } from "@/routes/__root";

function ProtectedDictionariesRoute() {
  return (
    <RequireAuth>
      <AppShell>
        <DictionariesPage />
      </AppShell>
    </RequireAuth>
  );
}

export const dictionariesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dictionaries",
  component: ProtectedDictionariesRoute
});
