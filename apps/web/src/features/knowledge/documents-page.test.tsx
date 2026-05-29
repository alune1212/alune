import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentsPage } from "@/features/knowledge/documents-page";
import {
  mockAuthValue,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  useDeleteKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdDelete,
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
  useIndexKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdIndexPost,
  useListKnowledgeDocumentsApiV1KnowledgeBasesKnowledgeBaseIdDocumentsGet,
  useUploadKnowledgeDocumentApiV1KnowledgeBasesKnowledgeBaseIdDocumentsUploadPost,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useDeleteKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdDelete: vi.fn(),
  useGetKnowledgeBasesApiV1KnowledgeBasesGet: vi.fn(),
  useIndexKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdIndexPost: vi.fn(),
  useListKnowledgeDocumentsApiV1KnowledgeBasesKnowledgeBaseIdDocumentsGet:
    vi.fn(),
  useUploadKnowledgeDocumentApiV1KnowledgeBasesKnowledgeBaseIdDocumentsUploadPost:
    vi.fn(),
}));

const indexMutate = vi.fn();

describe("DocumentsPage indexing", () => {
  beforeEach(() => {
    indexMutate.mockReset();
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
          ],
          page: 1,
          page_size: 50,
          total: 1,
        }),
      },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetKnowledgeBasesApiV1KnowledgeBasesGet
    >);
    vi.mocked(
      useListKnowledgeDocumentsApiV1KnowledgeBasesKnowledgeBaseIdDocumentsGet,
    ).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({
          items: [
            {
              id: "doc-guide",
              knowledge_base_id: "base-product",
              file_attachment_id: "file-guide",
              title: "指南.md",
              source_type: "upload",
              status: "failed",
              error_message: "AI 服务未配置",
              chunk_count: 0,
              created_by_id: "user-owner",
              created_at: "2026-05-29T00:00:00Z",
              updated_at: "2026-05-29T00:00:00Z",
            },
          ],
          page: 1,
          page_size: 50,
          total: 1,
        }),
      },
      isError: false,
    } as unknown as ReturnType<
      typeof useListKnowledgeDocumentsApiV1KnowledgeBasesKnowledgeBaseIdDocumentsGet
    >);
    vi.mocked(
      useUploadKnowledgeDocumentApiV1KnowledgeBasesKnowledgeBaseIdDocumentsUploadPost,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUploadKnowledgeDocumentApiV1KnowledgeBasesKnowledgeBaseIdDocumentsUploadPost
    >);
    vi.mocked(
      useDeleteKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdDelete,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useDeleteKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdDelete
    >);
    vi.mocked(
      useIndexKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdIndexPost,
    ).mockReturnValue({
      mutate: indexMutate,
      isPending: false,
    } as unknown as ReturnType<
      typeof useIndexKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdIndexPost
    >);
  });

  it("re-indexes a failed document", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<DocumentsPage />);

    await screen.findByText("指南.md");
    await user.click(screen.getByRole("button", { name: "重新索引" }));

    await waitFor(() => {
      expect(indexMutate).toHaveBeenCalledWith({ documentId: "doc-guide" });
    });
  });
});
