import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uiCopy } from "@/config/ui-copy";
import { useAuth } from "@/features/auth/auth-provider";
import {
  type DepartmentPublic,
  type RolePublic,
  type UserManagementItem,
} from "@alune/api-client/generated";
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
} from "@alune/api-client/generated";

type BulkStatusAction = {
  isActive: boolean;
  userIds: string[];
};

export function UsersPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [pendingBulkStatusAction, setPendingBulkStatusAction] =
    useState<BulkStatusAction | null>(null);
  const [bulkStatusResult, setBulkStatusResult] = useState<string | null>(null);
  const authRequest = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const usersQuery = useGetUsersApiV1UsersGet(
    {
      q: search || undefined,
      role_code: roleFilter || undefined,
      department_id: departmentFilter || undefined,
      page,
      page_size: 10,
    },
    {
      query: {
        queryKey: [
          "internal",
          "users",
          search,
          roleFilter,
          departmentFilter,
          page,
        ],
        enabled: auth.token !== null,
      },
      request: authRequest,
    },
  );
  const rolesQuery = useGetRolesApiV1RolesGet({
    query: {
      queryKey: ["internal", "roles"],
      enabled: auth.token !== null,
    },
    request: authRequest,
  });
  const departmentsQuery = useGetDepartmentsApiV1DepartmentsGet(
    { page_size: 100 },
    {
      query: {
        queryKey: ["internal", "departments", "for-users"],
        enabled: auth.token !== null,
      },
      request: authRequest,
    },
  );
  const userRolesQuery = useGetUserRolesApiV1UsersUserIdRolesGet(
    selectedUserId ?? "",
    {
      query: {
        queryKey: ["internal", "users", selectedUserId, "roles"],
        enabled: auth.token !== null && selectedUserId !== null,
      },
      request: authRequest,
    },
  );
  const createUserMutation = useCreateUserApiV1UsersPost({
    mutation: {
      onSuccess: () => {
        setUsername("");
        setEmail("");
        setFullName("");
        setPassword("");
        queryClient.invalidateQueries({ queryKey: ["internal", "users"] });
      },
    },
    request: authRequest,
  });
  const updateUserMutation = useUpdateUserApiV1UsersUserIdPatch({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["internal", "users"] }),
    },
    request: authRequest,
  });
  const bulkStatusMutation = useUpdateUsersStatusApiV1UsersBulkStatusPatch({
    mutation: {
      onSuccess: (response) => {
        if (response.status !== 200) {
          return;
        }
        setSelectedUserIds([]);
        setPendingBulkStatusAction(null);
        setBulkStatusResult(
          `已更新 ${response.data.data.updated_count} 个用户。`,
        );
        queryClient.invalidateQueries({ queryKey: ["internal", "users"] });
      },
    },
    request: authRequest,
  });
  const resetPasswordMutation =
    useUpdateUserPasswordApiV1UsersUserIdPasswordPatch({
      mutation: {
        onSuccess: () => {
          setResetPassword("");
          queryClient.invalidateQueries({ queryKey: ["internal", "users"] });
        },
      },
      request: authRequest,
    });
  const updateRolesMutation = useUpdateUserRolesApiV1UsersUserIdRolesPut({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["internal", "users", selectedUserId, "roles"],
        });
        queryClient.invalidateQueries({ queryKey: ["current-user"] });
      },
    },
    request: authRequest,
  });

  function submitCreateUser() {
    createUserMutation.mutate({
      data: {
        username,
        email,
        full_name: fullName || null,
        password,
      },
    });
  }

  const toggleUserStatus = useCallback(
    (user: UserManagementItem) => {
      updateUserMutation.mutate({
        userId: user.id,
        data: { is_active: !user.is_active },
      });
    },
    [updateUserMutation],
  );

  function confirmBulkStatusChange(action: BulkStatusAction) {
    bulkStatusMutation.mutate({
      data: {
        user_ids: action.userIds,
        is_active: action.isActive,
      },
    });
  }

  function saveSelectedUser() {
    if (selectedUserId === null) {
      return;
    }
    updateUserMutation.mutate({
      userId: selectedUserId,
      data: {
        email: editEmail,
        full_name: editFullName || null,
        department_id: editDepartmentId || null,
      },
    });
  }

  function submitPasswordReset() {
    if (selectedUserId === null) {
      return;
    }
    resetPasswordMutation.mutate({
      userId: selectedUserId,
      data: { password: resetPassword },
    });
  }

  const usersPage =
    usersQuery.data?.status === 200 ? usersQuery.data.data.data : undefined;
  const users = usersPage?.items ?? [];
  const totalPages = usersPage
    ? Math.max(1, Math.ceil(usersPage.total / usersPage.page_size))
    : 1;
  const roles = rolesQuery.data?.data.data ?? [];
  const departmentsPage =
    departmentsQuery.data?.status === 200
      ? departmentsQuery.data.data.data
      : undefined;
  const departments = departmentsPage?.items ?? [];
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const selectedRoleCodes =
    userRolesQuery.data?.status === 200
      ? userRolesQuery.data.data.data.role_codes
      : [];
  const selectedUserIdSet = useMemo(
    () => new Set(selectedUserIds),
    [selectedUserIds],
  );
  const userColumns = useMemo<ColumnDef<UserManagementItem>[]>(
    () => [
      {
        id: "select",
        header: "选择",
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`选择 ${row.original.username}`}
            checked={selectedUserIdSet.has(row.original.id)}
            onChange={() => toggleSelectedUser(row.original.id)}
            className="h-4 w-4 rounded border-slate-300"
          />
        ),
      },
      {
        accessorKey: "username",
        header: uiCopy.fields.username,
        cell: ({ row }) => (
          <span className="font-medium text-slate-950">
            {row.original.username}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: uiCopy.common.email,
      },
      {
        accessorKey: "full_name",
        header: uiCopy.fields.fullName,
        cell: ({ row }) => row.original.full_name ?? "-",
      },
      {
        accessorKey: "department_id",
        header: uiCopy.fields.department,
        cell: ({ row }) =>
          row.original.department_id
            ? uiCopy.common.assigned
            : uiCopy.common.unassigned,
      },
      {
        accessorKey: "is_active",
        header: uiCopy.common.status,
        cell: ({ row }) =>
          row.original.is_active
            ? uiCopy.common.active
            : uiCopy.common.inactive,
      },
      {
        accessorKey: "is_superuser",
        header: uiCopy.fields.admin,
        cell: ({ row }) =>
          row.original.is_superuser ? uiCopy.common.yes : uiCopy.common.no,
      },
      {
        id: "actions",
        header: uiCopy.common.actions,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toggleUserStatus(row.original)}
            >
              {row.original.is_active
                ? uiCopy.common.disable
                : uiCopy.common.enable}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedUserId(row.original.id)}
            >
              角色
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => startEdit(row.original)}
            >
              {uiCopy.common.edit}
            </Button>
          </div>
        ),
      },
    ],
    [selectedUserIdSet, toggleUserStatus],
  );

  function toggleRole(role: RolePublic) {
    if (selectedUserId === null) {
      return;
    }
    const nextRoleCodes = selectedRoleCodes.includes(role.code)
      ? selectedRoleCodes.filter((code) => code !== role.code)
      : [...selectedRoleCodes, role.code];
    updateRolesMutation.mutate({
      userId: selectedUserId,
      data: { role_codes: nextRoleCodes },
    });
  }

  function startEdit(user: UserManagementItem) {
    setSelectedUserId(user.id);
    setEditEmail(user.email);
    setEditFullName(user.full_name ?? "");
    setEditDepartmentId(user.department_id ?? "");
  }

  function toggleSelectedUser(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function toggleCurrentPageSelection() {
    const pageUserIds = users.map((user) => user.id);
    const everyPageUserSelected = pageUserIds.every((userId) =>
      selectedUserIdSet.has(userId),
    );
    setSelectedUserIds((current) => {
      if (everyPageUserSelected) {
        return current.filter((userId) => !pageUserIds.includes(userId));
      }
      return [...new Set([...current, ...pageUserIds])];
    });
  }

  function requestBulkStatusChange(isActive: boolean) {
    setBulkStatusResult(null);
    setPendingBulkStatusAction({
      isActive,
      userIds: selectedUserIds,
    });
  }

  function selectDepartment(department: DepartmentPublic) {
    setEditDepartmentId(department.id);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.users}
        </h1>
        <p className="mt-2 text-sm text-slate-600">内部平台中的账号列表。</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>创建用户</CardTitle>
          <CardDescription>添加一个带初始密码的本地账号。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={uiCopy.fields.username}
          />
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={uiCopy.common.email}
          />
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder={uiCopy.fields.fullName}
          />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={uiCopy.fields.initialPassword}
            type="password"
          />
          <Button
            type="button"
            onClick={submitCreateUser}
            disabled={!username || !email || password.length < 8}
          >
            {uiCopy.common.create}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>编辑用户</CardTitle>
          <CardDescription>
            {selectedUser
              ? `更新 ${selectedUser.username} 的资料字段`
              : "从表格中选择“编辑”。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              value={editEmail}
              onChange={(event) => setEditEmail(event.target.value)}
              placeholder={uiCopy.common.email}
            />
            <Input
              value={editFullName}
              onChange={(event) => setEditFullName(event.target.value)}
              placeholder={uiCopy.fields.fullName}
            />
            <Input
              value={editDepartmentId}
              onChange={(event) => setEditDepartmentId(event.target.value)}
              placeholder={uiCopy.fields.departmentId}
            />
            <Button
              type="button"
              onClick={saveSelectedUser}
              disabled={
                !selectedUserId || !editEmail || updateUserMutation.isPending
              }
            >
              {uiCopy.common.save}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {departments.map((department) => (
              <Button
                key={department.id}
                type="button"
                variant={
                  editDepartmentId === department.id ? "default" : "outline"
                }
                disabled={!selectedUserId}
                onClick={() => selectDepartment(department)}
              >
                {department.name}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={!selectedUserId}
              onClick={() => setEditDepartmentId("")}
            >
              清空空间
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder={uiCopy.fields.newPassword}
              type="password"
            />
            <Button
              type="button"
              variant="outline"
              onClick={submitPasswordReset}
              disabled={
                !selectedUserId ||
                resetPassword.length < 8 ||
                resetPasswordMutation.isPending
              }
            >
              重置密码
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>用户角色</CardTitle>
          <CardDescription>
            {selectedUser
              ? `为 ${selectedUser.username} 分配角色`
              : "从表格中选择用户。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Button
              key={role.id}
              type="button"
              variant={
                selectedRoleCodes.includes(role.code) ? "default" : "outline"
              }
              disabled={
                !selectedUserId ||
                userRolesQuery.isLoading ||
                updateRolesMutation.isPending
              }
              onClick={() => toggleRole(role)}
            >
              {role.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>用户目录</CardTitle>
          <CardDescription>{usersPage?.total ?? 0} 个用户</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="搜索用户名、邮箱或姓名"
            />
            <Input
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              placeholder={uiCopy.fields.roleCode}
            />
            <Input
              value={departmentFilter}
              onChange={(event) => {
                setDepartmentFilter(event.target.value);
                setPage(1);
              }}
              placeholder={uiCopy.fields.departmentId}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {uiCopy.common.previous}
              </Button>
              <span className="min-w-20 text-center text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                {uiCopy.common.next}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={users.length === 0}
              onClick={toggleCurrentPageSelection}
            >
              {users.every((user) => selectedUserIdSet.has(user.id)) &&
              users.length > 0
                ? "清空本页"
                : "选择本页"}
            </Button>
            <span className="text-sm text-slate-500">
              {uiCopy.pagination.selectedCount(selectedUserIds.length)}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={
                selectedUserIds.length === 0 || bulkStatusMutation.isPending
              }
              onClick={() => requestBulkStatusChange(true)}
            >
              启用选中用户
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                selectedUserIds.length === 0 || bulkStatusMutation.isPending
              }
              onClick={() => requestBulkStatusChange(false)}
            >
              停用选中用户
            </Button>
          </div>
          {bulkStatusResult ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {bulkStatusResult}
            </p>
          ) : null}
          {pendingBulkStatusAction ? (
            <div
              aria-labelledby="bulk-status-confirm-title"
              aria-modal="true"
              className="rounded-md border border-slate-200 bg-slate-50 p-4 shadow-sm"
              role="dialog"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    id="bulk-status-confirm-title"
                    className="text-sm font-semibold text-slate-950"
                  >
                    确认批量状态变更
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    确定要{pendingBulkStatusAction.isActive ? "启用" : "停用"}{" "}
                    {pendingBulkStatusAction.userIds.length} 个选中用户吗？
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={bulkStatusMutation.isPending}
                    onClick={() => setPendingBulkStatusAction(null)}
                  >
                    {uiCopy.common.cancel}
                  </Button>
                  <Button
                    type="button"
                    variant={
                      pendingBulkStatusAction.isActive
                        ? "default"
                        : "destructive"
                    }
                    disabled={bulkStatusMutation.isPending}
                    onClick={() =>
                      confirmBulkStatusChange(pendingBulkStatusAction)
                    }
                  >
                    {pendingBulkStatusAction.isActive ? "确认启用" : "确认停用"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {usersQuery.isError ? (
            <p className="text-sm text-red-600">{uiCopy.errors.loadUsers}</p>
          ) : (
            <DataTable
              columns={userColumns}
              data={users}
              emptyLabel={uiCopy.empty.users}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
