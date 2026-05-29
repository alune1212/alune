import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { DocumentsPage } from "@/features/knowledge/documents-page";
import { rootRoute } from "@/routes/__root";

export const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents",
  component: () => (
    <ProtectedPage permission="menu:documents">
      <DocumentsPage />
    </ProtectedPage>
  ),
});
