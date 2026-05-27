import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
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
  useCreateDepartmentApiV1DepartmentsPost,
  useDeleteDepartmentApiV1DepartmentsDepartmentIdDelete,
  type DepartmentPublic,
  type DepartmentTreeNode,
  useGetDepartmentsApiV1DepartmentsGet,
  useGetDepartmentTreeApiV1DepartmentsTreeGet,
  useUpdateDepartmentApiV1DepartmentsDepartmentIdPatch,
} from "@alune/api-client/generated";

function DepartmentTree({
  nodes,
  depth = 0,
}: {
  nodes: DepartmentTreeNode[];
  depth?: number;
}) {
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-500">{uiCopy.empty.departments}</p>;
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            style={{ marginLeft: depth * 16 }}
          >
            <span className="font-medium text-slate-950">{node.name}</span>
            <span className="text-slate-500">{node.code}</span>
          </div>
          {(node.children ?? []).length > 0 ? (
            <DepartmentTree nodes={node.children ?? []} depth={depth + 1} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DepartmentsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const authRequest = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const departmentsQuery = useGetDepartmentsApiV1DepartmentsGet(
    { q: search || undefined, page, page_size: 10 },
    {
      query: {
        queryKey: ["internal", "departments", search, page],
        enabled: auth.token !== null,
      },
      request: authRequest,
    },
  );
  const departmentTreeQuery = useGetDepartmentTreeApiV1DepartmentsTreeGet({
    query: {
      queryKey: ["internal", "departments", "tree"],
      enabled: auth.token !== null,
    },
    request: authRequest,
  });
  const createMutation = useCreateDepartmentApiV1DepartmentsPost({
    mutation: {
      onSuccess: () => {
        setCode("");
        setName("");
        setDescription("");
        queryClient.invalidateQueries({
          queryKey: ["internal", "departments"],
        });
      },
    },
    request: authRequest,
  });
  const toggleMutation = useUpdateDepartmentApiV1DepartmentsDepartmentIdPatch({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: ["internal", "departments"],
        }),
    },
    request: authRequest,
  });
  const deleteMutation = useDeleteDepartmentApiV1DepartmentsDepartmentIdDelete({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: ["internal", "departments"],
        }),
    },
    request: authRequest,
  });

  function submitCreateDepartment() {
    createMutation.mutate({
      data: {
        code,
        name,
        description: description || null,
      },
    });
  }

  const toggleDepartment = useCallback(
    (department: DepartmentPublic) => {
      toggleMutation.mutate({
        departmentId: department.id,
        data: { is_active: !department.is_active },
      });
    },
    [toggleMutation],
  );

  const departmentsPage =
    departmentsQuery.data?.status === 200
      ? departmentsQuery.data.data.data
      : undefined;
  const departments = departmentsPage?.items ?? [];
  const totalPages = departmentsPage
    ? Math.max(1, Math.ceil(departmentsPage.total / departmentsPage.page_size))
    : 1;
  const departmentTree = departmentTreeQuery.data?.data.data ?? [];
  const departmentColumns = useMemo<ColumnDef<DepartmentPublic>[]>(
    () => [
      {
        accessorKey: "code",
        header: uiCopy.common.code,
        cell: ({ row }) => (
          <span className="font-medium text-slate-950">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: uiCopy.common.name,
      },
      {
        accessorKey: "parent_id",
        header: "上级空间",
        cell: ({ row }) => row.original.parent_id ?? "-",
      },
      {
        accessorKey: "sort_order",
        header: "排序",
      },
      {
        accessorKey: "is_active",
        header: uiCopy.common.status,
        cell: ({ row }) =>
          row.original.is_active
            ? uiCopy.common.active
            : uiCopy.common.inactive,
      },
      {
        accessorKey: "description",
        header: uiCopy.common.description,
        cell: ({ row }) => row.original.description ?? "-",
      },
      {
        id: "actions",
        header: uiCopy.common.actions,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toggleDepartment(row.original)}
            >
              {row.original.is_active
                ? uiCopy.common.disable
                : uiCopy.common.enable}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                deleteMutation.mutate({ departmentId: row.original.id })
              }
            >
              {uiCopy.common.delete}
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation, toggleDepartment],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.departments}
        </h1>
        <p className="mt-2 text-sm text-slate-600">用于协作者分组和访问边界的空间记录。</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>创建空间</CardTitle>
          <CardDescription>
            添加空间记录。存在子空间或用户时不能删除。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={uiCopy.common.code}
          />
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={uiCopy.common.name}
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={uiCopy.common.description}
          />
          <Button
            type="button"
            onClick={submitCreateDepartment}
            disabled={!code || !name}
          >
            {uiCopy.common.create}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>空间树</CardTitle>
          <CardDescription>展示上下级空间关系。</CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentTree nodes={departmentTree} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>空间列表</CardTitle>
          <CardDescription>
            {departmentsPage?.total ?? 0} 个空间
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="搜索编码或名称"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {uiCopy.common.previous}
              </Button>
              <span className="min-w-20 text-center text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                {uiCopy.common.next}
              </Button>
            </div>
          </div>
          {departmentsQuery.isError ? (
            <p className="text-sm text-red-600">
              {uiCopy.errors.loadDepartments}
            </p>
          ) : (
            <DataTable
              columns={departmentColumns}
              data={departments}
              emptyLabel={uiCopy.empty.departments}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
