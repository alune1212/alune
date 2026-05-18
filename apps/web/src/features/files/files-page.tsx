import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  downloadFileAttachment,
  fetchFileAttachments,
  uploadFileAttachment,
  type FileAttachmentPublic
} from "@alune/api-client";

const fileColumns: ColumnDef<FileAttachmentPublic>[] = [
  { accessorKey: "original_filename", header: "Original file" },
  { accessorKey: "filename", header: "Stored name" },
  { accessorKey: "content_type", header: "Type", cell: ({ row }) => row.original.content_type ?? "-" },
  { accessorKey: "size_bytes", header: "Size" },
  { accessorKey: "storage_path", header: "Path" }
];

export function FilesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filesQuery = useQuery({
    queryKey: ["internal", "files", search, page],
    queryFn: () => fetchFileAttachments(auth.token!, { q: search || undefined, page, pageSize: 10 }),
    enabled: auth.token !== null
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadFileAttachment(auth.token!, selectedFile!),
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["internal", "files"] });
    }
  });
  const downloadMutation = useMutation({
    mutationFn: (file: FileAttachmentPublic) => downloadFileAttachment(auth.token!, file.id),
    onSuccess: (blob, file) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.original_filename;
      anchor.click();
      URL.revokeObjectURL(url);
    }
  });

  const filesPage = filesQuery.data?.data;
  const files = filesPage?.items ?? [];
  const totalPages = filesPage ? Math.max(1, Math.ceil(filesPage.total / filesPage.page_size)) : 1;
  const columns: ColumnDef<FileAttachmentPublic>[] = [
    ...fileColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button type="button" variant="outline" onClick={() => downloadMutation.mutate(row.original)}>
          Download
        </Button>
      )
    }
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Files</h1>
        <p className="mt-2 text-sm text-slate-600">File attachments stored in the local API storage.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Upload file</CardTitle>
          <CardDescription>
            Store binary content and register attachment metadata. Default policy allows PDF, JPG, PNG, TXT, DOCX, and
            XLSX files up to 10 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>{filesPage?.total ?? 0} files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search original filename"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous
              </Button>
              <span className="min-w-20 text-center text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <DataTable columns={columns} data={files} emptyLabel="No files found." />
        </CardContent>
      </Card>
    </div>
  );
}
