import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { UsersPage } from "@/features/users/users-page";
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
  useAuth: () => ({
    token: "test-token",
    user: null,
    isAuthenticated: true,
    isLoading: false,
    setSession: vi.fn(),
    logout: vi.fn()
  })
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

function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("UsersPage bulk status operations", () => {
  beforeEach(() => {
    vi.mocked(fetchUsers).mockResolvedValue({
      success: true,
      data: {
        items: users,
        page: 1,
        page_size: 10,
        total: users.length
      },
      message: "ok",
      error: null
    });
    vi.mocked(fetchRoles).mockResolvedValue({
      success: true,
      data: roles,
      message: "ok",
      error: null
    });
    vi.mocked(fetchDepartments).mockResolvedValue({
      success: true,
      data: {
        items: departments,
        page: 1,
        page_size: 100,
        total: departments.length
      },
      message: "ok",
      error: null
    });
    vi.mocked(fetchUserRoles).mockResolvedValue({
      success: true,
      data: { user_id: "user-1", role_codes: [] },
      message: "ok",
      error: null
    });
    vi.mocked(updateUsersStatus).mockResolvedValue({
      success: true,
      data: { updated_count: 2 },
      message: "ok",
      error: null
    });
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
