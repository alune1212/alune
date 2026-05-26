import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersPage } from "@/features/users/users-page";
import {
  mockAuthValue,
  paginatedResponse,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  useCreateUserApiV1UsersPost,
  useGetDepartmentsApiV1DepartmentsGet,
  useGetUserRolesApiV1UsersUserIdRolesGet,
  useGetRolesApiV1RolesGet,
  useGetUsersApiV1UsersGet,
  useUpdateUserApiV1UsersUserIdPatch,
  useUpdateUserPasswordApiV1UsersUserIdPasswordPatch,
  useUpdateUserRolesApiV1UsersUserIdRolesPut,
  useUpdateUsersStatusApiV1UsersBulkStatusPatch,
  type DepartmentPublic,
  type RolePublic,
  type UserManagementItem,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useCreateUserApiV1UsersPost: vi.fn(),
  useGetDepartmentsApiV1DepartmentsGet: vi.fn(),
  useGetUserRolesApiV1UsersUserIdRolesGet: vi.fn(),
  useGetRolesApiV1RolesGet: vi.fn(),
  useGetUsersApiV1UsersGet: vi.fn(),
  useUpdateUserApiV1UsersUserIdPatch: vi.fn(),
  useUpdateUserPasswordApiV1UsersUserIdPasswordPatch: vi.fn(),
  useUpdateUserRolesApiV1UsersUserIdRolesPut: vi.fn(),
  useUpdateUsersStatusApiV1UsersBulkStatusPatch: vi.fn(),
}));

const users: UserManagementItem[] = [
  {
    id: "user-1",
    username: "alice",
    email: "alice@example.com",
    full_name: "Alice",
    department_id: null,
    is_active: true,
    is_superuser: false,
  },
  {
    id: "user-2",
    username: "bob",
    email: "bob@example.com",
    full_name: "Bob",
    department_id: null,
    is_active: true,
    is_superuser: false,
  },
];

const roles: RolePublic[] = [];
const departments: DepartmentPublic[] = [];
const updateUsersStatusMutate = vi.fn();

describe("UsersPage bulk status operations", () => {
  beforeEach(() => {
    updateUsersStatusMutate.mockReset();
    vi.mocked(useGetUsersApiV1UsersGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(users) },
      isError: false,
    } as unknown as ReturnType<typeof useGetUsersApiV1UsersGet>);
    vi.mocked(useGetRolesApiV1RolesGet).mockReturnValue({
      data: { status: 200, data: successResponse(roles) },
      isError: false,
    } as unknown as ReturnType<typeof useGetRolesApiV1RolesGet>);
    vi.mocked(useGetDepartmentsApiV1DepartmentsGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(departments, 100) },
      isError: false,
    } as unknown as ReturnType<typeof useGetDepartmentsApiV1DepartmentsGet>);
    vi.mocked(useGetUserRolesApiV1UsersUserIdRolesGet).mockReturnValue({
      data: {
        status: 200,
        data: successResponse({ user_id: "user-1", role_codes: [] }),
      },
      isError: false,
    } as unknown as ReturnType<typeof useGetUserRolesApiV1UsersUserIdRolesGet>);
    vi.mocked(useCreateUserApiV1UsersPost).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateUserApiV1UsersPost>);
    vi.mocked(useUpdateUserApiV1UsersUserIdPatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserApiV1UsersUserIdPatch>);
    vi.mocked(
      useUpdateUserPasswordApiV1UsersUserIdPasswordPatch,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateUserPasswordApiV1UsersUserIdPasswordPatch
    >);
    vi.mocked(useUpdateUserRolesApiV1UsersUserIdRolesPut).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateUserRolesApiV1UsersUserIdRolesPut
    >);
    vi.mocked(useUpdateUsersStatusApiV1UsersBulkStatusPatch).mockImplementation(
      (options) => {
        updateUsersStatusMutate.mockImplementation((variables) => {
          const onSuccess = options?.mutation?.onSuccess as
            | ((
                data: unknown,
                variables: unknown,
                onMutateResult: unknown,
                context: unknown,
              ) => void)
            | undefined;
          onSuccess?.(
            {
              status: 200,
              data: successResponse({ updated_count: 2 }),
              headers: new Headers(),
            },
            variables,
            undefined,
            {},
          );
        });
        return {
          mutate: updateUsersStatusMutate,
          isPending: false,
        } as unknown as ReturnType<
          typeof useUpdateUsersStatusApiV1UsersBulkStatusPatch
        >;
      },
    );
  });

  it("requires confirmation before disabling selected users and shows the result", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<UsersPage />);

    await screen.findByText("alice");
    await user.click(screen.getByRole("button", { name: "选择本页" }));
    await user.click(screen.getByRole("button", { name: "停用选中用户" }));

    expect(updateUsersStatusMutate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "确认批量状态变更" }),
    ).toBeInTheDocument();
    expect(screen.getByText("确定要停用 2 个选中用户吗？")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认停用" }));

    expect(updateUsersStatusMutate).toHaveBeenCalledWith({
      data: {
        user_ids: ["user-1", "user-2"],
        is_active: false,
      },
    });
    expect(await screen.findByText("已更新 2 个用户。")).toBeInTheDocument();
    expect(screen.getByText("已选择 0 个")).toBeInTheDocument();
  });
});
