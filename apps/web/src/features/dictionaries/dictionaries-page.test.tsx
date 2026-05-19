import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DictionariesPage } from "@/features/dictionaries/dictionaries-page";
import { mockAuthValue, renderWithQueryClient, successResponse } from "@/test-utils";
import {
  createDictionaryType,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  type DictionaryItemPublic,
  type DictionaryTypePublic
} from "@alune/api-client";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    createDictionaryItem: vi.fn(),
    createDictionaryType: vi.fn(),
    deleteDictionaryItem: vi.fn(),
    deleteDictionaryType: vi.fn(),
    fetchDictionaryItems: vi.fn(),
    fetchDictionaryTypes: vi.fn(),
    updateDictionaryItem: vi.fn(),
    updateDictionaryType: vi.fn()
  };
});

const dictionaryTypes: DictionaryTypePublic[] = [
  {
    id: "type-status",
    code: "employee_status",
    name: "Employee status",
    description: "Employee status values",
    is_system: false
  }
];

const dictionaryItems: DictionaryItemPublic[] = [
  {
    id: "item-active",
    type_id: "type-status",
    label: "Active",
    value: "active",
    sort_order: 1,
    is_active: true
  }
];

describe("DictionariesPage", () => {
  beforeEach(() => {
    vi.mocked(fetchDictionaryTypes).mockResolvedValue(successResponse(dictionaryTypes));
    vi.mocked(fetchDictionaryItems).mockResolvedValue(successResponse(dictionaryItems));
    vi.mocked(createDictionaryType).mockResolvedValue(successResponse(dictionaryTypes[0]!));
  });

  it("creates a dictionary type with the entered code and name", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<DictionariesPage />);

    await screen.findByText("employee_status");
    await user.type(screen.getAllByPlaceholderText("Code")[0]!, "contract_type");
    await user.type(screen.getAllByPlaceholderText("Name")[0]!, "Contract type");
    await user.click(screen.getAllByRole("button", { name: "Create" })[0]!);

    await waitFor(() => {
      expect(createDictionaryType).toHaveBeenCalledWith("test-token", {
        code: "contract_type",
        name: "Contract type"
      });
    });
  });
});
