import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  useCreateRoleApiV1RolesPost,
  useDeleteRoleApiV1RolesRoleIdDelete,
  useGetPermissionsApiV1RolesPermissionsGet,
  useGetRolePermissionsApiV1RolesRoleIdPermissionsGet,
  useGetRolesApiV1RolesGet,
  useUpdateRoleApiV1RolesRoleIdPatch,
  useUpdateRolePermissionsApiV1RolesRoleIdPermissionsPut,
  type PermissionPublic,
  type RolePublic,
} from "@alune/api-client/generated";

export function RolesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionDrafts, setPermissionDrafts] = useState<
    Record<string, string[]>
  >({});
  const [roleCode, setRoleCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRoleCode, setEditRoleCode] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const authRequest = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const rolesQuery = useGetRolesApiV1RolesGet({
    query: {
      queryKey: ["internal", "roles"],
      enabled: auth.token !== null,
    },
    request: authRequest,
  });
  const permissionsQuery = useGetPermissionsApiV1RolesPermissionsGet({
    query: {
      queryKey: ["internal", "permissions"],
      enabled: auth.token !== null,
    },
    request: authRequest,
  });
  const rolePermissionsQuery =
    useGetRolePermissionsApiV1RolesRoleIdPermissionsGet(selectedRoleId ?? "", {
      query: {
        queryKey: ["internal", "roles", selectedRoleId, "permissions"],
        enabled: auth.token !== null && selectedRoleId !== null,
      },
      request: authRequest,
    });
  const roles = useMemo(
    () => rolesQuery.data?.data.data ?? [],
    [rolesQuery.data?.data.data],
  );
  const permissions = useMemo(
    () => permissionsQuery.data?.data.data ?? [],
    [permissionsQuery.data?.data.data],
  );
  const fetchedPermissionCodes = useMemo(
    () =>
      rolePermissionsQuery.data?.status === 200
        ? rolePermissionsQuery.data.data.data.permission_codes
        : [],
    [rolePermissionsQuery.data],
  );
  const selectedPermissionCodes = useMemo(() => {
    if (selectedRoleId === null) {
      return new Set<string>();
    }
    return new Set(permissionDrafts[selectedRoleId] ?? fetchedPermissionCodes);
  }, [fetchedPermissionCodes, permissionDrafts, selectedRoleId]);
  const groupedPermissions = useMemo(() => {
    const search = permissionSearch.trim().toLowerCase();
    const filteredPermissions = permissions.filter((permission) => {
      if (!search) {
        return true;
      }
      return (
        permission.code.toLowerCase().includes(search) ||
        permission.name.toLowerCase().includes(search) ||
        (permission.description ?? "").toLowerCase().includes(search)
      );
    });
    return filteredPermissions.reduce<Record<string, PermissionPublic[]>>(
      (groups, permission) => {
        const group = groups[permission.type];
        if (group) {
          group.push(permission);
        } else {
          groups[permission.type] = [permission];
        }
        return groups;
      },
      {},
    );
  }, [permissionSearch, permissions]);
  const updatePermissionsMutation =
    useUpdateRolePermissionsApiV1RolesRoleIdPermissionsPut({
      mutation: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["internal", "roles"] });
        },
      },
      request: authRequest,
    });
  const createRoleMutation = useCreateRoleApiV1RolesPost({
    mutation: {
      onSuccess: () => {
        setRoleCode("");
        setRoleName("");
        setRoleDescription("");
        queryClient.invalidateQueries({ queryKey: ["internal", "roles"] });
      },
    },
    request: authRequest,
  });
  const updateRoleMutation = useUpdateRoleApiV1RolesRoleIdPatch({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["internal", "roles"] }),
    },
    request: authRequest,
  });
  const deleteRoleMutation = useDeleteRoleApiV1RolesRoleIdDelete({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["internal", "roles"] }),
    },
    request: authRequest,
  });

  const roleColumnsWithActions = useMemo<ColumnDef<RolePublic>[]>(
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
        accessorKey: "description",
        header: uiCopy.common.description,
        cell: ({ row }) => row.original.description ?? "-",
      },
      {
        accessorKey: "is_system",
        header: uiCopy.common.system,
        cell: ({ row }) =>
          row.original.is_system ? uiCopy.common.yes : uiCopy.common.no,
      },
      {
        id: "actions",
        header: uiCopy.common.actions,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedRoleId(row.original.id);
              }}
            >
              配置权限
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => startEditRole(row.original)}
            >
              {uiCopy.common.edit}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={row.original.is_system}
              onClick={() =>
                deleteRoleMutation.mutate({ roleId: row.original.id })
              }
            >
              {uiCopy.common.delete}
            </Button>
          </div>
        ),
      },
    ],
    [deleteRoleMutation],
  );

  function togglePermission(permission: PermissionPublic) {
    if (selectedRoleId === null) {
      return;
    }

    setPermissionDrafts((current) => {
      const next = new Set(current[selectedRoleId] ?? fetchedPermissionCodes);
      if (next.has(permission.code)) {
        next.delete(permission.code);
      } else {
        next.add(permission.code);
      }
      return { ...current, [selectedRoleId]: [...next] };
    });
  }

  function startEditRole(role: RolePublic) {
    setEditRoleId(role.id);
    setEditRoleCode(role.code);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description ?? "");
  }

  function submitCreateRole() {
    createRoleMutation.mutate({
      data: {
        code: roleCode,
        name: roleName,
        description: roleDescription || null,
      },
    });
  }

  function submitUpdateRole() {
    if (editRoleId === null) {
      return;
    }
    updateRoleMutation.mutate({
      roleId: editRoleId,
      data: {
        code: editRoleCode,
        name: editRoleName,
        description: editRoleDescription || null,
      },
    });
  }

  function saveRolePermissions() {
    if (selectedRoleId === null) {
      return;
    }
    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      data: { permission_codes: [...selectedPermissionCodes] },
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.roles}
        </h1>
        <p className="mt-2 text-sm text-slate-600">权限基线使用的角色记录。</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>创建角色</CardTitle>
          <CardDescription>添加一个用于权限分配的自定义角色。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input
            value={roleCode}
            onChange={(event) => setRoleCode(event.target.value)}
            placeholder={uiCopy.common.code}
          />
          <Input
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            placeholder={uiCopy.common.name}
          />
          <Input
            value={roleDescription}
            onChange={(event) => setRoleDescription(event.target.value)}
            placeholder={uiCopy.common.description}
          />
          <Button
            type="button"
            disabled={!roleCode || !roleName}
            onClick={submitCreateRole}
          >
            {uiCopy.common.create}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>编辑角色</CardTitle>
          <CardDescription>系统角色受保护，不能编辑或删除。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input
            value={editRoleCode}
            onChange={(event) => setEditRoleCode(event.target.value)}
            placeholder={uiCopy.common.code}
          />
          <Input
            value={editRoleName}
            onChange={(event) => setEditRoleName(event.target.value)}
            placeholder={uiCopy.common.name}
          />
          <Input
            value={editRoleDescription}
            onChange={(event) => setEditRoleDescription(event.target.value)}
            placeholder={uiCopy.common.description}
          />
          <Button
            type="button"
            disabled={!editRoleId || !editRoleCode || !editRoleName}
            onClick={submitUpdateRole}
          >
            {uiCopy.common.save}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <CardDescription>{roles.length} 个角色</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isError ? (
            <p className="text-sm text-red-600">{uiCopy.errors.loadRoles}</p>
          ) : (
            <DataTable
              columns={roleColumnsWithActions}
              data={roles}
              emptyLabel={uiCopy.empty.roles}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>权限分配</CardTitle>
          <CardDescription>选择角色，调整权限编码后保存。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRoleId === null ? (
            <p className="text-sm text-slate-500">从表格中选择角色。</p>
          ) : (
            <>
              <Input
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="搜索权限"
              />
              {Object.keys(groupedPermissions).length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  {uiCopy.empty.permissions}
                </p>
              ) : null}
              {Object.entries(groupedPermissions).map(
                ([type, groupPermissions]) => (
                  <section key={type} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-sm font-semibold text-slate-950">
                        {type}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {groupPermissions.length} 个权限
                      </span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {groupPermissions.map((permission) => (
                        <label
                          key={permission.code}
                          className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissionCodes.has(
                              permission.code,
                            )}
                            onChange={() => togglePermission(permission)}
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-medium text-slate-950">
                              {permission.code}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {permission.name}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                ),
              )}
              <Button type="button" onClick={saveRolePermissions}>
                保存权限
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
