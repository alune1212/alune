from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.files.models import FileAttachment


async def list_file_attachments(session: AsyncSession) -> list[FileAttachment]:
    result = await session.scalars(
        select(FileAttachment).order_by(FileAttachment.created_at.desc())
    )
    return list(result.all())
