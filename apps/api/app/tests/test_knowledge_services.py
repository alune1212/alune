from uuid import uuid4

import pytest

from app.modules.knowledge.chunker import chunk_text
from app.modules.knowledge.parser import parse_document_bytes
from app.modules.knowledge.schemas import KnowledgeBaseMembersUpdate, KnowledgeBaseMemberUpdate
from app.modules.knowledge.service import RAGCitation, build_answer_prompt


def test_chunk_text_uses_overlap_and_stable_order() -> None:
    chunks = chunk_text("abcdefghij", chunk_size=4, chunk_overlap=1)

    assert [chunk.text for chunk in chunks] == ["abcd", "defg", "ghij"]
    assert [chunk.chunk_index for chunk in chunks] == [0, 1, 2]


def test_parse_document_bytes_supports_markdown_and_text() -> None:
    parsed = parse_document_bytes(
        b"# Title\n\nA useful note.",
        filename="note.md",
        content_type="text/markdown",
    )

    assert parsed.title == "note.md"
    assert "Title" in parsed.text
    assert "useful note" in parsed.text


def test_build_answer_prompt_includes_numbered_sources_without_raw_question_logging() -> None:
    citation = RAGCitation(
        chunk_id=uuid4(),
        document_id=uuid4(),
        document_title="Handbook",
        chunk_index=0,
        content="Reset passwords from the user detail page.",
        score=0.12,
    )

    prompt = build_answer_prompt("How do I reset a password?", [citation])

    assert "How do I reset a password?" in prompt
    assert "[1] Handbook" in prompt
    assert "Reset passwords" in prompt


def test_knowledge_base_members_update_requires_owner() -> None:
    user_id = uuid4()

    with pytest.raises(ValueError, match="至少需要一个 owner"):
        KnowledgeBaseMembersUpdate(
            members=[KnowledgeBaseMemberUpdate(user_id=user_id, role="viewer")]
        )


def test_knowledge_base_members_update_rejects_duplicate_users() -> None:
    user_id = uuid4()

    with pytest.raises(ValueError, match="成员不能重复"):
        KnowledgeBaseMembersUpdate(
            members=[
                KnowledgeBaseMemberUpdate(user_id=user_id, role="owner"),
                KnowledgeBaseMemberUpdate(user_id=user_id, role="viewer"),
            ]
        )
