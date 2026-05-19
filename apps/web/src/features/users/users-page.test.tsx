import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersPage } from "@/features/users/users-page";
import { mockAuthValue, paginatedResponse, renderWithQueryClient, successResponse } from "@/test-utils";
import {
  fetchDepartments,
  fetchRoles,
  fetchUserRoles,
  fetchUsers,
  updateUsersStatus,
  type DepartmentPublic,
  type RolePublic,
  type UserManagementItem
} from "@alune/api-client";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    createUser: vi.fn(),
    fetchDepartments: vi.fn(),
    fetchRoles: vi.fn(),
    fetchUserRoles: vi.fn(),
    fetchUsers: vi.fn(),
    updateUser: vi.fn(),
    updateUserPassword: vi.fn(),
    updateUserRoles: vi.fn(),
    updateUsersStatus: vi.fn()
  };
});

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
    vi.mocked(fetchUsers).mockResolvedValue(paginatedResponse(users));
    vi.mocked(fetchRoles).mockResolvedValue(successResponse(roles));
    vi.mocked(fetchDepartments).mockResolvedValue(paginatedResponse(departments, 100));
    vi.mocked(fetchUserRoles).mockResolvedValue(successResponse({ user_id: "user-1", role_codes: [] }));
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
