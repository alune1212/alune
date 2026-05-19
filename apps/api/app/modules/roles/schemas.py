from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RolePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None
    is_system: bool


class RoleCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9:_-]+$")
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class RoleUpdate(BaseModel):
    code: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        pattern=r"^[A-Za-z0-9:_-]+$",
    )
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class PermissionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    type: str
    description: str | None


class RolePermissionPublic(BaseModel):
    role_id: UUID
    permission_codes: list[str]


class RolePermissionUpdate(BaseModel):
    permission_codes: list[str] = Field(default_factory=list, max_length=100)
