from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.files.models import FileAttachment


async def list_file_attachments(
    session: AsyncSession,
    *,
    q: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[FileAttachment], int]:
    statement = select(FileAttachment)
    count_statement = select(func.count()).select_from(FileAttachment)
    if q:
        pattern = f"%{q}%"
        statement = statement.where(FileAttachment.original_filename.ilike(pattern))
        count_statement = count_statement.where(FileAttachment.original_filename.ilike(pattern))

    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(FileAttachment.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def get_file_attachment_by_id(
    session: AsyncSession,
    file_id: UUID,
) -> FileAttachment | None:
    return await session.scalar(select(FileAttachment).where(FileAttachment.id == file_id))
