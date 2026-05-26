import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { FilesPage } from "@/features/files/files-page";
import { rootRoute } from "@/routes/__root";

export const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/files",
  component: () => (
    <ProtectedPage permission="menu:files">
      <FilesPage />
    </ProtectedPage>
  ),
});
