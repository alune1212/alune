from fastapi import APIRouter, Depends, HTTPException, status

from app.common.response import ApiResponse
from app.modules.auth.dependencies import DatabaseSession
from app.modules.departments.models import Department
from app.modules.departments.repository import (
    get_department_by_code,
    get_department_by_id,
    list_departments,
)
from app.modules.departments.schemas import DepartmentCreate, DepartmentPublic
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get(
    "",
    response_model=ApiResponse[list[DepartmentPublic]],
    dependencies=[Depends(require_permission("action:departments:read"))],
)
async def get_departments(session: DatabaseSession) -> ApiResponse[list[DepartmentPublic]]:
    departments = await list_departments(session)
    data = [DepartmentPublic.model_validate(department) for department in departments]
    return ApiResponse(success=True, data=data)


@router.post(
    "",
    response_model=ApiResponse[DepartmentPublic],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("action:departments:create"))],
)
async def create_department(
    payload: DepartmentCreate,
    session: DatabaseSession,
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
    await session.commit()
    await session.refresh(department)

    return ApiResponse(success=True, data=DepartmentPublic.model_validate(department))
