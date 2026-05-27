import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppsPage } from "@/features/apps/apps-page";
import { renderWithQueryClient, successResponse } from "@/test-utils";
import {
  useCreatePlatformAppApiV1AppsPost,
  useGetDictionaryItemsApiV1DictionariesItemsGet,
  useGetDictionaryTypesApiV1DictionariesTypesGet,
  useGetPlatformAppsApiV1AppsGet,
  useUpdatePlatformAppApiV1AppsAppIdPatch,
  useUpdatePlatformAppStatusApiV1AppsAppIdStatusPatch,
  type DictionaryItemPublic,
  type DictionaryTypePublic,
  type PlatformAppPublic,
} from "@alune/api-client/generated";

const appAdminPermissions = [
  "action:apps:read",
  "action:apps:create",
  "action:apps:update",
  "action:apps:manage_status",
];

const authValue = {
  token: "test-token",
  user: {
    id: "user-admin",
    username: "admin",
    email: "admin@example.com",
    full_name: "Admin",
    department_id: null,
    is_active: true,
    is_superuser: false,
    permissions: [...appAdminPermissions],
  },
  isAuthenticated: true,
  isLoading: false,
  isSessionExpired: false,
  setSession: vi.fn(),
  logout: vi.fn(),
  clearExpiredFlag: vi.fn(),
};

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => authValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  PlatformAppCreateEntryType: {
    internal: "internal",
    external: "external",
  },
  useCreatePlatformAppApiV1AppsPost: vi.fn(),
  useGetDictionaryItemsApiV1DictionariesItemsGet: vi.fn(),
  useGetDictionaryTypesApiV1DictionariesTypesGet: vi.fn(),
  useGetPlatformAppsApiV1AppsGet: vi.fn(),
  useUpdatePlatformAppApiV1AppsAppIdPatch: vi.fn(),
  useUpdatePlatformAppStatusApiV1AppsAppIdStatusPatch: vi.fn(),
}));

const apps: PlatformAppPublic[] = [
  {
    id: "app-notes",
    code: "notes",
    name: "个人笔记",
    description: "记录日常资料",
    category_code: "tool",
    entry_type: "internal",
    entry_url: "/notes",
    icon: "notebook",
    sort_order: 1,
    is_active: true,
    created_by_id: "user-admin",
    created_at: "2026-05-27T00:00:00Z",
    updated_at: "2026-05-27T00:00:00Z",
  },
];

const categoryTypes: DictionaryTypePublic[] = [
  {
    id: "type-app-category",
    code: "app_category",
    name: "App category",
    description: "App category",
    is_system: true,
  },
];

const categories: DictionaryItemPublic[] = [
  {
    id: "category-tool",
    type_id: "type-app-category",
    label: "工具",
    value: "tool",
    sort_order: 1,
    is_active: true,
  },
];

const createMutate = vi.fn();
const updateMutate = vi.fn();
const statusMutate = vi.fn();

describe("AppsPage", () => {
  beforeEach(() => {
    createMutate.mockReset();
    updateMutate.mockReset();
    statusMutate.mockReset();
    authValue.user.permissions = [...appAdminPermissions];
    vi.mocked(useGetPlatformAppsApiV1AppsGet).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({ items: apps, page: 1, page_size: 20, total: 1 }),
      },
      isError: false,
    } as unknown as ReturnType<typeof useGetPlatformAppsApiV1AppsGet>);
    vi.mocked(useGetDictionaryTypesApiV1DictionariesTypesGet).mockReturnValue({
      data: { status: 200, data: successResponse(categoryTypes) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetDictionaryTypesApiV1DictionariesTypesGet
    >);
    vi.mocked(useGetDictionaryItemsApiV1DictionariesItemsGet).mockReturnValue({
      data: { status: 200, data: successResponse(categories) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetDictionaryItemsApiV1DictionariesItemsGet
    >);
    vi.mocked(useCreatePlatformAppApiV1AppsPost).mockReturnValue({
      mutate: createMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePlatformAppApiV1AppsPost>);
    vi.mocked(useUpdatePlatformAppApiV1AppsAppIdPatch).mockReturnValue({
      mutate: updateMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdatePlatformAppApiV1AppsAppIdPatch>);
    vi.mocked(useUpdatePlatformAppStatusApiV1AppsAppIdStatusPatch).mockReturnValue({
      mutate: statusMutate,
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdatePlatformAppStatusApiV1AppsAppIdStatusPatch
    >);
  });

  afterEach(() => {
    cleanup();
  });

  it("creates an app entry and can disable an active app", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<AppsPage />);

    await screen.findByText("个人笔记");
    await user.type(screen.getByPlaceholderText("应用标识"), "links");
    await user.type(screen.getByPlaceholderText("应用名称"), "链接收藏");
    await user.type(screen.getByPlaceholderText("入口地址"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "创建应用" }));
    await user.click(screen.getByRole("button", { name: "停用" }));
    await user.click(screen.getByRole("button", { name: "编辑" }));
    await user.clear(screen.getByPlaceholderText("应用名称"));
    await user.type(screen.getByPlaceholderText("应用名称"), "资料库");
    await user.click(screen.getByRole("button", { name: "保存应用" }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledWith({
        data: {
          code: "links",
          name: "链接收藏",
          category_code: "tool",
          entry_type: "external",
          entry_url: "https://example.com",
          description: null,
          icon: null,
          sort_order: 0,
          is_active: true,
        },
      });
      expect(statusMutate).toHaveBeenCalledWith({
        appId: "app-notes",
        data: { is_active: false },
      });
      expect(updateMutate).toHaveBeenCalledWith({
        appId: "app-notes",
        data: {
          code: "notes",
          name: "资料库",
          category_code: "tool",
          entry_type: "internal",
          entry_url: "/notes",
          description: "记录日常资料",
          icon: "notebook",
          sort_order: 1,
        },
      });
    });
  });

  it("hides management controls for read-only users", async () => {
    authValue.user.permissions = ["action:apps:read"];

    renderWithQueryClient(<AppsPage />);

    await screen.findByText("个人笔记");
    expect(screen.getByRole("button", { name: "打开入口" })).toBeVisible();
    expect(screen.queryByText("创建应用")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "编辑" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "停用" })).not.toBeInTheDocument();
    expect(screen.queryByText("全部状态")).not.toBeInTheDocument();
  });
});
