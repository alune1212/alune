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


class DepartmentCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9:_-]+$")
    name: str = Field(min_length=1, max_length=100)
    parent_id: UUID | None = None
    description: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True
