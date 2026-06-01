from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.core.config import Settings, get_settings
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.files.models import FileAttachment
from app.modules.files.repository import get_file_attachment_by_id
from app.modules.files.storage import build_file_storage, get_upload_scanner, validate_upload_policy
from app.modules.knowledge.models import KnowledgeBase, KnowledgeBaseMember, KnowledgeDocument
from app.modules.knowledge.repository import (
    delete_document_chunks,
    get_knowledge_base_by_id,
    get_knowledge_document_by_id,
    list_accessible_knowledge_base_ids,
    list_knowledge_base_members,
    list_knowledge_bases,
    replace_knowledge_base_members,
    user_can_access_knowledge_base,
)
from app.modules.knowledge.repository import (
    list_knowledge_documents as list_documents_for_base,
)
from app.modules.knowledge.schemas import (
    KnowledgeBaseCreate,
    KnowledgeBaseMemberPublic,
    KnowledgeBaseMembersUpdate,
    KnowledgeBasePublic,
    KnowledgeBaseUpdate,
    KnowledgeDocumentPublic,
    RAGAnswerPublic,
    RAGAskRequest,
)
from app.modules.knowledge.service import answer_question, index_document_content
from app.modules.permissions.dependencies import require_permission

knowledge_bases_router = APIRouter(prefix="/knowledge-bases", tags=["knowledge"])
knowledge_documents_router = APIRouter(prefix="/knowledge-documents", tags=["knowledge"])
rag_router = APIRouter(prefix="/rag", tags=["rag"])

ReadKnowledgeBaseDependency = Depends(require_permission("action:knowledge_bases:read"))
CreateKnowledgeBaseDependency = Depends(require_permission("action:knowledge_bases:create"))
UpdateKnowledgeBaseDependency = Depends(require_permission("action:knowledge_bases:update"))
DeleteKnowledgeBaseDependency = Depends(require_permission("action:knowledge_bases:delete"))
ReadDocumentDependency = Depends(require_permission("action:knowledge_documents:read"))
UploadDocumentDependency = Depends(require_permission("action:knowledge_documents:upload"))
IndexDocumentDependency = Depends(require_permission("action:knowledge_documents:index"))
DeleteDocumentDependency = Depends(require_permission("action:knowledge_documents:delete"))
AskRAGDependency = Depends(require_permission("action:rag:ask"))

READ_ROLES = {"owner", "editor", "viewer"}
EDIT_ROLES = {"owner", "editor"}
OWNER_ROLES = {"owner"}


async def _ensure_knowledge_base_access(
    session: DatabaseSession,
    *,
    knowledge_base_id: UUID,
    current_user: User,
    roles: set[str],
) -> KnowledgeBase:
    knowledge_base = await get_knowledge_base_by_id(session, knowledge_base_id)
    if knowledge_base is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="知识库不存在")
    allowed = await user_can_access_knowledge_base(
        session,
        user=current_user,
        knowledge_base_id=knowledge_base_id,
        roles=roles,
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问该知识库")
    return knowledge_base


async def _ensure_document_access(
    session: DatabaseSession,
    *,
    document_id: UUID,
    current_user: User,
    roles: set[str],
) -> KnowledgeDocument:
    """Fetch document by ID, raise 404 if missing, then check knowledge-base access."""
    document = await get_knowledge_document_by_id(session, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在")
    await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=document.knowledge_base_id,
        current_user=current_user,
        roles=roles,
    )
    return document


@knowledge_bases_router.get(
    "",
    response_model=ApiResponse[Page[KnowledgeBasePublic]],
)
async def get_knowledge_bases(
    session: DatabaseSession,
    current_user: User = ReadKnowledgeBaseDependency,
    q: str | None = Query(default=None, max_length=100),
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[KnowledgeBasePublic]]:
    bases, total = await list_knowledge_bases(
        session,
        current_user=current_user,
        q=q,
        is_active=is_active,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [KnowledgeBasePublic.model_validate(item) for item in bases]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@knowledge_bases_router.post(
    "",
    response_model=ApiResponse[KnowledgeBasePublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_knowledge_base(
    payload: KnowledgeBaseCreate,
    session: DatabaseSession,
    current_user: User = CreateKnowledgeBaseDependency,
) -> ApiResponse[KnowledgeBasePublic]:
    knowledge_base = KnowledgeBase(
        **payload.model_dump(),
        is_active=True,
        created_by_id=current_user.id,
    )
    session.add(knowledge_base)
    await session.flush()
    session.add(
        KnowledgeBaseMember(
            knowledge_base_id=knowledge_base.id,
            user_id=current_user.id,
            role="owner",
        )
    )
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="knowledge_base",
        resource_id=str(knowledge_base.id),
    )
    await session.commit()
    await session.refresh(knowledge_base)
    return ApiResponse(success=True, data=KnowledgeBasePublic.model_validate(knowledge_base))


@knowledge_bases_router.get(
    "/{knowledge_base_id}",
    response_model=ApiResponse[KnowledgeBasePublic],
)
async def get_knowledge_base(
    knowledge_base_id: UUID,
    session: DatabaseSession,
    current_user: User = ReadKnowledgeBaseDependency,
) -> ApiResponse[KnowledgeBasePublic]:
    knowledge_base = await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=READ_ROLES,
    )
    return ApiResponse(success=True, data=KnowledgeBasePublic.model_validate(knowledge_base))


@knowledge_bases_router.patch(
    "/{knowledge_base_id}",
    response_model=ApiResponse[KnowledgeBasePublic],
)
async def update_knowledge_base(
    knowledge_base_id: UUID,
    payload: KnowledgeBaseUpdate,
    session: DatabaseSession,
    current_user: User = UpdateKnowledgeBaseDependency,
) -> ApiResponse[KnowledgeBasePublic]:
    knowledge_base = await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=EDIT_ROLES,
    )
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(knowledge_base, field_name, value)
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="knowledge_base",
        resource_id=str(knowledge_base.id),
    )
    await session.commit()
    await session.refresh(knowledge_base)
    return ApiResponse(success=True, data=KnowledgeBasePublic.model_validate(knowledge_base))


