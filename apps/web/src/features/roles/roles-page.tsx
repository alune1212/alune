import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import {
  fetchPermissions,
  fetchRolePermissions,
  fetchRoles,
  updateRolePermissions,
  type PermissionPublic,
  type RolePublic
} from "@alune/api-client";

const roleColumns: ColumnDef<RolePublic>[] = [
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
  }
];

export function RolesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
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
  const roles = rolesQuery.data?.data ?? [];
  const permissions = permissionsQuery.data?.data ?? [];
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
  const updatePermissionsMutation = useMutation({
    mutationFn: () => updateRolePermissions(auth.token!, selectedRoleId!, [...selectedPermissionCodes]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal", "roles"] });
    }
  });

  const roleColumnsWithActions = useMemo<ColumnDef<RolePublic>[]>(
    () => [
      ...roleColumns,
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedRoleId(row.original.id);
            }}
          >
            Configure
          </Button>
        )
      }
    ],
    []
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Role records used by the permission baseline.</p>
      </section>

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
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {permissions.map((permission) => (
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
