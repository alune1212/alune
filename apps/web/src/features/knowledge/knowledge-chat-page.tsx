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
  useAskRagApiV1RagAskPost,
  useGetKnowledgeBasesApiV1KnowledgeBasesGet,
  type RAGAnswerPublic,
} from "@alune/api-client/generated";

export function KnowledgeChatPage() {
  const auth = useAuth();
  const [question, setQuestion] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [answer, setAnswer] = useState<RAGAnswerPublic | null>(null);
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
  const askMutation = useAskRagApiV1RagAskPost({
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          setAnswer(response.data.data);
        }
      },
    },
    request,
  });

  function askQuestion() {
    if (!question || !effectiveBaseId) {
      return;
    }
    askMutation.mutate({
      data: { question, knowledge_base_ids: [effectiveBaseId] },
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {uiCopy.modules.ragChat}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          基于已索引知识库提问，并查看回答引用的来源片段。
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>提问</CardTitle>
          <CardDescription>第一版支持单轮问答和来源引用。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={effectiveBaseId}
            onChange={(event) => setSelectedBaseId(event.target.value)}
          >
            {bases.map((knowledgeBase) => (
              <option key={knowledgeBase.id} value={knowledgeBase.id}>
                {knowledgeBase.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="输入你的问题"
            />
            <Button
              type="button"
              onClick={askQuestion}
              disabled={!question || !effectiveBaseId || askMutation.isPending}
            >
              提问
            </Button>
          </div>
          {askMutation.isError ? (
            <p className="text-sm text-red-600">
              问答服务暂不可用，请检查 AI 服务配置。
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>回答</CardTitle>
          <CardDescription>答案仅基于检索命中的知识片段生成。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="min-h-24 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {answer?.answer ?? "提交问题后将在这里显示回答。"}
          </p>
          <div>
            <h2 className="text-sm font-medium text-slate-950">引用来源</h2>
            {answer && answer.citations.length > 0 ? (
              <div className="mt-3 space-y-3">
                {answer.citations.map((citation, index) => (
                  <div
                    key={citation.chunk_id}
                    className="rounded-md border border-slate-200 p-3 text-sm"
                  >
                    <p className="font-medium text-slate-950">
                      [{index + 1}] {citation.document_title}
                    </p>
                    <p className="mt-2 leading-6 text-slate-600">
                      {citation.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                {uiCopy.empty.citations}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