@knowledge_bases_router.delete(
    "/{knowledge_base_id}",
    response_model=ApiResponse[KnowledgeBasePublic],
)
async def delete_knowledge_base(
    knowledge_base_id: UUID,
    session: DatabaseSession,
    current_user: User = DeleteKnowledgeBaseDependency,
) -> ApiResponse[KnowledgeBasePublic]:
    knowledge_base = await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=OWNER_ROLES,
    )
    knowledge_base.is_active = False
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="delete",
        resource="knowledge_base",
        resource_id=str(knowledge_base.id),
    )
    await session.commit()
    await session.refresh(knowledge_base)
    return ApiResponse(success=True, data=KnowledgeBasePublic.model_validate(knowledge_base))


@knowledge_bases_router.get(
    "/{knowledge_base_id}/members",
    response_model=ApiResponse[list[KnowledgeBaseMemberPublic]],
)
async def get_knowledge_base_members(
    knowledge_base_id: UUID,
    session: DatabaseSession,
    current_user: User = ReadKnowledgeBaseDependency,
) -> ApiResponse[list[KnowledgeBaseMemberPublic]]:
    await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=OWNER_ROLES,
    )
    members = await list_knowledge_base_members(session, knowledge_base_id=knowledge_base_id)
    return ApiResponse(
        success=True,
        data=[KnowledgeBaseMemberPublic.model_validate(member) for member in members],
    )


@knowledge_bases_router.put(
    "/{knowledge_base_id}/members",
    response_model=ApiResponse[list[KnowledgeBaseMemberPublic]],
)
async def update_knowledge_base_members(
    knowledge_base_id: UUID,
    payload: KnowledgeBaseMembersUpdate,
    session: DatabaseSession,
    current_user: User = UpdateKnowledgeBaseDependency,
) -> ApiResponse[list[KnowledgeBaseMemberPublic]]:
    await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=OWNER_ROLES,
    )
    members = [
        KnowledgeBaseMember(
            knowledge_base_id=knowledge_base_id,
            user_id=member.user_id,
            role=member.role,
        )
        for member in payload.members
    ]
    saved_members = await replace_knowledge_base_members(
        session,
        knowledge_base_id=knowledge_base_id,
        members=members,
    )
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update_members",
        resource="knowledge_base",
        resource_id=str(knowledge_base_id),
        detail=f"members={len(saved_members)}",
    )
    await session.commit()
    return ApiResponse(
        success=True,
        data=[KnowledgeBaseMemberPublic.model_validate(member) for member in saved_members],
    )


