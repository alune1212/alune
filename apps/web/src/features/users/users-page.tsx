import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { createUser, fetchUsers, updateUser, type UserManagementItem } from "@alune/api-client";

export function UsersPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const usersQuery = useQuery({
    queryKey: ["internal", "users"],
    queryFn: () => fetchUsers(auth.token!),
    enabled: auth.token !== null
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

  const users = usersQuery.data?.data ?? [];
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
          <Button type="button" variant="outline" onClick={() => updateUserMutation.mutate(row.original)}>
            {row.original.is_active ? "Disable" : "Enable"}
          </Button>
        )
      }
    ],
    [updateUserMutation]
  );

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
          <CardTitle>User directory</CardTitle>
          <CardDescription>{users.length} users</CardDescription>
        </CardHeader>
        <CardContent>
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
