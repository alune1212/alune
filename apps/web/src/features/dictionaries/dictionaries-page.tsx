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
  useCreateDictionaryItemApiV1DictionariesItemsPost,
  useCreateDictionaryTypeApiV1DictionariesTypesPost,
  useDeleteDictionaryItemApiV1DictionariesItemsItemIdDelete,
  useDeleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete,
  useGetDictionaryItemsApiV1DictionariesItemsGet,
  useGetDictionaryTypesApiV1DictionariesTypesGet,
  useUpdateDictionaryItemApiV1DictionariesItemsItemIdPatch,
  useUpdateDictionaryTypeApiV1DictionariesTypesTypeIdPatch,
  type DictionaryItemPublic,
  type DictionaryTypePublic,
} from "@alune/api-client/generated";

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

  const authRequest = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const typesQuery = useGetDictionaryTypesApiV1DictionariesTypesGet({
    query: {
      queryKey: ["internal", "dictionaries", "types"],
      enabled: auth.token !== null,
    },
    request: authRequest,
  });
  const itemsQuery = useGetDictionaryItemsApiV1DictionariesItemsGet({
    query: {
      queryKey: ["internal", "dictionaries", "items"],
      enabled: auth.token !== null,
    },
    request: authRequest,
  });

  const createTypeMutation = useCreateDictionaryTypeApiV1DictionariesTypesPost({
    mutation: {
      onSuccess: () => {
        setTypeCode("");
        setTypeName("");
        queryClient.invalidateQueries({
          queryKey: ["internal", "dictionaries"],
        });
      },
    },
    request: authRequest,
  });
  const createItemMutation = useCreateDictionaryItemApiV1DictionariesItemsPost({
    mutation: {
      onSuccess: () => {
        setItemLabel("");
        setItemValue("");
        queryClient.invalidateQueries({
          queryKey: ["internal", "dictionaries"],
        });
      },
    },
    request: authRequest,
  });
  const updateTypeMutation =
    useUpdateDictionaryTypeApiV1DictionariesTypesTypeIdPatch({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: ["internal", "dictionaries"],
          }),
      },
      request: authRequest,
    });
  const deleteTypeMutation =
    useDeleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: ["internal", "dictionaries"],
          }),
      },
      request: authRequest,
    });
  const updateItemMutation =
    useUpdateDictionaryItemApiV1DictionariesItemsItemIdPatch({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: ["internal", "dictionaries"],
          }),
      },
      request: authRequest,
    });
  const deleteItemMutation =
    useDeleteDictionaryItemApiV1DictionariesItemsItemIdDelete({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: ["internal", "dictionaries"],
          }),
      },
      request: authRequest,
    });

  const dictionaryTypes = typesQuery.data?.data.data ?? [];
  const dictionaryItems = itemsQuery.data?.data.data ?? [];
  const selectedItem =
    dictionaryItems.find((item) => item.id === selectedItemId) ?? null;

  function submitCreateType() {
    createTypeMutation.mutate({ data: { code: typeCode, name: typeName } });
  }

  function submitCreateItem() {
    createItemMutation.mutate({
      data: { type_id: itemTypeId, label: itemLabel, value: itemValue },
    });
  }

  function submitUpdateType() {
    if (selectedTypeId === null) {
      return;
    }
    updateTypeMutation.mutate({
      typeId: selectedTypeId,
      data: {
        code: editTypeCode,
        name: editTypeName,
        description: editTypeDescription || null,
      },
    });
  }

  function submitUpdateItem() {
    if (selectedItemId === null) {
      return;
    }
    updateItemMutation.mutate({
      itemId: selectedItemId,
      data: {
        label: editLabel,
        value: editValue,
        sort_order: Number(editSortOrder),
      },
    });
  }

  const toggleItem = useCallback(
    (item: DictionaryItemPublic) => {
      updateItemMutation.mutate({
        itemId: item.id,
        data: { is_active: !item.is_active },
      });
    },
    [updateItemMutation],
  );

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
        header: uiCopy.common.code,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.code}</span>
        ),
      },
      { accessorKey: "name", header: uiCopy.common.name },
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
              onClick={() => startEditType(row.original)}
            >
              {uiCopy.common.edit}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={row.original.is_system}
              onClick={() =>
                deleteTypeMutation.mutate({ typeId: row.original.id })
              }
            >
              {uiCopy.common.delete}
            </Button>
          </div>
        ),
      },
    ],
    [deleteTypeMutation, startEditType],
  );

  const itemColumns: ColumnDef<DictionaryItemPublic>[] = useMemo(
    () => [
      { accessorKey: "label", header: "标签" },
      { accessorKey: "value", header: "值" },
      { accessorKey: "type_id", header: "类型 ID" },
      { accessorKey: "sort_order", header: "排序" },
      {
        accessorKey: "is_active",
        header: uiCopy.common.status,
        cell: ({ row }) =>
          row.original.is_active
            ? uiCopy.common.active
            : uiCopy.common.inactive,
      },
      {
        id: "actions",
        header: uiCopy.common.actions,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => startEditItem(row.original)}
            >
              {uiCopy.common.edit}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => toggleItem(row.original)}
            >
              {row.original.is_active
                ? uiCopy.common.disable
                : uiCopy.common.enable}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                deleteItemMutation.mutate({ itemId: row.original.id })
              }
            >
              {uiCopy.common.delete}
            </Button>
          </div>
        ),
      },
    ],
    [startEditItem, toggleItem, deleteItemMutation],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.dictionaries}
        </h1>
        <p className="mt-2 text-sm text-slate-600">基础字典类型和字典项。</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>创建字典类型</CardTitle>
          <CardDescription>创建最小字典类型记录。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            value={typeCode}
            onChange={(event) => setTypeCode(event.target.value)}
            placeholder={uiCopy.common.code}
          />
          <Input
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
            placeholder={uiCopy.common.name}
          />
          <Button
            type="button"
            onClick={submitCreateType}
            disabled={!typeCode || !typeName}
          >
            {uiCopy.common.create}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>字典类型</CardTitle>
          <CardDescription>{dictionaryTypes.length} 个类型</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              value={editTypeCode}
              onChange={(event) => setEditTypeCode(event.target.value)}
              placeholder={uiCopy.common.code}
            />
            <Input
              value={editTypeName}
              onChange={(event) => setEditTypeName(event.target.value)}
              placeholder={uiCopy.common.name}
            />
            <Input
              value={editTypeDescription}
              onChange={(event) => setEditTypeDescription(event.target.value)}
              placeholder={uiCopy.common.description}
            />
            <Button
              type="button"
              onClick={submitUpdateType}
              disabled={
                !selectedTypeId ||
                !editTypeCode ||
                !editTypeName ||
                updateTypeMutation.isPending
              }
            >
              保存类型
            </Button>
          </div>
          <DataTable
            columns={typeColumns}
            data={dictionaryTypes}
            emptyLabel={uiCopy.empty.dictionaryTypes}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>创建字典项</CardTitle>
          <CardDescription>使用上方列表中的类型 ID。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input
            value={itemTypeId}
            onChange={(event) => setItemTypeId(event.target.value)}
            placeholder="类型 ID"
          />
          <Input
            value={itemLabel}
            onChange={(event) => setItemLabel(event.target.value)}
            placeholder="标签"
          />
          <Input
            value={itemValue}
            onChange={(event) => setItemValue(event.target.value)}
            placeholder="值"
          />
          <Button
            type="button"
            onClick={submitCreateItem}
            disabled={!itemTypeId || !itemLabel || !itemValue}
          >
            {uiCopy.common.create}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>字典项</CardTitle>
          <CardDescription>{dictionaryItems.length} 个字典项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              value={editLabel}
              onChange={(event) => setEditLabel(event.target.value)}
              placeholder={
                selectedItem ? `正在编辑 ${selectedItem.label}` : "标签"
              }
            />
            <Input
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              placeholder="值"
            />
            <Input
              value={editSortOrder}
              onChange={(event) => setEditSortOrder(event.target.value)}
              placeholder="排序值"
              type="number"
            />
            <Button
              type="button"
              onClick={submitUpdateItem}
              disabled={
                !selectedItemId ||
                !editLabel ||
                !editValue ||
                updateItemMutation.isPending
              }
            >
              保存字典项
            </Button>
          </div>
          <DataTable
            columns={itemColumns}
            data={dictionaryItems}
            emptyLabel={uiCopy.empty.dictionaryItems}
          />
        </CardContent>
      </Card>
    </div>
  );
}
