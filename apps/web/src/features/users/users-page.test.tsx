import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersPage } from "@/features/users/users-page";
import { mockAuthValue, paginatedResponse, renderWithQueryClient, successResponse } from "@/test-utils";
import {
  updateUsersStatus,
  type DepartmentPublic,
  type RolePublic,
  type UserManagementItem
} from "@alune/api-client";
import {
  useGetDepartmentsApiV1DepartmentsGet,
  useGetUserRolesApiV1UsersUserIdRolesGet,
  useGetRolesApiV1RolesGet,
  useGetUsersApiV1UsersGet
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserPassword: vi.fn(),
    updateUserRoles: vi.fn(),
    updateUsersStatus: vi.fn()
  };
});

vi.mock("@alune/api-client/generated", () => ({
  useGetDepartmentsApiV1DepartmentsGet: vi.fn(),
  useGetUserRolesApiV1UsersUserIdRolesGet: vi.fn(),
  useGetRolesApiV1RolesGet: vi.fn(),
  useGetUsersApiV1UsersGet: vi.fn()
}));

const users: UserManagementItem[] = [
  {
    id: "user-1",
    username: "alice",
    email: "alice@example.com",
    full_name: "Alice",
    department_id: null,
    is_active: true,
    is_superuser: false
  },
  {
    id: "user-2",
    username: "bob",
    email: "bob@example.com",
    full_name: "Bob",
    department_id: null,
    is_active: true,
    is_superuser: false
  }
];

const roles: RolePublic[] = [];
const departments: DepartmentPublic[] = [];

describe("UsersPage bulk status operations", () => {
  beforeEach(() => {
    vi.mocked(useGetUsersApiV1UsersGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(users) },
      isError: false
    } as ReturnType<typeof useGetUsersApiV1UsersGet>);
    vi.mocked(useGetRolesApiV1RolesGet).mockReturnValue({
      data: { status: 200, data: successResponse(roles) },
      isError: false
    } as ReturnType<typeof useGetRolesApiV1RolesGet>);
    vi.mocked(useGetDepartmentsApiV1DepartmentsGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(departments, 100) },
      isError: false
    } as ReturnType<typeof useGetDepartmentsApiV1DepartmentsGet>);
    vi.mocked(useGetUserRolesApiV1UsersUserIdRolesGet).mockReturnValue({
      data: { status: 200, data: successResponse({ user_id: "user-1", role_codes: [] }) },
      isError: false
    } as ReturnType<typeof useGetUserRolesApiV1UsersUserIdRolesGet>);
    vi.mocked(updateUsersStatus).mockResolvedValue(successResponse({ updated_count: 2 }));
  });

  it("requires confirmation before disabling selected users and shows the result", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<UsersPage />);

    await screen.findByText("alice");
    await user.click(screen.getByRole("button", { name: "Select page" }));
    await user.click(screen.getByRole("button", { name: "Disable selected" }));

    expect(updateUsersStatus).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Confirm bulk status change" })).toBeInTheDocument();
    expect(screen.getByText("Disable 2 selected users?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm disable" }));

    expect(updateUsersStatus).toHaveBeenCalledWith("test-token", {
      user_ids: ["user-1", "user-2"],
      is_active: false
    });
    expect(await screen.findByText("Updated 2 users.")).toBeInTheDocument();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });
});
