import { createRoute } from "@tanstack/react-router";

import { ProtectedPage } from "@/features/auth/protected-page";
import { KnowledgeChatPage } from "@/features/knowledge/knowledge-chat-page";
import { rootRoute } from "@/routes/__root";

export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: () => (
    <ProtectedPage permission="menu:rag_chat">
      <KnowledgeChatPage />
    </ProtectedPage>
  ),
});
