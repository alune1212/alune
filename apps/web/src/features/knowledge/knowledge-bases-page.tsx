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
  useCreateKnowledgeBaseApiV1KnowledgeBasesPost,
  useDeleteKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdDelete,
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
  useUpdateKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdPatch,
  type KnowledgeBasePublic,
} from "@alune/api-client/generated";

export function KnowledgeBasesPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingBase, setEditingBase] = useState<KnowledgeBasePublic | null>(
    null,
  );

  const request = useMemo(
    () => ({
      headers: auth.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
    }),
    [auth.token],
  );
  const basesQuery = useGetKnowledgeBasesApiV1KnowledgeBasesGet(
    { page: 1, page_size: 50 },
    { query: { queryKey: ["knowledge-bases"] }, request },
  );
  const basesPage =
    basesQuery.data?.status === 200 ? basesQuery.data.data.data : undefined;
  const bases = basesPage?.items ?? [];

  function resetForm() {
    setName("");
    setDescription("");
    setEditingBase(null);
  }

  const createMutation = useCreateKnowledgeBaseApiV1KnowledgeBasesPost({
    mutation: {
      onSuccess: () => {
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      },
    },
    request,
  });
  const updateMutation =
    useUpdateKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdPatch({
      mutation: {
        onSuccess: () => {
          resetForm();
          queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
        },
      },
      request,
    });
  const deleteMutation =
    useDeleteKnowledgeBaseApiV1KnowledgeBasesKnowledgeBaseIdDelete({
      mutation: {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] }),
      },
      request,
    });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function submitKnowledgeBase() {
    if (editingBase) {
      updateMutation.mutate({
        knowledgeBaseId: editingBase.id,
        data: { name, description: description || null },
      });
      return;
    }
    createMutation.mutate({ data: { name, description: description || null } });
  }

  function startEdit(knowledgeBase: KnowledgeBasePublic) {
    setEditingBase(knowledgeBase);
    setName(knowledgeBase.name);
    setDescription(knowledgeBase.description ?? "");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.knowledge}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          管理可检索、可问答的私有知识集合。
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{editingBase ? "编辑知识库" : "创建知识库"}</CardTitle>
          <CardDescription>
            知识库用于组织文档、成员和问答检索范围。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="知识库名称"
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="知识库描述"
          />
          <div className="flex gap-2">
            {editingBase ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                取消
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={submitKnowledgeBase}
              disabled={!name || isSaving}
            >
              {editingBase ? uiCopy.common.save : uiCopy.common.create}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>知识库列表</CardTitle>
          <CardDescription>{bases.length} 个知识库</CardDescription>
        </CardHeader>
        <CardContent>
          {bases.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              {basesQuery.isError
                ? uiCopy.errors.loadKnowledgeBases
                : uiCopy.empty.knowledgeBases}
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {bases.map((knowledgeBase) => (
                <div
                  key={knowledgeBase.id}
                  className="rounded-md border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium text-slate-950">
                        {knowledgeBase.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {knowledgeBase.description || "暂无描述"}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {knowledgeBase.is_active
                        ? uiCopy.common.active
                        : uiCopy.common.inactive}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => startEdit(knowledgeBase)}
                    >
                      {uiCopy.common.edit}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        deleteMutation.mutate({
                          knowledgeBaseId: knowledgeBase.id,
                        })
                      }
                    >
                      {uiCopy.common.disable}
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
