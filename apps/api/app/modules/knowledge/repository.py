from uuid import UUID

from sqlalchemy import delete, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.knowledge.models import (
    KnowledgeBase,
    KnowledgeBaseMember,
    KnowledgeChunk,
    KnowledgeDocument,
)


async def list_knowledge_bases(
    session: AsyncSession,
    *,
    current_user: User,
    q: str | None = None,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[KnowledgeBase], int]:
    statement = select(KnowledgeBase)
    count_statement = select(func.count()).select_from(KnowledgeBase)
    if q:
        pattern = f"%{q}%"
        filter_clause = or_(
            KnowledgeBase.name.ilike(pattern),
            KnowledgeBase.description.ilike(pattern),
        )
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)
    if is_active is not None:
        statement = statement.where(KnowledgeBase.is_active == is_active)
        count_statement = count_statement.where(KnowledgeBase.is_active == is_active)
    if not current_user.is_superuser:
        visibility_filter = exists().where(
            KnowledgeBaseMember.knowledge_base_id == KnowledgeBase.id,
            KnowledgeBaseMember.user_id == current_user.id,
        )
        statement = statement.where(visibility_filter)
        count_statement = count_statement.where(visibility_filter)
    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(KnowledgeBase.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def get_knowledge_base_by_id(
    session: AsyncSession,
    knowledge_base_id: UUID,
) -> KnowledgeBase | None:
    return await session.scalar(select(KnowledgeBase).where(KnowledgeBase.id == knowledge_base_id))


async def list_knowledge_documents(
    session: AsyncSession,
    *,
    knowledge_base_id: UUID,
    status: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[KnowledgeDocument], int]:
    statement = select(KnowledgeDocument).where(
        KnowledgeDocument.knowledge_base_id == knowledge_base_id
    )
    count_statement = (
        select(func.count())
        .select_from(KnowledgeDocument)
        .where(KnowledgeDocument.knowledge_base_id == knowledge_base_id)
    )
    if status:
        statement = statement.where(KnowledgeDocument.status == status)
        count_statement = count_statement.where(KnowledgeDocument.status == status)
    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(KnowledgeDocument.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def get_knowledge_document_by_id(
    session: AsyncSession,
    document_id: UUID,
) -> KnowledgeDocument | None:
    return await session.scalar(
        select(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
    )


async def list_knowledge_base_members(
    session: AsyncSession,
    *,
    knowledge_base_id: UUID,
) -> list[KnowledgeBaseMember]:
    result = await session.scalars(
        select(KnowledgeBaseMember)
        .where(KnowledgeBaseMember.knowledge_base_id == knowledge_base_id)
        .order_by(KnowledgeBaseMember.created_at)
    )
    return list(result.all())


async def replace_knowledge_base_members(
    session: AsyncSession,
    *,
    knowledge_base_id: UUID,
    members: list[KnowledgeBaseMember],
) -> list[KnowledgeBaseMember]:
    await session.execute(
        delete(KnowledgeBaseMember).where(
            KnowledgeBaseMember.knowledge_base_id == knowledge_base_id
        )
    )
    for member in members:
        session.add(member)
    await session.flush()
    return members


async def user_can_access_knowledge_base(
    session: AsyncSession,
    *,
    user: User,
    knowledge_base_id: UUID,
    roles: set[str],
) -> bool:
    if user.is_superuser:
        return True
    statement = select(KnowledgeBaseMember.id).where(
        KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
        KnowledgeBaseMember.user_id == user.id,
        KnowledgeBaseMember.role.in_(roles),
    )
    return await session.scalar(statement) is not None


async def list_accessible_knowledge_base_ids(
    session: AsyncSession,
    *,
    user: User,
    knowledge_base_ids: list[UUID],
    roles: set[str],
) -> set[UUID]:
    """Return the subset of *knowledge_base_ids* that *user* can access with the given *roles*."""
    if user.is_superuser:
        return set(knowledge_base_ids)
    statement = select(KnowledgeBaseMember.knowledge_base_id).where(
        KnowledgeBaseMember.knowledge_base_id.in_(knowledge_base_ids),
        KnowledgeBaseMember.user_id == user.id,
        KnowledgeBaseMember.role.in_(roles),
    )
    result = await session.scalars(statement)
    return set(result.all())


async def delete_document_chunks(session: AsyncSession, *, document_id: UUID) -> None:
    await session.execute(delete(KnowledgeChunk).where(KnowledgeChunk.document_id == document_id))
