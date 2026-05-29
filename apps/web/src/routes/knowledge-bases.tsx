import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { KnowledgeBasesPage } from "@/features/knowledge/knowledge-bases-page";
import { rootRoute } from "@/routes/__root";

export const knowledgeBasesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/knowledge-bases",
  component: () => (
    <ProtectedPage permission="menu:knowledge">
      <KnowledgeBasesPage />
    </ProtectedPage>
  ),
});
