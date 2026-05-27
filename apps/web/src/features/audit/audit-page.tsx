import { useState } from "react";
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
  exportLoginLogs,
  exportOperationLogs,
  type LoginLogPublic,
  type OperationLogPublic,
} from "@alune/api-client";
import {
  useGetLoginLogsApiV1AuditLoginLogsGet,
  useGetOperationLogsApiV1AuditOperationLogsGet,
  type GetLoginLogsApiV1AuditLoginLogsGetParams,
  type GetOperationLogsApiV1AuditOperationLogsGetParams,
} from "@alune/api-client/generated";

type OperationStatus = NonNullable<
  GetOperationLogsApiV1AuditOperationLogsGetParams["status"]
>;
type LoginStatus = NonNullable<
  GetLoginLogsApiV1AuditLoginLogsGetParams["status"]
>;

const operationColumns: ColumnDef<OperationLogPublic>[] = [
  { accessorKey: "action", header: "操作" },
  { accessorKey: "resource", header: "资源" },
  {
    accessorKey: "resource_id",
    header: "资源编号",
    cell: ({ row }) => row.original.resource_id ?? "-",
  },
  { accessorKey: "status", header: uiCopy.common.status },
  {
    accessorKey: "detail",
    header: "详情",
    cell: ({ row }) => row.original.detail ?? "-",
  },
];

const loginColumns: ColumnDef<LoginLogPublic>[] = [
  { accessorKey: "username", header: uiCopy.fields.username },
  { accessorKey: "status", header: uiCopy.common.status },
  {
    accessorKey: "ip_address",
    header: "IP",
    cell: ({ row }) => row.original.ip_address ?? "-",
  },
  {
    accessorKey: "message",
    header: "消息",
    cell: ({ row }) => row.original.message ?? "-",
  },
];

function toOperationStatus(value: string): OperationStatus | undefined {
  return value === "success" || value === "failure" || value === "error"
    ? value
    : undefined;
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
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
  };
  const operationLogsQuery = useGetOperationLogsApiV1AuditOperationLogsGet(
    {
      q: operationSearch || undefined,
      status: toOperationStatus(operationStatus),
      started_at: operationStartedAt || undefined,
      ended_at: operationEndedAt || undefined,
      page: operationPage,
      page_size: 10,
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
          operationPage,
        ],
        enabled: auth.token !== null,
      },
      request: authRequest,
    },
  );
  const loginLogsQuery = useGetLoginLogsApiV1AuditLoginLogsGet(
    {
      q: loginSearch || undefined,
      status: toLoginStatus(loginStatus),
      started_at: loginStartedAt || undefined,
      ended_at: loginEndedAt || undefined,
      page: loginPage,
      page_size: 10,
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
          loginPage,
        ],
        enabled: auth.token !== null,
      },
      request: authRequest,
    },
  );
  const operationLogsPage =
    operationLogsQuery.data?.status === 200
      ? operationLogsQuery.data.data.data
      : undefined;
  const operationTotalPages = operationLogsPage
    ? Math.max(
        1,
        Math.ceil(operationLogsPage.total / operationLogsPage.page_size),
      )
    : 1;
  const loginLogsPage =
    loginLogsQuery.data?.status === 200
      ? loginLogsQuery.data.data.data
      : undefined;
  const loginTotalPages = loginLogsPage
    ? Math.max(1, Math.ceil(loginLogsPage.total / loginLogsPage.page_size))
    : 1;

  async function downloadCsv(kind: "operation" | "login") {
    const token = auth.token!;
    const blob = kind === "operation"
      ? await exportOperationLogs(token, {
          q: operationSearch || undefined,
          status: operationStatus || undefined,
          startedAt: operationStartedAt || undefined,
          endedAt: operationEndedAt || undefined,
        })
      : await exportLoginLogs(token, {
          q: loginSearch || undefined,
          status: loginStatus || undefined,
          startedAt: loginStartedAt || undefined,
          endedAt: loginEndedAt || undefined,
        });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${kind}-logs.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.audit}
        </h1>
        <p className="mt-2 text-sm text-slate-600">平台登录和操作活动记录。</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>操作日志</CardTitle>
          <CardDescription>
            {operationLogsPage?.total ?? 0} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_10rem_11rem_11rem_auto_auto_auto_auto]">
            <Input
              value={operationSearch}
              onChange={(event) => {
                setOperationSearch(event.target.value);
                setOperationPage(1);
              }}
              placeholder="搜索操作、资源或详情"
            />
            <Input
              value={operationStatus}
              onChange={(event) => {
                setOperationStatus(event.target.value);
                setOperationPage(1);
              }}
              placeholder={uiCopy.common.status}
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
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setOperationPage((value) => Math.max(1, value - 1))
              }
            >
              {uiCopy.common.previous}
            </Button>
            <span className="self-center text-center text-sm text-slate-600">
              {operationPage} / {operationTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setOperationPage((value) =>
                  Math.min(operationTotalPages, value + 1),
                )
              }
            >
              {uiCopy.common.next}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void downloadCsv("operation")}
            >
              {uiCopy.common.export}
            </Button>
          </div>
          {operationLogsQuery.isError ? (
            <p className="text-sm text-red-600">
              {uiCopy.errors.loadOperationLogs}
            </p>
          ) : (
            <DataTable
              columns={operationColumns}
              data={operationLogsPage?.items ?? []}
              emptyLabel={uiCopy.empty.operationLogs}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>登录日志</CardTitle>
          <CardDescription>{loginLogsPage?.total ?? 0} 条记录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_10rem_11rem_11rem_auto_auto_auto_auto]">
            <Input
              value={loginSearch}
              onChange={(event) => {
                setLoginSearch(event.target.value);
                setLoginPage(1);
              }}
              placeholder="搜索用户名、IP 或消息"
            />
            <Input
              value={loginStatus}
              onChange={(event) => {
                setLoginStatus(event.target.value);
                setLoginPage(1);
              }}
              placeholder={uiCopy.common.status}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setLoginPage((value) => Math.max(1, value - 1))}
            >
              {uiCopy.common.previous}
            </Button>
            <span className="self-center text-center text-sm text-slate-600">
              {loginPage} / {loginTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setLoginPage((value) => Math.min(loginTotalPages, value + 1))
              }
            >
              {uiCopy.common.next}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void downloadCsv("login")}
            >
              {uiCopy.common.export}
            </Button>
          </div>
          {loginLogsQuery.isError ? (
            <p className="text-sm text-red-600">
              {uiCopy.errors.loadLoginLogs}
            </p>
          ) : (
            <DataTable
              columns={loginColumns}
              data={loginLogsPage?.items ?? []}
              emptyLabel={uiCopy.empty.loginLogs}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
