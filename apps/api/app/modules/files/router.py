from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.core.config import Settings, get_settings
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.files.models import FileAttachment
from app.modules.files.repository import get_file_attachment_by_id, list_file_attachments
from app.modules.files.schemas import FileAttachmentCreate, FileAttachmentPublic
from app.modules.files.storage import (
    FileStorage,
    get_file_storage,
    get_upload_scanner,
    validate_upload_policy,
)
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/files", tags=["files"])
CreateFileDependency = Depends(require_permission("action:files:create"))
ReadFileDependency = Depends(require_permission("action:files:read"))


def _build_file_storage(settings: Settings) -> FileStorage:
    try:
        return get_file_storage(
            backend=settings.file_storage_backend,
            local_root=settings.local_file_storage_dir,
            minio_endpoint=settings.minio_endpoint,
            minio_access_key=settings.minio_access_key,
            minio_secret_key=settings.minio_secret_key,
            minio_bucket=settings.minio_bucket,
            minio_secure=settings.minio_secure,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=ApiResponse[Page[FileAttachmentPublic]],
    dependencies=[ReadFileDependency],
)
async def get_file_attachments(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[FileAttachmentPublic]]:
    files, total = await list_file_attachments(
        session,
        q=q,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [FileAttachmentPublic.model_validate(file) for file in files]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@router.post(
    "",
    response_model=ApiResponse[FileAttachmentPublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_file_attachment(
    payload: FileAttachmentCreate,
    session: DatabaseSession,
    current_user: User = CreateFileDependency,
) -> ApiResponse[FileAttachmentPublic]:
    file_attachment = FileAttachment(
        **payload.model_dump(),
        uploaded_by_user_id=current_user.id,
    )
    session.add(file_attachment)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="file_attachment",
        resource_id=str(file_attachment.id),
    )
    await session.commit()
    await session.refresh(file_attachment)
    return ApiResponse(success=True, data=FileAttachmentPublic.model_validate(file_attachment))


@router.post(
    "/upload",
    response_model=ApiResponse[FileAttachmentPublic],
    status_code=status.HTTP_201_CREATED,
)
async def upload_file_attachment(
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
    upload: Annotated[UploadFile, File()],
    current_user: User = CreateFileDependency,
) -> ApiResponse[FileAttachmentPublic]:
    storage = _build_file_storage(settings)
    scanner = get_upload_scanner(
        enabled=settings.upload_scanner_enabled,
        backend=settings.upload_scanner_backend,
        clamav_host=settings.clamav_host,
        clamav_port=settings.clamav_port,
        clamav_timeout_seconds=settings.clamav_timeout_seconds,
    )

    stored = await validate_upload_policy(
        upload,
        storage=storage,
        scanner=scanner,
        max_size_bytes=settings.max_upload_size_bytes,
        allowed_content_types=settings.allowed_upload_content_types,
    )
    file_attachment = FileAttachment(
        **stored.model_dump(),
        uploaded_by_user_id=current_user.id,
    )
    session.add(file_attachment)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="upload",
        resource="file_attachment",
        resource_id=str(file_attachment.id),
    )
    await session.commit()
    await session.refresh(file_attachment)
    return ApiResponse(success=True, data=FileAttachmentPublic.model_validate(file_attachment))


@router.get(
    "/{file_id}/download",
    dependencies=[ReadFileDependency],
)
async def download_file_attachment(
    file_id: UUID,
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    file_attachment = await get_file_attachment_by_id(session, file_id)
    if file_attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    storage = _build_file_storage(settings)
    return await storage.download_response(
        storage_path=file_attachment.storage_path,
        filename=file_attachment.original_filename,
        content_type=file_attachment.content_type,
    )
