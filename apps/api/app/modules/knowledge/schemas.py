from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

KnowledgeMemberRole = Literal["owner", "editor", "viewer"]
KnowledgeDocumentStatus = Literal["uploaded", "indexed", "failed"]


class KnowledgeBasePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    is_active: bool
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class KnowledgeBaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class KnowledgeBaseMemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    knowledge_base_id: UUID
    user_id: UUID
    role: KnowledgeMemberRole
    created_at: datetime
    updated_at: datetime


class KnowledgeBaseMemberUpdate(BaseModel):
    user_id: UUID
    role: KnowledgeMemberRole


class KnowledgeBaseMembersUpdate(BaseModel):
    members: list[KnowledgeBaseMemberUpdate]

    @model_validator(mode="after")
    def validate_members(self) -> KnowledgeBaseMembersUpdate:
        user_ids = [member.user_id for member in self.members]
        if len(set(user_ids)) != len(user_ids):
            msg = "成员不能重复"
            raise ValueError(msg)
        if not any(member.role == "owner" for member in self.members):
            msg = "知识库至少需要一个 owner 成员"
            raise ValueError(msg)
        return self


class KnowledgeDocumentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    knowledge_base_id: UUID
    file_attachment_id: UUID
    title: str
    source_type: str
    status: KnowledgeDocumentStatus
    error_message: str | None
    chunk_count: int
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


class RAGAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    knowledge_base_ids: list[UUID] = Field(min_length=1, max_length=10)


class RAGCitationPublic(BaseModel):
    chunk_id: UUID
    document_id: UUID
    document_title: str
    chunk_index: int
    content: str
    score: float


class RAGAnswerPublic(BaseModel):
    answer: str
    citations: list[RAGCitationPublic]