@knowledge_bases_router.get(
    "/{knowledge_base_id}/documents",
    response_model=ApiResponse[Page[KnowledgeDocumentPublic]],
)
async def list_knowledge_documents(
    knowledge_base_id: UUID,
    session: DatabaseSession,
    current_user: User = ReadDocumentDependency,
    status: str | None = Query(default=None, max_length=30),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[KnowledgeDocumentPublic]]:
    await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=READ_ROLES,
    )
    documents, total = await list_documents_for_base(
        session,
        knowledge_base_id=knowledge_base_id,
        status=status,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [KnowledgeDocumentPublic.model_validate(document) for document in documents]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@knowledge_bases_router.post(
    "/{knowledge_base_id}/documents/upload",
    response_model=ApiResponse[KnowledgeDocumentPublic],
    status_code=status.HTTP_201_CREATED,
)
async def upload_knowledge_document(
    knowledge_base_id: UUID,
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
    upload: Annotated[UploadFile, File()],
    current_user: User = UploadDocumentDependency,
) -> ApiResponse[KnowledgeDocumentPublic]:
    await _ensure_knowledge_base_access(
        session,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        roles=EDIT_ROLES,
    )
    content = await upload.read()
    await upload.seek(0)
    storage = build_file_storage(settings)
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
    document = KnowledgeDocument(
        knowledge_base_id=knowledge_base_id,
        file_attachment_id=file_attachment.id,
        title=stored.original_filename,
        source_type="upload",
        status="uploaded",
        created_by_id=current_user.id,
    )
    session.add(document)
    await session.flush()
    await index_document_content(
        session,
        document=document,
        content=content,
        filename=stored.original_filename,
        content_type=stored.content_type,
        settings=settings,
    )
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="upload",
        resource="knowledge_document",
        resource_id=str(document.id),
    )
    await session.commit()
    await session.refresh(document)
    return ApiResponse(success=True, data=KnowledgeDocumentPublic.model_validate(document))


@knowledge_documents_router.get(
    "/{document_id}",
    response_model=ApiResponse[KnowledgeDocumentPublic],
)
async def get_knowledge_document(
    document_id: UUID,
    session: DatabaseSession,
    current_user: User = ReadDocumentDependency,
) -> ApiResponse[KnowledgeDocumentPublic]:
    document = await _ensure_document_access(
        session,
        document_id=document_id,
        current_user=current_user,
        roles=READ_ROLES,
    )
    return ApiResponse(success=True, data=KnowledgeDocumentPublic.model_validate(document))


@knowledge_documents_router.post(
    "/{document_id}/index",
    response_model=ApiResponse[KnowledgeDocumentPublic],
)
async def index_knowledge_document(
    document_id: UUID,
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: User = IndexDocumentDependency,
) -> ApiResponse[KnowledgeDocumentPublic]:
    document = await _ensure_document_access(
        session,
        document_id=document_id,
        current_user=current_user,
        roles=EDIT_ROLES,
    )
    file_attachment = await get_file_attachment_by_id(session, document.file_attachment_id)
    if file_attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文件不存在")
    storage = build_file_storage(settings)
    content = await storage.read_bytes(storage_path=file_attachment.storage_path)
    await index_document_content(
        session,
        document=document,
        content=content,
        filename=file_attachment.original_filename,
        content_type=file_attachment.content_type,
        settings=settings,
    )
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="index",
        resource="knowledge_document",
        resource_id=str(document.id),
    )
    await session.commit()
    await session.refresh(document)
    return ApiResponse(success=True, data=KnowledgeDocumentPublic.model_validate(document))


@knowledge_documents_router.delete(
    "/{document_id}",
    response_model=ApiResponse[KnowledgeDocumentPublic],
)
async def delete_knowledge_document(
    document_id: UUID,
    session: DatabaseSession,
    current_user: User = DeleteDocumentDependency,
) -> ApiResponse[KnowledgeDocumentPublic]:
    document = await _ensure_document_access(
        session,
        document_id=document_id,
        current_user=current_user,
        roles=EDIT_ROLES,
    )
    await delete_document_chunks(session, document_id=document.id)
    document.status = "failed"
    document.error_message = "已删除"
    document.chunk_count = 0
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="delete",
        resource="knowledge_document",
        resource_id=str(document.id),
    )
    await session.commit()
    await session.refresh(document)
    return ApiResponse(success=True, data=KnowledgeDocumentPublic.model_validate(document))


@rag_router.post(
    "/ask",
    response_model=ApiResponse[RAGAnswerPublic],
)
async def ask_rag(
    payload: RAGAskRequest,
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: User = AskRAGDependency,
) -> ApiResponse[RAGAnswerPublic]:
    accessible = await list_accessible_knowledge_base_ids(
        session,
        user=current_user,
        knowledge_base_ids=payload.knowledge_base_ids,
        roles=READ_ROLES,
    )
    if accessible != set(payload.knowledge_base_ids):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问该知识库")
    action = "ask_failed"
    try:
        answer = await answer_question(
            session,
            question=payload.question,
            knowledge_base_ids=payload.knowledge_base_ids,
            settings=settings,
        )
        action = "ask"
    finally:
        await record_operation_log(
            session,
            actor_user_id=current_user.id,
            action=action,
            resource="rag",
            resource_id=None,
            detail=f"knowledge_bases={len(payload.knowledge_base_ids)}",
        )
        await session.commit()
    return ApiResponse(success=True, data=RAGAnswerPublic.model_validate(answer))
