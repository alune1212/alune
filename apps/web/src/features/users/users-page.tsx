import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  createUser,
  fetchDepartments,
  fetchRoles,
  fetchUserRoles,
  fetchUsers,
  updateUser,
  updateUserPassword,
  updateUserRoles,
  type DepartmentPublic,
  type RolePublic,
  type UserManagementItem
} from "@alune/api-client";

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
  const usersQuery = useQuery({
    queryKey: ["internal", "users", search, roleFilter, departmentFilter, page],
    queryFn: () =>
      fetchUsers(auth.token!, {
        q: search || undefined,
        roleCode: roleFilter || undefined,
        departmentId: departmentFilter || undefined,
        page,
        pageSize: 10
      }),
    enabled: auth.token !== null
  });
  const rolesQuery = useQuery({
    queryKey: ["internal", "roles"],
    queryFn: () => fetchRoles(auth.token!),
    enabled: auth.token !== null
  });
  const departmentsQuery = useQuery({
    queryKey: ["internal", "departments", "for-users"],
    queryFn: () => fetchDepartments(auth.token!, { pageSize: 100 }),
    enabled: auth.token !== null
  });
  const userRolesQuery = useQuery({
    queryKey: ["internal", "users", selectedUserId, "roles"],
    queryFn: () => fetchUserRoles(auth.token!, selectedUserId!),
    enabled: auth.token !== null && selectedUserId !== null
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

  const usersPage = usersQuery.data?.data;
  const users = usersPage?.items ?? [];
  const totalPages = usersPage ? Math.max(1, Math.ceil(usersPage.total / usersPage.page_size)) : 1;
  const roles = rolesQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data.items ?? [];
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const selectedRoleCodes = userRolesQuery.data?.data.role_codes ?? [];
  const userColumns = useMemo<ColumnDef<UserManagementItem>[]>(
    () => [
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
    [updateUserMutation]
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
