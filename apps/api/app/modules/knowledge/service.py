from dataclasses import dataclass
from hashlib import sha256
from uuid import UUID

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.modules.knowledge.ai_client import OpenAICompatibleClient
from app.modules.knowledge.chunker import chunk_text
from app.modules.knowledge.models import KnowledgeChunk, KnowledgeDocument
from app.modules.knowledge.parser import parse_document_bytes
from app.modules.knowledge.repository import delete_document_chunks


@dataclass(frozen=True)
class RAGCitation:
    chunk_id: UUID
    document_id: UUID
    document_title: str
    chunk_index: int
    content: str
    score: float


def build_ai_client(settings: Settings) -> OpenAICompatibleClient:
    return OpenAICompatibleClient(
        base_url=settings.ai_base_url,
        api_key=settings.ai_api_key,
        chat_model=settings.ai_chat_model,
        embedding_model=settings.ai_embedding_model,
    )


def build_answer_prompt(question: str, citations: list[RAGCitation]) -> str:
    sources = "\n\n".join(
        f"[{index}] {citation.document_title}\n{citation.content}"
        for index, citation in enumerate(citations, start=1)
    )
    return (
        "请基于以下资料回答问题。若资料不足, 请直接说明无法从当前知识库确认。\n\n"
        f"问题: {question}\n\n"
        f"资料:\n{sources}\n\n"
        "回答时请用中文, 并在相关句子后用 [1] 这样的编号标注来源。"
    )


async def index_document_content(
    session: AsyncSession,
    *,
    document: KnowledgeDocument,
    content: bytes,
    filename: str,
    content_type: str | None,
    settings: Settings,
    ai_client: OpenAICompatibleClient | None = None,
) -> KnowledgeDocument:
    client = ai_client or build_ai_client(settings)
    try:
        parsed = parse_document_bytes(content, filename=filename, content_type=content_type)
        chunks = chunk_text(
            parsed.text,
            chunk_size=settings.rag_chunk_size,
            chunk_overlap=settings.rag_chunk_overlap,
        )
        if not chunks:
            msg = "文档没有可索引的文本内容"
            raise ValueError(msg)
        embeddings = await client.embed([chunk.text for chunk in chunks])
        await delete_document_chunks(session, document_id=document.id)
        for chunk, embedding in zip(chunks, embeddings, strict=True):
            session.add(
                KnowledgeChunk(
                    knowledge_base_id=document.knowledge_base_id,
                    document_id=document.id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.text,
                    content_hash=sha256(chunk.text.encode("utf-8")).hexdigest(),
                    chunk_metadata={"title": parsed.title},
                    embedding=embedding,
                )
            )
        document.title = parsed.title
        document.status = "indexed"
        document.error_message = None
        document.chunk_count = len(chunks)
    except Exception as exc:
        document.status = "failed"
        document.error_message = str(exc)[:500]
        document.chunk_count = 0
    return document


async def answer_question(
    session: AsyncSession,
    *,
    question: str,
    knowledge_base_ids: list[UUID],
    settings: Settings,
    ai_client: OpenAICompatibleClient | None = None,
) -> dict[str, object]:
    client = ai_client or build_ai_client(settings)
    question_embedding = (await client.embed([question]))[0]
    citations = await retrieve_citations(
        session,
        knowledge_base_ids=knowledge_base_ids,
        embedding=question_embedding,
        limit=settings.rag_top_k,
    )
    prompt = build_answer_prompt(question, citations)
    answer = await client.chat(prompt)
    return {
        "answer": answer,
        "citations": [
            {
                "chunk_id": citation.chunk_id,
                "document_id": citation.document_id,
                "document_title": citation.document_title,
                "chunk_index": citation.chunk_index,
                "content": citation.content,
                "score": citation.score,
            }
            for citation in citations
        ],
    }


async def retrieve_citations(
    session: AsyncSession,
    *,
    knowledge_base_ids: list[UUID],
    embedding: list[float],
    limit: int,
) -> list[RAGCitation]:
    from app.modules.knowledge.models import Vector as _Vector

    embedding_literal = _Vector(0).bind_processor(None)(embedding)
    statement = text(
        """
        SELECT
            kc.id AS chunk_id,
            kd.id AS document_id,
            kd.title AS document_title,
            kc.chunk_index AS chunk_index,
            kc.content AS content,
            kc.embedding <=> CAST(:embedding AS vector) AS score
        FROM knowledge_chunks kc
        JOIN knowledge_documents kd ON kd.id = kc.document_id
        WHERE kc.knowledge_base_id IN :knowledge_base_ids
          AND kd.status = 'indexed'
        ORDER BY kc.embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """
    ).bindparams(bindparam("knowledge_base_ids", expanding=True))
    result = await session.execute(
        statement,
        {
            "embedding": embedding_literal,
            "knowledge_base_ids": knowledge_base_ids,
            "limit": limit,
        },
    )
    return [
        RAGCitation(
            chunk_id=row.chunk_id,
            document_id=row.document_id,
            document_title=row.document_title,
            chunk_index=row.chunk_index,
            content=row.content,
            score=float(row.score),
        )
        for row in result
    ]
