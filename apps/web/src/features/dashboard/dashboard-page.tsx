import { Activity, Database, FileText, Grid2X2, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemo } from "react";

import { uiCopy } from "@/config/ui-copy";
import { getPlatformAppPage } from "@/features/apps/app-response";
import { useAuth } from "@/features/auth/auth-provider";
import {
  useGetPlatformAppsApiV1AppsGet,
  useHealthCheckApiV1HealthGet,
} from "@alune/api-client/generated";
import { platformName } from "@alune/shared";

const summaryCards = [
  {
    title: uiCopy.modules.users,
    value: "就绪",
    description: "账号与协作者目录已连接后端",
    icon: Activity,
  },
  {
    title: uiCopy.modules.roles,
    value: "就绪",
    description: "管理员可维护平台访问权限",
    icon: ShieldCheck,
  },
  {
    title: uiCopy.modules.departments,
    value: "就绪",
    description: "空间记录可用于协作者分配",
    icon: FileText,
  },
];

export function DashboardPage() {
  const auth = useAuth();
  const request = useMemo(
    () => ({ headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined }),
    [auth.token],
  );
  const healthQuery = useHealthCheckApiV1HealthGet({
    query: {
      refetchInterval: 30_000,
    },
  });
  const appsQuery = useGetPlatformAppsApiV1AppsGet(
    { is_active: true, page: 1, page_size: 6 },
    { query: { queryKey: ["apps"] }, request },
  );
  const healthStatus = healthQuery.data?.data.data;
  const appPage = getPlatformAppPage(appsQuery.data?.data);
  const apps = appPage?.items ?? [];

  let healthLabel: string;
  let badgeColor: string;

  if (healthQuery.isLoading) {
    healthLabel = "检查中";
    badgeColor = "text-slate-400";
  } else if (healthQuery.isError) {
    healthLabel = "离线";
    badgeColor = "text-red-600";
  } else if (healthStatus?.status === "ok") {
    healthLabel = "正常";
    badgeColor = "text-emerald-600";
  } else {
    healthLabel = "未知";
    badgeColor = "text-slate-500";
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            {platformName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            面向个人与协作者的私有工作台，集中管理应用入口、权限、空间、配置和文件资源。
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
          <Database className="size-4 text-slate-500" />
          <span className="font-medium text-slate-700">接口服务</span>
          <span className={badgeColor}>{healthLabel}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{card.title}</CardTitle>
                <card.icon className="size-5 text-slate-400" />
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-950">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>应用入口</CardTitle>
          <CardDescription>常用工具和平台内功能的快速入口。</CardDescription>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              {uiCopy.empty.apps}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => (
                <a
                  key={app.id}
                  href={app.entry_url}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm hover:bg-slate-50"
                  target={app.entry_type === "external" ? "_blank" : undefined}
                  rel={app.entry_type === "external" ? "noopener,noreferrer" : undefined}
                >
                  <Grid2X2 className="size-4 text-slate-500" />
                  <span className="font-medium text-slate-950">{app.name}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
          <CardDescription>
            平台接口服务的基础可用性。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthQuery.isError ? (
            <p className="text-sm text-red-600">
              接口服务暂不可用，请稍后重试或检查本地服务状态。
            </p>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">服务</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  接口服务
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">状态</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {healthLabel}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">刷新</dt>
                <dd className="mt-1 font-medium text-slate-950">30 秒</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
