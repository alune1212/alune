import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  createUser,
  updateUser,
  updateUserPassword,
  updateUserRoles,
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
  const [pendingBulkStatusAction, setPendingBulkStatusAction] = useState<BulkStatusAction | null>(null);
  const [bulkStatusResult, setBulkStatusResult] = useState<string | null>(null);
  const authRequest = useMemo(
    () => ({
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined
    }),
    [auth.token]
  );
  const usersQuery = useGetUsersApiV1UsersGet(
    {
      q: search || undefined,
      role_code: roleFilter || undefined,
      department_id: departmentFilter || undefined,
      page,
      page_size: 10
    },
    {
      query: {
        queryKey: ["internal", "users", search, roleFilter, departmentFilter, page],
        enabled: auth.token !== null
      },
      request: authRequest
    }
  );
  const rolesQuery = useGetRolesApiV1RolesGet({
    query: {
      queryKey: ["internal", "roles"],
      enabled: auth.token !== null
    },
    request: authRequest
  });
  const departmentsQuery = useGetDepartmentsApiV1DepartmentsGet(
    { page_size: 100 },
    {
      query: {
        queryKey: ["internal", "departments", "for-users"],
        enabled: auth.token !== null
      },
      request: authRequest
    }
  );
  const userRolesQuery = useGetUserRolesApiV1UsersUserIdRolesGet(selectedUserId ?? "", {
    query: {
      queryKey: ["internal", "users", selectedUserId, "roles"],
      enabled: auth.token !== null && selectedUserId !== null
    },
    request: authRequest
  });
  const createUserMutation = useMutation({
    mutationFn: () =>
      createUser(auth.token!, {
        username,
        email,
        full_name: fullName || null,
        password
      }),
    onSuccess: () => {
      setUsername("");
      setEmail("");
      setFullName("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["internal", "users"] });
    }
  });
  const updateUserMutation = useMutation({
    mutationFn: (user: UserManagementItem) =>
      updateUser(auth.token!, user.id, { is_active: !user.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "users"] })
  });
  const bulkStatusMutation = useMutation({
    mutationFn: (action: BulkStatusAction) =>
      updateUsersStatus(auth.token!, {
        user_ids: action.userIds,
        is_active: action.isActive
      }),
    onSuccess: (response) => {
      setSelectedUserIds([]);
      setPendingBulkStatusAction(null);
      setBulkStatusResult(`Updated ${response.data.updated_count} users.`);
      queryClient.invalidateQueries({ queryKey: ["internal", "users"] });
    }
  });
  const saveUserMutation = useMutation({
    mutationFn: () =>
      updateUser(auth.token!, selectedUserId!, {
        email: editEmail,
        full_name: editFullName || null,
        department_id: editDepartmentId || null
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "users"] })
  });
  const resetPasswordMutation = useMutation({
    mutationFn: () => updateUserPassword(auth.token!, selectedUserId!, { password: resetPassword }),
    onSuccess: () => {
      setResetPassword("");
      queryClient.invalidateQueries({ queryKey: ["internal", "users"] });
    }
  });
  const updateRolesMutation = useMutation({
    mutationFn: (roleCodes: string[]) => updateUserRoles(auth.token!, selectedUserId!, roleCodes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal", "users", selectedUserId, "roles"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    }
  });

  const usersPage = usersQuery.data?.status === 200 ? usersQuery.data.data.data : undefined;
  const users = usersPage?.items ?? [];
  const totalPages = usersPage ? Math.max(1, Math.ceil(usersPage.total / usersPage.page_size)) : 1;
  const roles = rolesQuery.data?.data.data ?? [];
  const departmentsPage = departmentsQuery.data?.status === 200 ? departmentsQuery.data.data.data : undefined;
  const departments = departmentsPage?.items ?? [];
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const selectedRoleCodes = userRolesQuery.data?.status === 200 ? userRolesQuery.data.data.data.role_codes : [];
  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const userColumns = useMemo<ColumnDef<UserManagementItem>[]>(
    () => [
      {
        id: "select",
        header: "Select",
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.username}`}
            checked={selectedUserIdSet.has(row.original.id)}
            onChange={() => toggleSelectedUser(row.original.id)}
            className="h-4 w-4 rounded border-slate-300"
          />
        )
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => <span className="font-medium text-slate-950">{row.original.username}</span>
      },
      {
        accessorKey: "email",
        header: "Email"
      },
      {
        accessorKey: "full_name",
        header: "Full name",
        cell: ({ row }) => row.original.full_name ?? "-"
      },
      {
        accessorKey: "department_id",
        header: "Department",
        cell: ({ row }) => (row.original.department_id ? "Assigned" : "Unassigned")
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive")
      },
      {
        accessorKey: "is_superuser",
        header: "Admin",
        cell: ({ row }) => (row.original.is_superuser ? "Yes" : "No")
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => updateUserMutation.mutate(row.original)}>
              {row.original.is_active ? "Disable" : "Enable"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSelectedUserId(row.original.id)}>
              Roles
            </Button>
            <Button type="button" variant="outline" onClick={() => startEdit(row.original)}>
              Edit
            </Button>
          </div>
        )
      }
    ],
    [selectedUserIdSet, updateUserMutation]
  );

  function toggleRole(role: RolePublic) {
    const nextRoleCodes = selectedRoleCodes.includes(role.code)
      ? selectedRoleCodes.filter((code) => code !== role.code)
      : [...selectedRoleCodes, role.code];
    updateRolesMutation.mutate(nextRoleCodes);
  }

  function startEdit(user: UserManagementItem) {
    setSelectedUserId(user.id);
    setEditEmail(user.email);
    setEditFullName(user.full_name ?? "");
    setEditDepartmentId(user.department_id ?? "");
  }

  function toggleSelectedUser(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  function toggleCurrentPageSelection() {
    const pageUserIds = users.map((user) => user.id);
    const everyPageUserSelected = pageUserIds.every((userId) => selectedUserIdSet.has(userId));
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
      userIds: selectedUserIds
    });
  }

  function selectDepartment(department: DepartmentPublic) {
    setEditDepartmentId(department.id);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Users</h1>
        <p className="mt-2 text-sm text-slate-600">Accounts available in the internal platform.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>Add a local account with an initial password.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Initial password"
            type="password"
          />
          <Button
            type="button"
            onClick={() => createUserMutation.mutate()}
            disabled={!username || !email || password.length < 8}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
          <CardDescription>
            {selectedUser ? `Update profile fields for ${selectedUser.username}` : "Select Edit from the table."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input value={editEmail} onChange={(event) => setEditEmail(event.target.value)} placeholder="Email" />
            <Input
              value={editFullName}
              onChange={(event) => setEditFullName(event.target.value)}
              placeholder="Full name"
            />
            <Input
              value={editDepartmentId}
              onChange={(event) => setEditDepartmentId(event.target.value)}
              placeholder="Department ID"
            />
            <Button
              type="button"
              onClick={() => saveUserMutation.mutate()}
              disabled={!selectedUserId || !editEmail || saveUserMutation.isPending}
            >
              Save
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {departments.map((department) => (
              <Button
                key={department.id}
                type="button"
                variant={editDepartmentId === department.id ? "default" : "outline"}
                disabled={!selectedUserId}
                onClick={() => selectDepartment(department)}
              >
                {department.name}
              </Button>
            ))}
            <Button type="button" variant="outline" disabled={!selectedUserId} onClick={() => setEditDepartmentId("")}>
              Clear department
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="New password"
              type="password"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => resetPasswordMutation.mutate()}
              disabled={!selectedUserId || resetPassword.length < 8 || resetPasswordMutation.isPending}
            >
              Reset password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User roles</CardTitle>
          <CardDescription>
            {selectedUser ? `Assign roles for ${selectedUser.username}` : "Select a user from the table."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Button
              key={role.id}
              type="button"
              variant={selectedRoleCodes.includes(role.code) ? "default" : "outline"}
              disabled={!selectedUserId || userRolesQuery.isLoading || updateRolesMutation.isPending}
              onClick={() => toggleRole(role)}
            >
              {role.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User directory</CardTitle>
          <CardDescription>{usersPage?.total ?? 0} users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search username, email, or full name"
            />
            <Input
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              placeholder="Role code"
            />
            <Input
              value={departmentFilter}
              onChange={(event) => {
                setDepartmentFilter(event.target.value);
                setPage(1);
              }}
              placeholder="Department ID"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous
              </Button>
              <span className="min-w-20 text-center text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled={users.length === 0} onClick={toggleCurrentPageSelection}>
              {users.every((user) => selectedUserIdSet.has(user.id)) && users.length > 0
                ? "Clear page"
                : "Select page"}
            </Button>
            <span className="text-sm text-slate-500">{selectedUserIds.length} selected</span>
            <Button
              type="button"
              variant="outline"
              disabled={selectedUserIds.length === 0 || bulkStatusMutation.isPending}
              onClick={() => requestBulkStatusChange(true)}
            >
              Enable selected
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedUserIds.length === 0 || bulkStatusMutation.isPending}
              onClick={() => requestBulkStatusChange(false)}
            >
              Disable selected
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
                  <h3 id="bulk-status-confirm-title" className="text-sm font-semibold text-slate-950">
                    Confirm bulk status change
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {pendingBulkStatusAction.isActive ? "Enable" : "Disable"}{" "}
                    {pendingBulkStatusAction.userIds.length} selected users?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={bulkStatusMutation.isPending}
                    onClick={() => setPendingBulkStatusAction(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={pendingBulkStatusAction.isActive ? "default" : "destructive"}
                    disabled={bulkStatusMutation.isPending}
                    onClick={() => bulkStatusMutation.mutate(pendingBulkStatusAction)}
                  >
                    {pendingBulkStatusAction.isActive ? "Confirm enable" : "Confirm disable"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {usersQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load users.</p>
          ) : (
            <DataTable columns={userColumns} data={users} emptyLabel="No users found." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
