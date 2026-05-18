import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { fetchRoles, type RolePublic } from "@alune/api-client";

const roleColumns: ColumnDef<RolePublic>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <span className="font-medium text-slate-950">{row.original.code}</span>
  },
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description ?? "-"
  },
  {
    accessorKey: "is_system",
    header: "System",
    cell: ({ row }) => (row.original.is_system ? "Yes" : "No")
  }
];

export function RolesPage() {
  const auth = useAuth();
  const rolesQuery = useQuery({
    queryKey: ["internal", "roles"],
    queryFn: () => fetchRoles(auth.token!),
    enabled: auth.token !== null
  });

  const roles = rolesQuery.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Role records used by the permission baseline.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Role list</CardTitle>
          <CardDescription>{roles.length} roles</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load roles.</p>
          ) : (
            <DataTable columns={roleColumns} data={roles} emptyLabel="No roles found." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
