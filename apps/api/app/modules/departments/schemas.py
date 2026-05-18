from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DepartmentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    parent_id: UUID | None
    description: str | None
    sort_order: int
    is_active: bool


class DepartmentTreeNode(DepartmentPublic):
    children: list[DepartmentTreeNode] = Field(default_factory=list)


class DepartmentCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9:_-]+$")
    name: str = Field(min_length=1, max_length=100)
    parent_id: UUID | None = None
    description: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    code: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        pattern=r"^[A-Za-z0-9:_-]+$",
    )
    name: str | None = Field(default=None, min_length=1, max_length=100)
    parent_id: UUID | None = None
    description: str | None = Field(default=None, max_length=255)
    sort_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
