import { Activity, Database, FileText, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealthCheckApiV1HealthGet } from "@alune/api-client/generated";
import { platformName } from "@alune/shared";

const summaryCards = [
  {
    title: "Users",
    value: "Ready",
    description: "User directory is connected to the backend",
    icon: Activity
  },
  {
    title: "Roles",
    value: "Ready",
    description: "Role records are available for administrators",
    icon: ShieldCheck
  },
  {
    title: "Departments",
    value: "Ready",
    description: "Department records are available for assignment",
    icon: FileText
  }
];

export function DashboardPage() {
  const healthQuery = useHealthCheckApiV1HealthGet({
    query: {
      refetchInterval: 30_000
    }
  });
  const healthStatus = healthQuery.data?.data.data;

  let healthLabel: string;
  let badgeColor: string;

  if (healthQuery.isLoading) {
    healthLabel = "Checking";
    badgeColor = "text-slate-400";
  } else if (healthQuery.isError) {
    healthLabel = "Offline";
    badgeColor = "text-red-600";
  } else {
    healthLabel = healthStatus?.status.toUpperCase() ?? "Unknown";
    badgeColor = "text-emerald-600";
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{platformName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Minimal company admin platform foundation with React, FastAPI, PostgreSQL, and Redis.
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
              <p className="text-2xl font-semibold text-slate-950">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>System status</CardTitle>
          <CardDescription>Frontend calls the FastAPI health endpoint through TanStack Query.</CardDescription>
        </CardHeader>
        <CardContent>
          {healthQuery.isError ? (
            <p className="text-sm text-red-600">API health check failed. Start the backend on port 8000.</p>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Service</dt>
                <dd className="mt-1 font-medium text-slate-950">{healthStatus?.service ?? "api"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-medium text-slate-950">{healthStatus?.status ?? "checking"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Refresh</dt>
                <dd className="mt-1 font-medium text-slate-950">30 seconds</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
