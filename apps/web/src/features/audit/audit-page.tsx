import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [operationSearch, setOperationSearch] = useState("");
  const [operationStatus, setOperationStatus] = useState("");
  const [operationPage, setOperationPage] = useState(1);
  const [loginSearch, setLoginSearch] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [loginPage, setLoginPage] = useState(1);
  const operationLogsQuery = useQuery({
    queryKey: ["internal", "audit", "operation-logs", operationSearch, operationStatus, operationPage],
    queryFn: () =>
      fetchOperationLogs(auth.token!, {
        q: operationSearch || undefined,
        status: operationStatus || undefined,
        page: operationPage,
        pageSize: 10
      }),
    enabled: auth.token !== null
  });
  const loginLogsQuery = useQuery({
    queryKey: ["internal", "audit", "login-logs", loginSearch, loginStatus, loginPage],
    queryFn: () =>
      fetchLoginLogs(auth.token!, {
        q: loginSearch || undefined,
        status: loginStatus || undefined,
        page: loginPage,
        pageSize: 10
      }),
    enabled: auth.token !== null
  });
  const operationLogsPage = operationLogsQuery.data?.data;
  const operationTotalPages = operationLogsPage
    ? Math.max(1, Math.ceil(operationLogsPage.total / operationLogsPage.page_size))
    : 1;
  const loginLogsPage = loginLogsQuery.data?.data;
  const loginTotalPages = loginLogsPage ? Math.max(1, Math.ceil(loginLogsPage.total / loginLogsPage.page_size)) : 1;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Audit</h1>
        <p className="mt-2 text-sm text-slate-600">Login and operation activity for the platform.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Operation logs</CardTitle>
          <CardDescription>{operationLogsPage?.total ?? 0} records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem_auto_auto_auto]">
            <Input
              value={operationSearch}
              onChange={(event) => {
                setOperationSearch(event.target.value);
                setOperationPage(1);
              }}
              placeholder="Search action, resource, or detail"
            />
            <Input
              value={operationStatus}
              onChange={(event) => {
                setOperationStatus(event.target.value);
                setOperationPage(1);
              }}
              placeholder="Status"
            />
            <Button type="button" variant="outline" onClick={() => setOperationPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <span className="self-center text-center text-sm text-slate-600">
              {operationPage} / {operationTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOperationPage((value) => Math.min(operationTotalPages, value + 1))}
            >
              Next
            </Button>
          </div>
          {operationLogsQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load operation logs.</p>
          ) : (
            <DataTable
              columns={operationColumns}
              data={operationLogsPage?.items ?? []}
              emptyLabel="No operation logs found."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login logs</CardTitle>
          <CardDescription>{loginLogsPage?.total ?? 0} records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem_auto_auto_auto]">
            <Input
              value={loginSearch}
              onChange={(event) => {
                setLoginSearch(event.target.value);
                setLoginPage(1);
              }}
              placeholder="Search username, IP, or message"
            />
            <Input
              value={loginStatus}
              onChange={(event) => {
                setLoginStatus(event.target.value);
                setLoginPage(1);
              }}
              placeholder="Status"
            />
            <Button type="button" variant="outline" onClick={() => setLoginPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <span className="self-center text-center text-sm text-slate-600">
              {loginPage} / {loginTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLoginPage((value) => Math.min(loginTotalPages, value + 1))}
            >
              Next
            </Button>
          </div>
          {loginLogsQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load login logs.</p>
          ) : (
            <DataTable
              columns={loginColumns}
              data={loginLogsPage?.items ?? []}
              emptyLabel="No login logs found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
