import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RolesPage } from "@/features/roles/roles-page";
import { mockAuthValue, renderWithQueryClient, successResponse } from "@/test-utils";
import {
  type PermissionPublic,
  type RolePublic
} from "@alune/api-client";
import {
  useGetPermissionsApiV1RolesPermissionsGet,
  useGetRolePermissionsApiV1RolesRoleIdPermissionsGet,
  useGetRolesApiV1RolesGet
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    createRole: vi.fn(),
    deleteRole: vi.fn(),
    updateRole: vi.fn(),
    updateRolePermissions: vi.fn()
  };
});

vi.mock("@alune/api-client/generated", () => ({
  useGetPermissionsApiV1RolesPermissionsGet: vi.fn(),
  useGetRolePermissionsApiV1RolesRoleIdPermissionsGet: vi.fn(),
  useGetRolesApiV1RolesGet: vi.fn()
}));

const roles: RolePublic[] = [
  {
    id: "role-admin",
    code: "admin",
    name: "Admin",
    description: "Administrator",
    is_system: true
  }
];

const permissions: PermissionPublic[] = [
  {
    id: "permission-dashboard",
    code: "dashboard:view",
    name: "Dashboard",
    type: "menu",
    description: "Open dashboard"
  },
  {
    id: "permission-users",
    code: "users:update",
    name: "Update users",
    type: "action",
    description: "Change users"
  }
];

describe("RolesPage permission assignment", () => {
  beforeEach(() => {
    vi.mocked(useGetRolesApiV1RolesGet).mockReturnValue({
      data: { status: 200, data: successResponse(roles) },
      isError: false
    } as ReturnType<typeof useGetRolesApiV1RolesGet>);
    vi.mocked(useGetPermissionsApiV1RolesPermissionsGet).mockReturnValue({
      data: { status: 200, data: successResponse(permissions) },
      isError: false
    } as ReturnType<typeof useGetPermissionsApiV1RolesPermissionsGet>);
    vi.mocked(useGetRolePermissionsApiV1RolesRoleIdPermissionsGet).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({
          role_id: "role-admin",
          permission_codes: ["dashboard:view"]
        })
      },
      isError: false
    } as ReturnType<typeof useGetRolePermissionsApiV1RolesRoleIdPermissionsGet>);
  });

  it("groups permissions by type and shows an empty state when search has no matches", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<RolesPage />);

    await screen.findByText("admin");
    await user.click(screen.getByRole("button", { name: "Configure" }));

    expect(screen.getByRole("heading", { name: "menu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "action" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search permissions"), "users");

    expect(screen.getByText("users:update")).toBeInTheDocument();
    expect(screen.queryByText("dashboard:view")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search permissions"));
    await user.type(screen.getByPlaceholderText("Search permissions"), "missing");

    expect(screen.getByText("No permissions match this search.")).toBeInTheDocument();
  });
});
