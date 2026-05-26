import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DictionariesPage } from "@/features/dictionaries/dictionaries-page";
import {
  mockAuthValue,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  useCreateDictionaryItemApiV1DictionariesItemsPost,
  useCreateDictionaryTypeApiV1DictionariesTypesPost,
  useDeleteDictionaryItemApiV1DictionariesItemsItemIdDelete,
  useDeleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete,
  useGetDictionaryItemsApiV1DictionariesItemsGet,
  useGetDictionaryTypesApiV1DictionariesTypesGet,
  useUpdateDictionaryItemApiV1DictionariesItemsItemIdPatch,
  useUpdateDictionaryTypeApiV1DictionariesTypesTypeIdPatch,
  type DictionaryItemPublic,
  type DictionaryTypePublic,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useCreateDictionaryItemApiV1DictionariesItemsPost: vi.fn(),
  useCreateDictionaryTypeApiV1DictionariesTypesPost: vi.fn(),
  useDeleteDictionaryItemApiV1DictionariesItemsItemIdDelete: vi.fn(),
  useDeleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete: vi.fn(),
  useGetDictionaryItemsApiV1DictionariesItemsGet: vi.fn(),
  useGetDictionaryTypesApiV1DictionariesTypesGet: vi.fn(),
  useUpdateDictionaryItemApiV1DictionariesItemsItemIdPatch: vi.fn(),
  useUpdateDictionaryTypeApiV1DictionariesTypesTypeIdPatch: vi.fn(),
}));

const dictionaryTypes: DictionaryTypePublic[] = [
  {
    id: "type-status",
    code: "employee_status",
    name: "Employee status",
    description: "Employee status values",
    is_system: false,
  },
];

const dictionaryItems: DictionaryItemPublic[] = [
  {
    id: "item-active",
    type_id: "type-status",
    label: "Active",
    value: "active",
    sort_order: 1,
    is_active: true,
  },
];
const createDictionaryTypeMutate = vi.fn();

describe("DictionariesPage", () => {
  beforeEach(() => {
    createDictionaryTypeMutate.mockReset();
    vi.mocked(useGetDictionaryTypesApiV1DictionariesTypesGet).mockReturnValue({
      data: { status: 200, data: successResponse(dictionaryTypes) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetDictionaryTypesApiV1DictionariesTypesGet
    >);
    vi.mocked(useGetDictionaryItemsApiV1DictionariesItemsGet).mockReturnValue({
      data: { status: 200, data: successResponse(dictionaryItems) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetDictionaryItemsApiV1DictionariesItemsGet
    >);
    vi.mocked(
      useCreateDictionaryTypeApiV1DictionariesTypesPost,
    ).mockReturnValue({
      mutate: createDictionaryTypeMutate,
      isPending: false,
    } as unknown as ReturnType<
      typeof useCreateDictionaryTypeApiV1DictionariesTypesPost
    >);
    vi.mocked(
      useCreateDictionaryItemApiV1DictionariesItemsPost,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useCreateDictionaryItemApiV1DictionariesItemsPost
    >);
    vi.mocked(
      useDeleteDictionaryItemApiV1DictionariesItemsItemIdDelete,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useDeleteDictionaryItemApiV1DictionariesItemsItemIdDelete
    >);
    vi.mocked(
      useDeleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useDeleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete
    >);
    vi.mocked(
      useUpdateDictionaryItemApiV1DictionariesItemsItemIdPatch,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateDictionaryItemApiV1DictionariesItemsItemIdPatch
    >);
    vi.mocked(
      useUpdateDictionaryTypeApiV1DictionariesTypesTypeIdPatch,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateDictionaryTypeApiV1DictionariesTypesTypeIdPatch
    >);
  });

  it("creates a dictionary type with the entered code and name", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<DictionariesPage />);

    await screen.findByText("employee_status");
    await user.type(
      screen.getAllByPlaceholderText("编码")[0]!,
      "contract_type",
    );
    await user.type(
      screen.getAllByPlaceholderText("名称")[0]!,
      "Contract type",
    );
    await user.click(screen.getAllByRole("button", { name: "创建" })[0]!);

    await waitFor(() => {
      expect(createDictionaryTypeMutate).toHaveBeenCalledWith({
        data: {
          code: "contract_type",
          name: "Contract type",
        },
      });
    });
  });
});
