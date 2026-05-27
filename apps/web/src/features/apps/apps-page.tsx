import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Grid2X2 } from "lucide-react";
import { useMemo, useState } from "react";

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
import { getPlatformAppPage } from "@/features/apps/app-response";
import { useAuth } from "@/features/auth/auth-provider";
import {
  PlatformAppCreateEntryType,
  useCreatePlatformAppApiV1AppsPost,
  useGetDictionaryItemsApiV1DictionariesItemsGet,
  useGetDictionaryTypesApiV1DictionariesTypesGet,
  useGetPlatformAppsApiV1AppsGet,
  useUpdatePlatformAppApiV1AppsAppIdPatch,
  useUpdatePlatformAppStatusApiV1AppsAppIdStatusPatch,
  type PlatformAppPublic,
} from "@alune/api-client/generated";

const managementPermissions = [
  "action:apps:create",
  "action:apps:update",
  "action:apps:manage_status",
];

function hasAppPermission(
  permissions: readonly string[],
  isSuperuser: boolean,
  permission: string,
): boolean {
  return isSuperuser || permissions.includes(permission);
}

function canUseManagementFilters(
  permissions: readonly string[],
  isSuperuser: boolean,
): boolean {
  return (
    isSuperuser ||
    managementPermissions.some((permission) => permissions.includes(permission))
  );
}

function openApp(app: PlatformAppPublic) {
  if (app.entry_type === "internal") {
    window.location.assign(app.entry_url);
    return;
  }
  window.open(app.entry_url, "_blank", "noopener,noreferrer");
}

function getFormEntryType(app: PlatformAppPublic): PlatformAppCreateEntryType {
  return app.entry_type === "internal"
    ? PlatformAppCreateEntryType.internal
    : PlatformAppCreateEntryType.external;
}

