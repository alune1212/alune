import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  createDictionaryItem,
  createDictionaryType,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  type DictionaryItemPublic,
  type DictionaryTypePublic
} from "@alune/api-client";

const typeColumns: ColumnDef<DictionaryTypePublic>[] = [
  { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-medium">{row.original.code}</span> },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "-" },
  { accessorKey: "is_system", header: "System", cell: ({ row }) => (row.original.is_system ? "Yes" : "No") }
];

const itemColumns: ColumnDef<DictionaryItemPublic>[] = [
  { accessorKey: "label", header: "Label" },
  { accessorKey: "value", header: "Value" },
  { accessorKey: "type_id", header: "Type ID" },
  { accessorKey: "is_active", header: "Status", cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive") }
];

export function DictionariesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [itemValue, setItemValue] = useState("");

  const typesQuery = useQuery({
    queryKey: ["internal", "dictionaries", "types"],
    queryFn: () => fetchDictionaryTypes(auth.token!),
    enabled: auth.token !== null
  });
  const itemsQuery = useQuery({
    queryKey: ["internal", "dictionaries", "items"],
    queryFn: () => fetchDictionaryItems(auth.token!),
    enabled: auth.token !== null
  });

  const createTypeMutation = useMutation({
    mutationFn: () => createDictionaryType(auth.token!, { code: typeCode, name: typeName }),
    onSuccess: () => {
      setTypeCode("");
      setTypeName("");
      queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] });
    }
  });
  const createItemMutation = useMutation({
    mutationFn: () =>
      createDictionaryItem(auth.token!, { type_id: itemTypeId, label: itemLabel, value: itemValue }),
    onSuccess: () => {
      setItemLabel("");
      setItemValue("");
      queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] });
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Dictionaries</h1>
        <p className="mt-2 text-sm text-slate-600">Basic dictionary types and items.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create type</CardTitle>
          <CardDescription>Minimal dictionary type creation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input value={typeCode} onChange={(event) => setTypeCode(event.target.value)} placeholder="Code" />
          <Input value={typeName} onChange={(event) => setTypeName(event.target.value)} placeholder="Name" />
          <Button type="button" onClick={() => createTypeMutation.mutate()} disabled={!typeCode || !typeName}>
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Types</CardTitle>
          <CardDescription>{typesQuery.data?.data.length ?? 0} types</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={typeColumns} data={typesQuery.data?.data ?? []} emptyLabel="No types found." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create item</CardTitle>
          <CardDescription>Use a type ID from the list above.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input value={itemTypeId} onChange={(event) => setItemTypeId(event.target.value)} placeholder="Type ID" />
          <Input value={itemLabel} onChange={(event) => setItemLabel(event.target.value)} placeholder="Label" />
          <Input value={itemValue} onChange={(event) => setItemValue(event.target.value)} placeholder="Value" />
          <Button
            type="button"
            onClick={() => createItemMutation.mutate()}
            disabled={!itemTypeId || !itemLabel || !itemValue}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>{itemsQuery.data?.data.length ?? 0} items</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={itemColumns} data={itemsQuery.data?.data ?? []} emptyLabel="No items found." />
        </CardContent>
      </Card>
    </div>
  );
}
