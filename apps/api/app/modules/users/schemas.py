from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserManagementItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    full_name: str | None
    is_active: bool
    is_superuser: bool
    department_id: UUID | None


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str = Field(min_length=3, max_length=255)
    full_name: str | None = Field(default=None, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    department_id: UUID | None = None
    is_active: bool = True
    is_superuser: bool = False


class UserUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=3, max_length=255)
    full_name: str | None = Field(default=None, max_length=100)
    department_id: UUID | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None


class UserRolePublic(BaseModel):
    user_id: UUID
    role_codes: list[str]


class UserRoleUpdate(BaseModel):
    role_codes: list[str] = Field(default_factory=list, max_length=100)


class UserPasswordUpdate(BaseModel):
    password: str = Field(min_length=8, max_length=128)
