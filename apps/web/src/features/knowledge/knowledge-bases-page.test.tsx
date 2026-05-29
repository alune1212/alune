import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KnowledgeBasesPage } from "@/features/knowledge/knowledge-bases-page";
import {
  mockAuthValue,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  useCreateKnowledgeBaseApiV1KnowledgeBasesPost,
  useDeleteKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdDelete,
  useGetKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersGet,
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
  useUpdateKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdPatch,
  useUpdateKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersPut,
  type KnowledgeBaseMemberPublic,
  type KnowledgeBasePublic,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useCreateKnowledgeBaseApiV1KnowledgeBasesPost: vi.fn(),
  useDeleteKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdDelete: vi.fn(),
  useGetKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersGet:
    vi.fn(),
  useGetKnowledgeBasesApiV1KnowledgeBasesGet: vi.fn(),
  useUpdateKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdPatch: vi.fn(),
  useUpdateKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersPut:
    vi.fn(),
}));

const knowledgeBases: KnowledgeBasePublic[] = [
  {
    id: "base-product",
    name: "产品知识库",
    description: "产品资料",
    is_active: true,
    created_by_id: "user-owner",
    created_at: "2026-05-29T00:00:00Z",
    updated_at: "2026-05-29T00:00:00Z",
  },
];

const members: KnowledgeBaseMemberPublic[] = [
  {
    id: "member-owner",
    knowledge_base_id: "base-product",
    user_id: "user-owner",
    role: "owner",
    created_at: "2026-05-29T00:00:00Z",
    updated_at: "2026-05-29T00:00:00Z",
  },
];

const updateMembersMutate = vi.fn();

describe("KnowledgeBasesPage member management", () => {
  beforeEach(() => {
    updateMembersMutate.mockReset();
    vi.mocked(useGetKnowledgeBasesApiV1KnowledgeBasesGet).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({
          items: knowledgeBases,
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
      useGetKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersGet,
    ).mockReturnValue({
      data: { status: 200, data: successResponse(members) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersGet
    >);
    vi.mocked(useCreateKnowledgeBaseApiV1KnowledgeBasesPost).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useCreateKnowledgeBaseApiV1KnowledgeBasesPost
    >);
    vi.mocked(
      useUpdateKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdPatch,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdPatch
    >);
    vi.mocked(
      useDeleteKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdDelete,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useDeleteKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdDelete
    >);
    vi.mocked(
      useUpdateKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersPut,
    ).mockReturnValue({
      mutate: updateMembersMutate,
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateKnowledgeBaseMembersApiV1KnowledgeBasesKnowledgeBaseIdMembersPut
    >);
  });

  it("adds a member and saves the complete member list", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<KnowledgeBasesPage />);

    await screen.findByText("产品知识库");
    await user.click(screen.getByRole("button", { name: "管理成员" }));
    await user.type(screen.getByPlaceholderText("用户 ID"), "user-editor");
    await user.selectOptions(screen.getByLabelText("成员角色"), "editor");
    await user.click(screen.getByRole("button", { name: "添加成员" }));
    await user.click(screen.getByRole("button", { name: "保存成员" }));

    await waitFor(() => {
      expect(updateMembersMutate).toHaveBeenCalledWith({
        knowledgeBaseId: "base-product",
        data: {
          members: [
            { user_id: "user-owner", role: "owner" },
            { user_id: "user-editor", role: "editor" },
          ],
        },
      });
    });
  });
});
