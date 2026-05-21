import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  exportLoginLogs,
  exportOperationLogs,
  type LoginLogPublic,
  type OperationLogPublic
} from "@alune/api-client";
import {
  useGetLoginLogsApiV1AuditLoginLogsGet,
  useGetOperationLogsApiV1AuditOperationLogsGet,
  type GetLoginLogsApiV1AuditLoginLogsGetParams,
  type GetOperationLogsApiV1AuditOperationLogsGetParams
} from "@alune/api-client/generated";

type OperationStatus = NonNullable<GetOperationLogsApiV1AuditOperationLogsGetParams["status"]>;
type LoginStatus = NonNullable<GetLoginLogsApiV1AuditLoginLogsGetParams["status"]>;

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

function toOperationStatus(value: string): OperationStatus | undefined {
  return value === "success" || value === "failure" || value === "error" ? value : undefined;
}

function toLoginStatus(value: string): LoginStatus | undefined {
  return value === "success" || value === "failure" ? value : undefined;
}

export function AuditPage() {
  const auth = useAuth();
  const [operationSearch, setOperationSearch] = useState("");
  const [operationStatus, setOperationStatus] = useState("");
  const [operationStartedAt, setOperationStartedAt] = useState("");
  const [operationEndedAt, setOperationEndedAt] = useState("");
  const [operationPage, setOperationPage] = useState(1);
  const [loginSearch, setLoginSearch] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [loginStartedAt, setLoginStartedAt] = useState("");
  const [loginEndedAt, setLoginEndedAt] = useState("");
  const [loginPage, setLoginPage] = useState(1);
  const authRequest = {
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined
  };
  const operationLogsQuery = useGetOperationLogsApiV1AuditOperationLogsGet(
    {
      q: operationSearch || undefined,
      status: toOperationStatus(operationStatus),
      started_at: operationStartedAt || undefined,
      ended_at: operationEndedAt || undefined,
      page: operationPage,
      page_size: 10
    },
    {
      query: {
        queryKey: [
          "internal",
          "audit",
          "operation-logs",
          operationSearch,
          operationStatus,
          operationStartedAt,
          operationEndedAt,
          operationPage
        ],
        enabled: auth.token !== null
      },
      request: authRequest
    }
  );
  const loginLogsQuery = useGetLoginLogsApiV1AuditLoginLogsGet(
    {
      q: loginSearch || undefined,
      status: toLoginStatus(loginStatus),
      started_at: loginStartedAt || undefined,
      ended_at: loginEndedAt || undefined,
      page: loginPage,
      page_size: 10
    },
    {
      query: {
        queryKey: [
          "internal",
          "audit",
          "login-logs",
          loginSearch,
          loginStatus,
          loginStartedAt,
          loginEndedAt,
          loginPage
        ],
        enabled: auth.token !== null
      },
      request: authRequest
    }
  );
  const operationLogsPage = operationLogsQuery.data?.status === 200 ? operationLogsQuery.data.data.data : undefined;
  const operationTotalPages = operationLogsPage
    ? Math.max(1, Math.ceil(operationLogsPage.total / operationLogsPage.page_size))
    : 1;
  const loginLogsPage = loginLogsQuery.data?.status === 200 ? loginLogsQuery.data.data.data : undefined;
  const loginTotalPages = loginLogsPage ? Math.max(1, Math.ceil(loginLogsPage.total / loginLogsPage.page_size)) : 1;

  async function downloadCsv(kind: "operation" | "login") {
    const blob =
      kind === "operation"
        ? await exportOperationLogs(auth.token!, {
            q: operationSearch || undefined,
            status: operationStatus || undefined,
            startedAt: operationStartedAt || undefined,
            endedAt: operationEndedAt || undefined
          })
        : await exportLoginLogs(auth.token!, {
            q: loginSearch || undefined,
            status: loginStatus || undefined,
            startedAt: loginStartedAt || undefined,
            endedAt: loginEndedAt || undefined
          });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = kind === "operation" ? "operation-logs.csv" : "login-logs.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

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
          <div className="grid gap-3 md:grid-cols-[1fr_10rem_11rem_11rem_auto_auto_auto_auto]">
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
            <Input
              type="datetime-local"
              value={operationStartedAt}
              onChange={(event) => {
                setOperationStartedAt(event.target.value);
                setOperationPage(1);
              }}
            />
            <Input
              type="datetime-local"
              value={operationEndedAt}
              onChange={(event) => {
                setOperationEndedAt(event.target.value);
                setOperationPage(1);
              }}
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
            <Button type="button" variant="outline" onClick={() => void downloadCsv("operation")}>
              Export
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
          <div className="grid gap-3 md:grid-cols-[1fr_10rem_11rem_11rem_auto_auto_auto_auto]">
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
            <Input
              type="datetime-local"
              value={loginStartedAt}
              onChange={(event) => {
                setLoginStartedAt(event.target.value);
                setLoginPage(1);
              }}
            />
            <Input
              type="datetime-local"
              value={loginEndedAt}
              onChange={(event) => {
                setLoginEndedAt(event.target.value);
                setLoginPage(1);
              }}
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
            <Button type="button" variant="outline" onClick={() => void downloadCsv("login")}>
              Export
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
