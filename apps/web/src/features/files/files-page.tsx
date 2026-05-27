import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  downloadFileAttachment,
  uploadFileAttachment,
  type FileAttachmentPublic,
} from "@alune/api-client";
import { useGetFileAttachmentsApiV1FilesGet } from "@alune/api-client/generated";

const fileColumns: ColumnDef<FileAttachmentPublic>[] = [
  { accessorKey: "original_filename", header: "原始文件名" },
  { accessorKey: "filename", header: "存储文件名" },
  {
    accessorKey: "content_type",
    header: "类型",
    cell: ({ row }) => row.original.content_type ?? "-",
  },
  { accessorKey: "size_bytes", header: "大小" },
  { accessorKey: "storage_path", header: "路径" },
];

export function FilesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filesQuery = useGetFileAttachmentsApiV1FilesGet(
    { q: search || undefined, page, page_size: 10 },
    {
      query: {
        queryKey: ["internal", "files", search, page],
        enabled: auth.token !== null,
      },
      request: {
        headers: auth.token
          ? { Authorization: `Bearer ${auth.token}` }
          : undefined,
      },
    },
  );

  const uploadMutation = useMutation({
    mutationFn: () => uploadFileAttachment(auth.token!, selectedFile!),
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["internal", "files"] });
    },
  });
  const downloadMutation = useMutation({
    mutationFn: (file: FileAttachmentPublic) =>
      downloadFileAttachment(auth.token!, file.id),
    onSuccess: (blob, file) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.original_filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });

  const filesPage =
    filesQuery.data?.status === 200 ? filesQuery.data.data.data : undefined;
  const files = filesPage?.items ?? [];
  const totalPages = filesPage
    ? Math.max(1, Math.ceil(filesPage.total / filesPage.page_size))
    : 1;
  const columns: ColumnDef<FileAttachmentPublic>[] = [
    ...fileColumns,
    {
      id: "actions",
      header: uiCopy.common.actions,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadMutation.mutate(row.original)}
        >
          {uiCopy.common.download}
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.files}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          存储在平台本地空间中的文件附件。
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
          <CardDescription>
            存储二进制内容并登记附件元数据。默认策略允许上传 10 MB 以内的
            PDF、JPG、PNG、TXT、DOCX 和 XLSX 文件。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            type="file"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
          />
          <Button
            type="button"
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uiCopy.common.upload}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>附件列表</CardTitle>
          <CardDescription>{filesPage?.total ?? 0} 个文件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="搜索原始文件名"
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
          <DataTable
            columns={columns}
            data={files}
            emptyLabel={uiCopy.empty.files}
          />
        </CardContent>
      </Card>
    </div>
  );
}
