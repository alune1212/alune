import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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
  useDeleteKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdDelete,
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
  useIndexKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdIndexPost,
  useListKnowledgeDocumentsApiV1KnowledgeBasesKnowledgeBaseIdDocumentsGet,
  useUploadKnowledgeDocumentApiV1KnowledgeBasesKnowledgeBaseIdDocumentsUploadPost,
} from "@alune/api-client/generated";

function statusLabel(status: string): string {
  if (status === "indexed") {
    return "已索引";
  }
  if (status === "failed") {
    return "失败";
  }
  return "待索引";
}

export function DocumentsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const request = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const basesQuery = useGetKnowledgeBasesApiV1KnowledgeBasesGet(
    { is_active: true, page: 1, page_size: 50 },
    { query: { queryKey: ["knowledge-bases"] }, request },
  );
  const basesPage =
    basesQuery.data?.status === 200 ? basesQuery.data.data.data : undefined;
  const bases = basesPage?.items ?? [];
  const effectiveBaseId = selectedBaseId || bases[0]?.id || "";
  const documentsQuery =
    useListKnowledgeDocumentsApiV1KnowledgeBasesKnowledgeBaseIdDocumentsGet(
      effectiveBaseId,
      { page: 1, page_size: 50 },
      {
        query: {
          queryKey: ["knowledge-documents", effectiveBaseId],
          enabled: effectiveBaseId !== "",
        },
        request,
      },
    );
  const documentsPage =
    documentsQuery.data?.status === 200
      ? documentsQuery.data.data.data
      : undefined;
  const documents = documentsPage?.items ?? [];

  const uploadMutation =
    useUploadKnowledgeDocumentApiV1KnowledgeBasesKnowledgeBaseIdDocumentsUploadPost(
      {
        mutation: {
          onSuccess: () => {
            setSelectedFile(null);
            queryClient.invalidateQueries({
              queryKey: ["knowledge-documents"],
            });
          },
        },
        request,
      },
    );
  const deleteMutation =
    useDeleteKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdDelete({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] }),
      },
      request,
    });
  const indexMutation =
    useIndexKnowledgeDocumentApiV1KnowledgeDocumentsDocumentIdIndexPost({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] }),
      },
      request,
    });

  function uploadDocument() {
    if (!selectedFile || !effectiveBaseId) {
      return;
    }
    uploadMutation.mutate({
      knowledgeBaseId: effectiveBaseId,
      data: { upload: selectedFile },
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.documents}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          上传 PDF、DOCX、TXT 或 Markdown 文档，并生成可检索索引。
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>上传知识文档</CardTitle>
          <CardDescription>
            文档会写入文件存储，并同步解析、切片和索引。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={effectiveBaseId}
            onChange={(event) => setSelectedBaseId(event.target.value)}
          >
            {bases.map((knowledgeBase) => (
              <option key={knowledgeBase.id} value={knowledgeBase.id}>
                {knowledgeBase.name}
              </option>
            ))}
          </select>
          <Input
            type="file"
            accept=".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
          />
          <Button
            type="button"
            onClick={uploadDocument}
            disabled={
              !selectedFile || !effectiveBaseId || uploadMutation.isPending
            }
          >
            {uiCopy.common.upload}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>文档列表</CardTitle>
          <CardDescription>{documents.length} 个文档</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              {documentsQuery.isError
                ? uiCopy.errors.loadDocuments
                : uiCopy.empty.documents}
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 className="font-medium text-slate-950">
                      {document.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {statusLabel(document.status)} · {document.chunk_count}{" "}
                      个片段
                    </p>
                    {document.error_message ? (
                      <p className="mt-1 text-sm text-red-600">
                        {document.error_message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        indexMutation.mutate({ documentId: document.id })
                      }
                      disabled={indexMutation.isPending}
                    >
                      重新索引
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        deleteMutation.mutate({ documentId: document.id })
                      }
                    >
                      {uiCopy.common.delete}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
