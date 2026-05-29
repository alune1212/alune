import { BookOpen, Database, FileText, MessageSquareText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemo } from "react";

import { uiCopy } from "@/config/ui-copy";
import { useAuth } from "@/features/auth/auth-provider";
import {
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
  useHealthCheckApiV1HealthGet,
} from "@alune/api-client/generated";
import { platformName } from "@alune/shared";

const summaryCards = [
  {
    title: uiCopy.modules.knowledge,
    value: "就绪",
    description: "创建私有知识集合并管理访问范围",
    icon: BookOpen,
  },
  {
    title: uiCopy.modules.documents,
    value: "就绪",
    description: "上传文档后解析、切片并生成索引",
    icon: FileText,
  },
  {
    title: uiCopy.modules.ragChat,
    value: "就绪",
    description: "基于检索命中的片段生成带引用回答",
    icon: MessageSquareText,
  },
];

export function DashboardPage() {
  const auth = useAuth();
  const request = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const healthQuery = useHealthCheckApiV1HealthGet({
    query: {
      refetchInterval: 30_000,
    },
  });
  const basesQuery = useGetKnowledgeBasesApiV1KnowledgeBasesGet(
    { is_active: true, page: 1, page_size: 6 },
    { query: { queryKey: ["knowledge-bases"] }, request },
  );
  const healthStatus = healthQuery.data?.data.data;
  const basesPage =
    basesQuery.data?.status === 200 ? basesQuery.data.data.data : undefined;
  const bases = basesPage?.items ?? [];

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
            面向个人和小团队的私有 RAG
            知识库，集中完成文档入库、索引检索、知识问答和引用溯源。
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
          <CardTitle>知识库入口</CardTitle>
          <CardDescription>最近可用于检索问答的知识库。</CardDescription>
        </CardHeader>
        <CardContent>
          {bases.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              {uiCopy.empty.knowledgeBases}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bases.map((knowledgeBase) => (
                <a
                  key={knowledgeBase.id}
                  href="/knowledge-bases"
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm hover:bg-slate-50"
                >
                  <BookOpen className="size-4 text-slate-500" />
                  <span className="font-medium text-slate-950">
                    {knowledgeBase.name}
                  </span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
          <CardDescription>平台接口服务的基础可用性。</CardDescription>
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
                <dd className="mt-1 font-medium text-slate-950">接口服务</dd>
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
