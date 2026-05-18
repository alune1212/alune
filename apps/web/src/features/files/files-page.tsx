import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import {
  createFileAttachment,
  fetchFileAttachments,
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
  const [filename, setFilename] = useState("");
  const [originalFilename, setOriginalFilename] = useState("");
  const [storagePath, setStoragePath] = useState("");

  const filesQuery = useQuery({
    queryKey: ["internal", "files"],
    queryFn: () => fetchFileAttachments(auth.token!),
    enabled: auth.token !== null
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFileAttachment(auth.token!, {
        filename,
        original_filename: originalFilename,
        storage_path: storagePath,
        size_bytes: 0
      }),
    onSuccess: () => {
      setFilename("");
      setOriginalFilename("");
      setStoragePath("");
      queryClient.invalidateQueries({ queryKey: ["internal", "files"] });
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Files</h1>
        <p className="mt-2 text-sm text-slate-600">File attachment metadata; binary upload comes later.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create metadata</CardTitle>
          <CardDescription>Register a file record without uploading binary content.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input value={originalFilename} onChange={(event) => setOriginalFilename(event.target.value)} placeholder="Original filename" />
          <Input value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="Stored filename" />
          <Input value={storagePath} onChange={(event) => setStoragePath(event.target.value)} placeholder="Storage path" />
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={!originalFilename || !filename || !storagePath}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>{filesQuery.data?.data.length ?? 0} files</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={fileColumns} data={filesQuery.data?.data ?? []} emptyLabel="No files found." />
        </CardContent>
      </Card>
    </div>
  );
}
