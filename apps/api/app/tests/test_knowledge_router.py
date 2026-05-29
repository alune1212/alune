from datetime import UTC, datetime
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import Page
from app.modules.auth.models import User
from app.modules.knowledge import router as knowledge_router
from app.modules.knowledge.models import KnowledgeBase, KnowledgeDocument
from app.modules.knowledge.schemas import KnowledgeBaseCreate, RAGAskRequest


class FakeSession:
    def __init__(self) -> None:
        self.added_objects: list[object] = []
        self.commits = 0

    def add(self, value: object) -> None:
        self.added_objects.append(value)

    async def flush(self) -> None:
        for value in self.added_objects:
            if isinstance(value, KnowledgeBase) and value.id is None:
                value.id = uuid4()
                value.created_at = datetime.now(UTC)
                value.updated_at = datetime.now(UTC)

    async def commit(self) -> None:
        self.commits += 1

    async def refresh(self, value: object) -> None:
        if isinstance(value, KnowledgeBase):
            value.updated_at = datetime.now(UTC)


def build_user(*, is_superuser: bool = True) -> User:
    return User(
        id=uuid4(),
        username="admin",
        email="admin@example.com",
        hashed_password="hash",
        is_active=True,
        is_superuser=is_superuser,
    )


def build_knowledge_base(*, owner_id: UUID | None = None) -> KnowledgeBase:
    return KnowledgeBase(
        id=uuid4(),
        name="Product Docs",
        description="Internal product knowledge.",
        is_active=True,
        created_by_id=owner_id or uuid4(),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def build_document(*, knowledge_base_id: UUID) -> KnowledgeDocument:
    return KnowledgeDocument(
        id=uuid4(),
        knowledge_base_id=knowledge_base_id,
        file_attachment_id=uuid4(),
        title="Guide",
        source_type="upload",
        status="indexed",
        error_message=None,
        chunk_count=2,
        created_by_id=uuid4(),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_create_knowledge_base_records_owner_and_operation_log(monkeypatch) -> None:
    operation_log: dict[str, object] = {}

    async def fake_record_operation_log(*args, **kwargs):
        operation_log.update(kwargs)

    monkeypatch.setattr(knowledge_router, "record_operation_log", fake_record_operation_log)

    session = FakeSession()
    current_user = build_user()
    response = await knowledge_router.create_knowledge_base(
        payload=KnowledgeBaseCreate(name="Product Docs", description="Internal product knowledge."),
        session=cast(AsyncSession, session),
        current_user=current_user,
    )

    assert response.data.name == "Product Docs"
    assert response.data.created_by_id == current_user.id
    assert session.commits == 1
    assert operation_log["action"] == "create"
    assert operation_log["resource"] == "knowledge_base"


@pytest.mark.asyncio
async def test_get_knowledge_bases_filters_by_current_user(monkeypatch) -> None:
    current_user = build_user(is_superuser=False)
    expected_user = current_user
    knowledge_base = build_knowledge_base(owner_id=current_user.id)

    async def fake_list_knowledge_bases(
        session,
        *,
        current_user: User,
        q,
        is_active,
        offset,
        limit,
    ):
        assert current_user.id == expected_user.id
        assert is_active is True
        assert offset == 0
        assert limit == 20
        return [knowledge_base], 1

    monkeypatch.setattr(
        knowledge_router,
        "list_knowledge_bases",
        fake_list_knowledge_bases,
    )

    response = await knowledge_router.get_knowledge_bases(
        session=cast(AsyncSession, FakeSession()),
        current_user=current_user,
        q=None,
        is_active=True,
        page=1,
        page_size=20,
    )

    assert isinstance(response.data, Page)
    assert response.data.total == 1
    assert response.data.items[0].id == knowledge_base.id


@pytest.mark.asyncio
async def test_list_documents_requires_knowledge_base_member(monkeypatch) -> None:
    current_user = build_user(is_superuser=False)
    knowledge_base = build_knowledge_base()

    async def fake_get_knowledge_base_by_id(session, knowledge_base_id):
        return knowledge_base

    async def fake_user_can_access_knowledge_base(session, *, user, knowledge_base_id, roles):
        return False

    monkeypatch.setattr(
        knowledge_router,
        "get_knowledge_base_by_id",
        fake_get_knowledge_base_by_id,
    )
    monkeypatch.setattr(
        knowledge_router,
        "user_can_access_knowledge_base",
        fake_user_can_access_knowledge_base,
    )

    with pytest.raises(HTTPException) as exc_info:
        await knowledge_router.list_knowledge_documents(
            knowledge_base_id=knowledge_base.id,
            session=cast(AsyncSession, FakeSession()),
            current_user=current_user,
            status=None,
            page=1,
            page_size=20,
        )

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_ask_rag_returns_answer_with_citations(monkeypatch) -> None:
    current_user = build_user()
    knowledge_base = build_knowledge_base(owner_id=current_user.id)
    document = build_document(knowledge_base_id=knowledge_base.id)

    async def fake_answer_question(session, *, question, knowledge_base_ids, settings):
        assert question == "How do I use it?"
        assert knowledge_base_ids == [knowledge_base.id]
        return {
            "answer": "Use the documented flow.",
            "citations": [
                {
                    "chunk_id": uuid4(),
                    "document_id": document.id,
                    "document_title": document.title,
                    "chunk_index": 0,
                    "content": "Use the documented flow.",
                    "score": 0.05,
                }
            ],
        }

    async def fake_get_knowledge_base_by_id(session, knowledge_base_id):
        return knowledge_base

    async def fake_user_can_access_knowledge_base(session, *, user, knowledge_base_id, roles):
        return True

    async def fake_record_operation_log(*args, **kwargs):
        return None

    monkeypatch.setattr(knowledge_router, "answer_question", fake_answer_question)
    monkeypatch.setattr(
        knowledge_router,
        "get_knowledge_base_by_id",
        fake_get_knowledge_base_by_id,
    )
    monkeypatch.setattr(
        knowledge_router,
        "user_can_access_knowledge_base",
        fake_user_can_access_knowledge_base,
    )
    monkeypatch.setattr(knowledge_router, "record_operation_log", fake_record_operation_log)

    response = await knowledge_router.ask_rag(
        payload=RAGAskRequest(question="How do I use it?", knowledge_base_ids=[knowledge_base.id]),
        session=cast(AsyncSession, FakeSession()),
        settings=knowledge_router.get_settings(),
        current_user=current_user,
    )

    assert response.data.answer == "Use the documented flow."
    assert len(response.data.citations) == 1


@pytest.mark.asyncio
async def test_delete_document_removes_chunks_and_records_log(monkeypatch) -> None:
    current_user = build_user()
    knowledge_base = build_knowledge_base(owner_id=current_user.id)
    document = build_document(knowledge_base_id=knowledge_base.id)
    deleted_chunks: list[UUID] = []
    operation_log: dict[str, object] = {}

    async def fake_get_knowledge_document_by_id(session, document_id):
        return document

    async def fake_get_knowledge_base_by_id(session, knowledge_base_id):
        return knowledge_base

    async def fake_user_can_access_knowledge_base(session, *, user, knowledge_base_id, roles):
        return True

    async def fake_delete_document_chunks(session, *, document_id):
        deleted_chunks.append(document_id)

    async def fake_record_operation_log(*args, **kwargs):
        operation_log.update(kwargs)

    monkeypatch.setattr(
        knowledge_router,
        "get_knowledge_document_by_id",
        fake_get_knowledge_document_by_id,
    )
    monkeypatch.setattr(
        knowledge_router,
        "get_knowledge_base_by_id",
        fake_get_knowledge_base_by_id,
    )
    monkeypatch.setattr(
        knowledge_router,
        "user_can_access_knowledge_base",
        fake_user_can_access_knowledge_base,
    )
    monkeypatch.setattr(knowledge_router, "delete_document_chunks", fake_delete_document_chunks)
    monkeypatch.setattr(knowledge_router, "record_operation_log", fake_record_operation_log)

    response = await knowledge_router.delete_knowledge_document(
        document_id=document.id,
        session=cast(AsyncSession, FakeSession()),
        current_user=current_user,
    )

    assert deleted_chunks == [document.id]
    assert response.data.chunk_count == 0
    assert operation_log["action"] == "delete"
