import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { DictionariesPage } from "@/features/dictionaries/dictionaries-page";
import { rootRoute } from "@/routes/__root";

export const dictionariesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dictionaries",
  component: () => (
    <ProtectedPage permission="menu:dictionaries">
      <DictionariesPage />
    </ProtectedPage>
  ),
});
