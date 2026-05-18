from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserManagementItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    full_name: str | None
    is_active: bool
    is_superuser: bool
    department_id: UUID | None
