from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    full_name: str | None
    is_active: bool
    is_superuser: bool