export function AppsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [filterCategoryCode, setFilterCategoryCode] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingApp, setEditingApp] = useState<PlatformAppPublic | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formCategoryCode, setFormCategoryCode] = useState("");
  const [entryType, setEntryType] = useState<PlatformAppCreateEntryType>(
    PlatformAppCreateEntryType.external,
  );
  const [entryUrl, setEntryUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const request = useMemo(
    () => ({ headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined }),
    [auth.token],
  );
  const permissions = auth.user?.permissions ?? [];
  const isSuperuser = auth.user?.is_superuser ?? false;
  const canCreateApp = hasAppPermission(
    permissions,
    isSuperuser,
    "action:apps:create",
  );
  const canUpdateApp = hasAppPermission(
    permissions,
    isSuperuser,
    "action:apps:update",
  );
  const canManageAppStatus = hasAppPermission(
    permissions,
    isSuperuser,
    "action:apps:manage_status",
  );
  const canFilterByStatus = canUseManagementFilters(permissions, isSuperuser);
  const selectedStatus =
    canFilterByStatus && statusFilter !== ""
      ? statusFilter === "active"
      : undefined;

  const appsQuery = useGetPlatformAppsApiV1AppsGet(
    {
      q: q || undefined,
      category_code: filterCategoryCode || undefined,
      is_active: selectedStatus,
      page: 1,
      page_size: 50,
    },
    {
      query: { queryKey: ["apps", q, filterCategoryCode, statusFilter] },
      request,
    },
  );
  const dictionaryTypesQuery = useGetDictionaryTypesApiV1DictionariesTypesGet({
    query: { queryKey: ["app-category-types"] },
    request,
  });
  const dictionaryItemsQuery = useGetDictionaryItemsApiV1DictionariesItemsGet({
    query: { queryKey: ["app-category-items"] },
    request,
  });

  const appCategoryType = dictionaryTypesQuery.data?.data.data.find(
    (item) => item.code === "app_category",
  );
  const appCategories = (dictionaryItemsQuery.data?.data.data ?? [])
    .filter((item) => item.is_active && item.type_id === appCategoryType?.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const defaultCategory = appCategories[0]?.value ?? "tool";
  const categoryOptions =
    appCategories.length > 0
      ? appCategories.map((category) => ({
          label: category.label,
          value: category.value,
        }))
      : [{ label: "工具", value: defaultCategory }];
  const selectedFormCategory = formCategoryCode || defaultCategory;
  const appPage = getPlatformAppPage(appsQuery.data?.data);
  const apps = appPage?.items ?? [];

  function resetForm() {
    setEditingApp(null);
    setCode("");
    setName("");
    setDescription("");
    setFormCategoryCode("");
    setEntryType(PlatformAppCreateEntryType.external);
    setEntryUrl("");
    setIcon("");
    setSortOrder(0);
  }

  const createMutation = useCreatePlatformAppApiV1AppsPost({
    mutation: {
      onSuccess: () => {
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["apps"] });
      },
    },
    request,
  });
  const updateMutation = useUpdatePlatformAppApiV1AppsAppIdPatch({
    mutation: {
      onSuccess: () => {
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["apps"] });
      },
    },
    request,
  });
  const statusMutation = useUpdatePlatformAppStatusApiV1AppsAppIdStatusPatch({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apps"] }),
    },
    request,
  });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function submitApp() {
    const data = {
      code,
      name,
      category_code: selectedFormCategory,
      entry_type: entryType,
      entry_url: entryUrl,
      description: description || null,
      icon: icon || null,
      sort_order: sortOrder,
    };

    if (editingApp) {
      updateMutation.mutate({
        appId: editingApp.id,
        data,
      });
      return;
    }

    createMutation.mutate({
      data: {
        ...data,
        is_active: true,
      },
    });
  }

  function startEdit(app: PlatformAppPublic) {
    setEditingApp(app);
    setCode(app.code);
    setName(app.name);
    setDescription(app.description ?? "");
    setFormCategoryCode(app.category_code);
    setEntryType(getFormEntryType(app));
    setEntryUrl(app.entry_url);
    setIcon(app.icon ?? "");
    setSortOrder(app.sort_order);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.apps}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          管理 Alune Hub 中可访问的功能、工具和外部入口。
        </p>
      </section>

      {canCreateApp || editingApp ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingApp ? "编辑应用" : "创建应用"}</CardTitle>
            <CardDescription>
              {editingApp
                ? "更新已登记的应用入口。"
                : "登记一个平台内页面或外部工具入口。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="应用编码"
            />
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="应用名称"
            />
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={selectedFormCategory}
              onChange={(event) => setFormCategoryCode(event.target.value)}
            >
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={entryType}
              onChange={(event) =>
                setEntryType(event.target.value as PlatformAppCreateEntryType)
              }
            >
              <option value={PlatformAppCreateEntryType.external}>外部链接</option>
              <option value={PlatformAppCreateEntryType.internal}>平台内页面</option>
            </select>
            <Button
              type="button"
              disabled={
                !code ||
                !name ||
                !entryUrl ||
                isSaving ||
                (editingApp ? !canUpdateApp : !canCreateApp)
              }
              onClick={submitApp}
            >
              {editingApp ? "保存应用" : "创建应用"}
            </Button>
            <Input
              className="md:col-span-2"
              value={entryUrl}
              onChange={(event) => setEntryUrl(event.target.value)}
              placeholder="入口地址"
            />
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="描述"
            />
            <Input
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="图标"
            />
            <Input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
              placeholder="排序"
            />
            {editingApp ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                取消编辑
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>应用列表</CardTitle>
          <CardDescription>{appPage?.total ?? 0} 个应用入口</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={
              canFilterByStatus
                ? "grid gap-3 md:grid-cols-[1fr_12rem_10rem]"
                : "grid gap-3 md:grid-cols-[1fr_12rem]"
            }
          >
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索应用"
            />
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={filterCategoryCode}
              onChange={(event) => setFilterCategoryCode(event.target.value)}
            >
              <option value="">全部分类</option>
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {canFilterByStatus ? (
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            ) : null}
          </div>

          {appsQuery.isError ? (
            <p className="text-sm text-red-600">{uiCopy.errors.loadApps}</p>
          ) : apps.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
              {uiCopy.empty.apps}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {apps.map((app) => (
                <article
                  key={app.id}
                  className="flex min-h-44 flex-col justify-between rounded-md border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                          <Grid2X2 className="size-4" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-slate-950">
                            {app.name}
                          </h2>
                          <p className="text-xs text-slate-500">{app.code}</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {app.is_active ? uiCopy.common.active : uiCopy.common.inactive}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600">
                      {app.description || "暂无描述"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {app.entry_url}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => openApp(app)}>
                      <ExternalLink className="size-4" />
                      打开入口
                    </Button>
                    {canUpdateApp || canManageAppStatus ? (
                      <>
                        {canUpdateApp ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => startEdit(app)}
                          >
                            {uiCopy.common.edit}
                          </Button>
                        ) : null}
                        {canManageAppStatus ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                appId: app.id,
                                data: { is_active: !app.is_active },
                              })
                            }
                          >
                            {app.is_active
                              ? uiCopy.common.disable
                              : uiCopy.common.enable}
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
