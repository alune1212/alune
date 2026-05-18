import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { fetchDepartments, type DepartmentPublic } from "@alune/api-client";

const departmentColumns: ColumnDef<DepartmentPublic>[] = [
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
    accessorKey: "parent_id",
    header: "Parent",
    cell: ({ row }) => row.original.parent_id ?? "-"
  },
  {
    accessorKey: "sort_order",
    header: "Sort"
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive")
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description ?? "-"
  }
];

export function DepartmentsPage() {
  const auth = useAuth();
  const departmentsQuery = useQuery({
    queryKey: ["internal", "departments"],
    queryFn: () => fetchDepartments(auth.token!),
    enabled: auth.token !== null
  });

  const departments = departmentsQuery.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Departments</h1>
        <p className="mt-2 text-sm text-slate-600">Department records for account assignment.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Department list</CardTitle>
          <CardDescription>{departments.length} departments</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentsQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load departments.</p>
          ) : (
            <DataTable columns={departmentColumns} data={departments} emptyLabel="No departments found." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
