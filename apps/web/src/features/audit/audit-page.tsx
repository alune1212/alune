import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import {
  fetchLoginLogs,
  fetchOperationLogs,
  type LoginLogPublic,
  type OperationLogPublic
} from "@alune/api-client";

const operationColumns: ColumnDef<OperationLogPublic>[] = [
  { accessorKey: "action", header: "Action" },
  { accessorKey: "resource", header: "Resource" },
  { accessorKey: "resource_id", header: "Resource ID", cell: ({ row }) => row.original.resource_id ?? "-" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "detail", header: "Detail", cell: ({ row }) => row.original.detail ?? "-" }
];

const loginColumns: ColumnDef<LoginLogPublic>[] = [
  { accessorKey: "username", header: "Username" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "ip_address", header: "IP", cell: ({ row }) => row.original.ip_address ?? "-" },
  { accessorKey: "message", header: "Message", cell: ({ row }) => row.original.message ?? "-" }
];

export function AuditPage() {
  const auth = useAuth();
  const operationLogsQuery = useQuery({
    queryKey: ["internal", "audit", "operation-logs"],
    queryFn: () => fetchOperationLogs(auth.token!),
    enabled: auth.token !== null
  });
  const loginLogsQuery = useQuery({
    queryKey: ["internal", "audit", "login-logs"],
    queryFn: () => fetchLoginLogs(auth.token!),
    enabled: auth.token !== null
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Audit</h1>
        <p className="mt-2 text-sm text-slate-600">Login and operation activity for the platform.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Operation logs</CardTitle>
          <CardDescription>{operationLogsQuery.data?.data.length ?? 0} records</CardDescription>
        </CardHeader>
        <CardContent>
          {operationLogsQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load operation logs.</p>
          ) : (
            <DataTable
              columns={operationColumns}
              data={operationLogsQuery.data?.data ?? []}
              emptyLabel="No operation logs found."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login logs</CardTitle>
          <CardDescription>{loginLogsQuery.data?.data.length ?? 0} records</CardDescription>
        </CardHeader>
        <CardContent>
          {loginLogsQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load login logs.</p>
          ) : (
            <DataTable
              columns={loginColumns}
              data={loginLogsQuery.data?.data ?? []}
              emptyLabel="No login logs found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
