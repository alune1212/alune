import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { fetchUsers, type UserManagementItem } from "@alune/api-client";

const userColumns: ColumnDef<UserManagementItem>[] = [
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
  }
];

export function UsersPage() {
  const auth = useAuth();
  const usersQuery = useQuery({
    queryKey: ["internal", "users"],
    queryFn: () => fetchUsers(auth.token!),
    enabled: auth.token !== null
  });

  const users = usersQuery.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Users</h1>
        <p className="mt-2 text-sm text-slate-600">Accounts available in the internal platform.</p>
      </section>

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
