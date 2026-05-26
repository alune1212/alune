import { Activity, Database, FileText, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { uiCopy } from "@/config/ui-copy";
import { useHealthCheckApiV1HealthGet } from "@alune/api-client/generated";
import { platformName } from "@alune/shared";

const summaryCards = [
  {
    title: uiCopy.modules.users,
    value: "就绪",
    description: "用户目录已连接后端",
    icon: Activity,
  },
  {
    title: uiCopy.modules.roles,
    value: "就绪",
    description: "管理员可查看和维护角色记录",
    icon: ShieldCheck,
  },
  {
    title: uiCopy.modules.departments,
    value: "就绪",
    description: "部门记录可用于账号分配",
    icon: FileText,
  },
];

export function DashboardPage() {
  const healthQuery = useHealthCheckApiV1HealthGet({
    query: {
      refetchInterval: 30_000,
    },
  });
  const healthStatus = healthQuery.data?.data.data;

  let healthLabel: string;
  let badgeColor: string;

  if (healthQuery.isLoading) {
    healthLabel = "检查中";
    badgeColor = "text-slate-400";
  } else if (healthQuery.isError) {
    healthLabel = "离线";
    badgeColor = "text-red-600";
  } else {
    healthLabel = healthStatus?.status.toUpperCase() ?? "未知";
    badgeColor = "text-emerald-600";
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            {platformName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            基于 React、FastAPI、PostgreSQL 和 Redis
            的公司内部管理平台基础底座。
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
          <Database className="size-4 text-slate-500" />
          <span className="font-medium text-slate-700">API</span>
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
          <CardTitle>系统状态</CardTitle>
          <CardDescription>
            前端通过 TanStack Query 调用 FastAPI 健康检查接口。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthQuery.isError ? (
            <p className="text-sm text-red-600">
              API 健康检查失败，请确认后端已在 8000 端口启动。
            </p>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">服务</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {healthStatus?.service ?? "api"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">状态</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {healthStatus?.status ?? "检查中"}
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
