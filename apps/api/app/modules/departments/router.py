import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.departments.models import Department
from app.modules.departments.repository import (
    count_child_departments,
    count_users_by_department,
    get_department_by_code,
    get_department_by_id,
    has_descendant_department,
    list_all_departments,
    list_departments,
)
from app.modules.departments.schemas import (
    DepartmentCreate,
    DepartmentPublic,
    DepartmentTreeNode,
    DepartmentUpdate,
)
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/departments", tags=["departments"])
CreateDepartmentDependency = Depends(require_permission("action:departments:create"))
UpdateDepartmentDependency = Depends(require_permission("action:departments:update"))
DeleteDepartmentDependency = Depends(require_permission("action:departments:delete"))


@router.get(
    "",
    response_model=ApiResponse[Page[DepartmentPublic]],
    dependencies=[Depends(require_permission("action:departments:read"))],
)
async def get_departments(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[DepartmentPublic]]:
    departments, total = await list_departments(
        session,
        q=q,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [DepartmentPublic.model_validate(department) for department in departments]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@router.get(
    "/tree",
    response_model=ApiResponse[list[DepartmentTreeNode]],
    dependencies=[Depends(require_permission("action:departments:read"))],
)
async def get_department_tree(session: DatabaseSession) -> ApiResponse[list[DepartmentTreeNode]]:
    departments = await list_all_departments(session)
    nodes_by_id = {}
    for department in departments:
        public_department = DepartmentPublic.model_validate(department)
        nodes_by_id[department.id] = DepartmentTreeNode(
            **public_department.model_dump(),
            children=[],
        )
    roots: list[DepartmentTreeNode] = []
    for department in departments:
        node = nodes_by_id[department.id]
        parent_id = department.parent_id
        if parent_id is not None and parent_id in nodes_by_id:
            nodes_by_id[parent_id].children.append(node)
        else:
            roots.append(node)

    return ApiResponse(success=True, data=roots)


@router.post(
    "",
    response_model=ApiResponse[DepartmentPublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_department(
    payload: DepartmentCreate,
    session: DatabaseSession,
    current_user: User = CreateDepartmentDependency,
) -> ApiResponse[DepartmentPublic]:
    existing_department = await get_department_by_code(session, payload.code)
    if existing_department is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department code already exists",
        )

    if payload.parent_id is not None:
        parent_department = await get_department_by_id(session, payload.parent_id)
        if parent_department is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent department does not exist",
            )

    department = Department(**payload.model_dump())
    session.add(department)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="department",
        resource_id=str(department.id),
    )
    await session.commit()
    await session.refresh(department)

    return ApiResponse(success=True, data=DepartmentPublic.model_validate(department))


@router.patch(
    "/{department_id}",
    response_model=ApiResponse[DepartmentPublic],
)
async def update_department(
    department_id: UUID,
    payload: DepartmentUpdate,
    session: DatabaseSession,
    current_user: User = UpdateDepartmentDependency,
) -> ApiResponse[DepartmentPublic]:
    department = await get_department_by_id(session, department_id)
    if department is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"] is not None:
        existing_department = await get_department_by_code(session, update_data["code"])
        if existing_department is not None and existing_department.id != department.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department code already exists",
            )

    if "parent_id" in update_data and update_data["parent_id"] == department.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department cannot be its own parent",
        )

    if "parent_id" in update_data and update_data["parent_id"] is not None:
        parent_department = await get_department_by_id(session, update_data["parent_id"])
        if parent_department is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent department does not exist",
            )
        if await has_descendant_department(
            session,
            department_id=department.id,
            maybe_descendant_id=parent_department.id,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department cannot be moved under its descendant",
            )

    for field_name, value in update_data.items():
        setattr(department, field_name, value)

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="department",
        resource_id=str(department.id),
    )
    await session.commit()
    await session.refresh(department)
    return ApiResponse(success=True, data=DepartmentPublic.model_validate(department))


@router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_department(
    department_id: UUID,
    session: DatabaseSession,
    current_user: User = DeleteDepartmentDependency,
) -> None:
    department = await get_department_by_id(session, department_id)
    if department is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    child_count, assigned_user_count = await asyncio.gather(
        count_child_departments(session, department.id),
        count_users_by_department(session, department.id),
    )
    if child_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department has child departments",
        )
    if assigned_user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department has assigned users",
        )

    await session.delete(department)
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="delete",
        resource="department",
        resource_id=str(department.id),
    )
    await session.commit()
