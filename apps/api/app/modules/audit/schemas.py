from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OperationLogPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    actor_user_id: UUID | None
    action: str
    resource: str
    resource_id: str | None
    ip_address: str | None
    user_agent: str | None
    status: Literal["success", "failure", "error"]
    detail: str | None


class LoginLogPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    user_id: UUID | None
    ip_address: str | None
    user_agent: str | None
    status: Literal["success", "failure"]
    message: str | None
