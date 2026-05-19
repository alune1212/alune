import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  createDictionaryItem,
  createDictionaryType,
  deleteDictionaryItem,
  deleteDictionaryType,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  updateDictionaryItem,
  updateDictionaryType,
  type DictionaryItemPublic,
  type DictionaryTypePublic
} from "@alune/api-client";

export function DictionariesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [editTypeCode, setEditTypeCode] = useState("");
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeDescription, setEditTypeDescription] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");

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
  const updateTypeMutation = useMutation({
    mutationFn: () =>
      updateDictionaryType(auth.token!, selectedTypeId!, {
        code: editTypeCode,
        name: editTypeName,
        description: editTypeDescription || null
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] })
  });
  const deleteTypeMutation = useMutation({
    mutationFn: (type: DictionaryTypePublic) => deleteDictionaryType(auth.token!, type.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] })
  });
  const updateItemMutation = useMutation({
    mutationFn: () =>
      updateDictionaryItem(auth.token!, selectedItemId!, {
        label: editLabel,
        value: editValue,
        sort_order: Number(editSortOrder)
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] })
  });
  const toggleItemMutation = useMutation({
    mutationFn: (item: DictionaryItemPublic) =>
      updateDictionaryItem(auth.token!, item.id, { is_active: !item.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] })
  });
  const deleteItemMutation = useMutation({
    mutationFn: (item: DictionaryItemPublic) => deleteDictionaryItem(auth.token!, item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internal", "dictionaries"] })
  });

  const selectedItem = itemsQuery.data?.data.find((item) => item.id === selectedItemId) ?? null;

  const startEditType = useCallback((type: DictionaryTypePublic) => {
    setSelectedTypeId(type.id);
    setEditTypeCode(type.code);
    setEditTypeName(type.name);
    setEditTypeDescription(type.description ?? "");
  }, []);

  const startEditItem = useCallback((item: DictionaryItemPublic) => {
    setSelectedItemId(item.id);
    setEditLabel(item.label);
    setEditValue(item.value);
    setEditSortOrder(String(item.sort_order));
  }, []);

  const typeColumns: ColumnDef<DictionaryTypePublic>[] = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <span className="font-medium">{row.original.code}</span>
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "-" },
      { accessorKey: "is_system", header: "System", cell: ({ row }) => (row.original.is_system ? "Yes" : "No") },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => startEditType(row.original)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={row.original.is_system}
              onClick={() => deleteTypeMutation.mutate(row.original)}
            >
              Delete
            </Button>
          </div>
        )
      }
    ],
    [deleteTypeMutation, startEditType]
  );

  const itemColumns: ColumnDef<DictionaryItemPublic>[] = useMemo(
    () => [
      { accessorKey: "label", header: "Label" },
      { accessorKey: "value", header: "Value" },
      { accessorKey: "type_id", header: "Type ID" },
      { accessorKey: "sort_order", header: "Sort" },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive")
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => startEditItem(row.original)}>
              Edit
            </Button>
            <Button type="button" variant="outline" onClick={() => toggleItemMutation.mutate(row.original)}>
              {row.original.is_active ? "Disable" : "Enable"}
            </Button>
            <Button type="button" variant="outline" onClick={() => deleteItemMutation.mutate(row.original)}>
              Delete
            </Button>
          </div>
        )
      }
    ],
    [startEditItem, toggleItemMutation, deleteItemMutation]
  );

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
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input value={editTypeCode} onChange={(event) => setEditTypeCode(event.target.value)} placeholder="Code" />
            <Input value={editTypeName} onChange={(event) => setEditTypeName(event.target.value)} placeholder="Name" />
            <Input
              value={editTypeDescription}
              onChange={(event) => setEditTypeDescription(event.target.value)}
              placeholder="Description"
            />
            <Button
              type="button"
              onClick={() => updateTypeMutation.mutate()}
              disabled={!selectedTypeId || !editTypeCode || !editTypeName || updateTypeMutation.isPending}
            >
              Save type
            </Button>
          </div>
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
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              value={editLabel}
              onChange={(event) => setEditLabel(event.target.value)}
              placeholder={selectedItem ? `Editing ${selectedItem.label}` : "Label"}
            />
            <Input value={editValue} onChange={(event) => setEditValue(event.target.value)} placeholder="Value" />
            <Input
              value={editSortOrder}
              onChange={(event) => setEditSortOrder(event.target.value)}
              placeholder="Sort order"
              type="number"
            />
            <Button
              type="button"
              onClick={() => updateItemMutation.mutate()}
              disabled={!selectedItemId || !editLabel || !editValue || updateItemMutation.isPending}
            >
              Save item
            </Button>
          </div>
          <DataTable columns={itemColumns} data={itemsQuery.data?.data ?? []} emptyLabel="No items found." />
        </CardContent>
      </Card>
    </div>
  );
}
