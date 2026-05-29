import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KnowledgeChatPage } from "@/features/knowledge/knowledge-chat-page";
import {
  mockAuthValue,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  useAskRagApiV1RagAskPost,
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useAskRagApiV1RagAskPost: vi.fn(),
  useGetKnowledgeBasesApiV1KnowledgeBasesGet: vi.fn(),
}));

const askMutate = vi.fn();

describe("KnowledgeChatPage multi-base ask", () => {
  beforeEach(() => {
    askMutate.mockReset();
    vi.mocked(useGetKnowledgeBasesApiV1KnowledgeBasesGet).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({
          items: [
            {
              id: "base-product",
              name: "产品知识库",
              description: null,
              is_active: true,
              created_by_id: "user-owner",
              created_at: "2026-05-29T00:00:00Z",
              updated_at: "2026-05-29T00:00:00Z",
            },
            {
              id: "base-support",
              name: "支持知识库",
              description: null,
              is_active: true,
              created_by_id: "user-owner",
              created_at: "2026-05-29T00:00:00Z",
              updated_at: "2026-05-29T00:00:00Z",
            },
          ],
          page: 1,
          page_size: 50,
          total: 2,
        }),
      },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetKnowledgeBasesApiV1KnowledgeBasesGet
    >);
    vi.mocked(useAskRagApiV1RagAskPost).mockReturnValue({
      mutate: askMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useAskRagApiV1RagAskPost>);
  });

  it("asks across multiple selected knowledge bases", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<KnowledgeChatPage />);

    await screen.findByLabelText("产品知识库");
    await user.click(screen.getByLabelText("支持知识库"));
    await user.type(
      screen.getByPlaceholderText("输入你的问题"),
      "如何处理退款?",
    );
    await user.click(screen.getByRole("button", { name: "提问" }));

    await waitFor(() => {
      expect(askMutate).toHaveBeenCalledWith({
        data: {
          question: "如何处理退款?",
          knowledge_base_ids: ["base-product", "base-support"],
        },
      });
    });
  });
});
