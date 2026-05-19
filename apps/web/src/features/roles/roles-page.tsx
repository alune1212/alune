import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRolePermissions,
  fetchRoles,
  updateRole,
  updateRolePermissions,
  type PermissionPublic,
  type RolePublic
} from "@alune/api-client";

export function RolesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
  const [roleCode, setRoleCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRoleCode, setEditRoleCode] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const rolesQuery = useQuery({
    queryKey: ["internal", "roles"],
    queryFn: () => fetchRoles(auth.token!),
    enabled: auth.token !== null
  });
  const permissionsQuery = useQuery({
    queryKey: ["internal", "permissions"],
    queryFn: () => fetchPermissions(auth.token!),
    enabled: auth.token !== null
  });
  const rolePermissionsQuery = useQuery({
    queryKey: ["internal", "roles", selectedRoleId, "permissions"],
    queryFn: () => fetchRolePermissions(auth.token!, selectedRoleId!),
    enabled: auth.token !== null && selectedRoleId !== null
  });
  const roles = useMemo(() => rolesQuery.data?.data ?? [], [rolesQuery.data?.data]);
  const permissions = useMemo(() => permissionsQuery.data?.data ?? [], [permissionsQuery.data?.data]);
  const fetchedPermissionCodes = useMemo(
    () => rolePermissionsQuery.data?.data.permission_codes ?? [],
    [rolePermissionsQuery.data?.data.permission_codes]
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
    return filteredPermissions.reduce<Record<string, PermissionPublic[]>>((groups, permission) => {
      const group = groups[permission.type] ?? [];
      group.push(permission);
      return { ...groups, [permission.type]: group };
    }, {});
  }, [permissionSearch, permissions]);
  const updatePermissionsMutation = useMutation({
    mutationFn: () => updateRolePermissions(auth.token!, selectedRoleId!, [...selectedPermissionCodes]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal", "roles"] });
    }
  });
  const createRoleMutation = useMutation({
    mutationFn: () =>
      createRole(auth.token!, {
        code: roleCode,
        name: roleName,
        description: roleDescription || null
      }),
    onSuccess: () => {
      setRoleCode("");
      setRoleName("");
      setRoleDescription("");
      queryClient.invalidateQueries({ queryKey: ["internal", "roles"] });
    }
  });
  const updateRoleMutation = useMutation({
    mutationFn: () =>
      updateRole(auth.token!, editRoleId!, {
        code: editRoleCode,
        name: editRoleName,
        description: editRoleDescription || null
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "roles"] })
  });
  const deleteRoleMutation = useMutation({
    mutationFn: (role: RolePublic) => deleteRole(auth.token!, role.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "roles"] })
  });

  const roleColumnsWithActions = useMemo<ColumnDef<RolePublic>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <span className="font-medium text-slate-950">{row.original.code}</span>
      },
      {
        accessorKey: "name",
        header: "Name"
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description ?? "-"
      },
      {
        accessorKey: "is_system",
        header: "System",
        cell: ({ row }) => (row.original.is_system ? "Yes" : "No")
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedRoleId(row.original.id);
              }}
            >
              Configure
            </Button>
            <Button type="button" variant="outline" onClick={() => startEditRole(row.original)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={row.original.is_system}
              onClick={() => deleteRoleMutation.mutate(row.original)}
            >
              Delete
            </Button>
          </div>
        )
      }
    ],
    [deleteRoleMutation]
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Role records used by the permission baseline.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create role</CardTitle>
          <CardDescription>Add a custom role for permission assignment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input value={roleCode} onChange={(event) => setRoleCode(event.target.value)} placeholder="Code" />
          <Input value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Name" />
          <Input
            value={roleDescription}
            onChange={(event) => setRoleDescription(event.target.value)}
            placeholder="Description"
          />
          <Button type="button" disabled={!roleCode || !roleName} onClick={() => createRoleMutation.mutate()}>
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit role</CardTitle>
          <CardDescription>System roles are protected from edit and delete operations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input value={editRoleCode} onChange={(event) => setEditRoleCode(event.target.value)} placeholder="Code" />
          <Input value={editRoleName} onChange={(event) => setEditRoleName(event.target.value)} placeholder="Name" />
          <Input
            value={editRoleDescription}
            onChange={(event) => setEditRoleDescription(event.target.value)}
            placeholder="Description"
          />
          <Button
            type="button"
            disabled={!editRoleId || !editRoleCode || !editRoleName}
            onClick={() => updateRoleMutation.mutate()}
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role list</CardTitle>
          <CardDescription>{roles.length} roles</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load roles.</p>
          ) : (
            <DataTable columns={roleColumnsWithActions} data={roles} emptyLabel="No roles found." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission assignment</CardTitle>
          <CardDescription>Pick a role, adjust permission codes, then save.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRoleId === null ? (
            <p className="text-sm text-slate-500">Select a role from the table.</p>
          ) : (
            <>
              <Input
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="Search permissions"
              />
              {Object.entries(groupedPermissions).map(([type, groupPermissions]) => (
                <section key={type} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-semibold text-slate-950">{type}</h3>
                    <span className="text-xs text-slate-500">{groupPermissions.length} permissions</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {groupPermissions.map((permission) => (
                      <label
                        key={permission.code}
                        className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionCodes.has(permission.code)}
                          onChange={() => togglePermission(permission)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium text-slate-950">{permission.code}</span>
                          <span className="block text-xs text-slate-500">{permission.name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
              <Button type="button" onClick={() => updatePermissionsMutation.mutate()}>
                Save permissions
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
