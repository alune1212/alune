import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RolesPage } from "@/features/roles/roles-page";
import {
  mockAuthValue,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  useCreateRoleApiV1RolesPost,
  useDeleteRoleApiV1RolesRoleIdDelete,
  useGetPermissionsApiV1RolesPermissionsGet,
  useGetRolePermissionsApiV1RolesRoleIdPermissionsGet,
  useGetRolesApiV1RolesGet,
  useUpdateRoleApiV1RolesRoleIdPatch,
  useUpdateRolePermissionsApiV1RolesRoleIdPermissionsPut,
  type PermissionPublic,
  type RolePublic,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useCreateRoleApiV1RolesPost: vi.fn(),
  useDeleteRoleApiV1RolesRoleIdDelete: vi.fn(),
  useGetPermissionsApiV1RolesPermissionsGet: vi.fn(),
  useGetRolePermissionsApiV1RolesRoleIdPermissionsGet: vi.fn(),
  useGetRolesApiV1RolesGet: vi.fn(),
  useUpdateRoleApiV1RolesRoleIdPatch: vi.fn(),
  useUpdateRolePermissionsApiV1RolesRoleIdPermissionsPut: vi.fn(),
}));

const roles: RolePublic[] = [
  {
    id: "role-admin",
    code: "admin",
    name: "Admin",
    description: "Administrator",
    is_system: true,
  },
];

const permissions: PermissionPublic[] = [
  {
    id: "permission-dashboard",
    code: "dashboard:view",
    name: "Dashboard",
    type: "menu",
    description: "Open dashboard",
  },
  {
    id: "permission-users",
    code: "users:update",
    name: "Update users",
    type: "action",
    description: "Change users",
  },
];

describe("RolesPage permission assignment", () => {
  beforeEach(() => {
    vi.mocked(useGetRolesApiV1RolesGet).mockReturnValue({
      data: { status: 200, data: successResponse(roles) },
      isError: false,
    } as unknown as ReturnType<typeof useGetRolesApiV1RolesGet>);
    vi.mocked(useGetPermissionsApiV1RolesPermissionsGet).mockReturnValue({
      data: { status: 200, data: successResponse(permissions) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetPermissionsApiV1RolesPermissionsGet
    >);
    vi.mocked(
      useGetRolePermissionsApiV1RolesRoleIdPermissionsGet,
    ).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({
          role_id: "role-admin",
          permission_codes: ["dashboard:view"],
        }),
      },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetRolePermissionsApiV1RolesRoleIdPermissionsGet
    >);
    vi.mocked(useCreateRoleApiV1RolesPost).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateRoleApiV1RolesPost>);
    vi.mocked(useDeleteRoleApiV1RolesRoleIdDelete).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteRoleApiV1RolesRoleIdDelete>);
    vi.mocked(useUpdateRoleApiV1RolesRoleIdPatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateRoleApiV1RolesRoleIdPatch>);
    vi.mocked(
      useUpdateRolePermissionsApiV1RolesRoleIdPermissionsPut,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateRolePermissionsApiV1RolesRoleIdPermissionsPut
    >);
  });

  it("groups permissions by type and shows an empty state when search has no matches", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<RolesPage />);

    await screen.findByText("admin");
    await user.click(screen.getByRole("button", { name: "配置权限" }));

    expect(screen.getByRole("heading", { name: "menu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "action" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("搜索权限"), "users");

    expect(screen.getByText("users:update")).toBeInTheDocument();
    expect(screen.queryByText("dashboard:view")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("搜索权限"));
    await user.type(screen.getByPlaceholderText("搜索权限"), "missing");

    expect(screen.getByText("没有匹配的权限。")).toBeInTheDocument();
  });
});
