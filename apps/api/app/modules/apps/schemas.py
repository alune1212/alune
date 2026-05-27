from datetime import datetime
from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

AppEntryType = Literal["internal", "external"]


def validate_entry_url(entry_type: AppEntryType, entry_url: str | None) -> None:
    if entry_url is None:
        return
    if entry_type == "internal" and not entry_url.startswith("/"):
        msg = "Internal app entry URL must start with /"
        raise ValueError(msg)
    if entry_type == "external" and not (
        entry_url.startswith("http://") or entry_url.startswith("https://")
    ):
        msg = "External app entry URL must start with http:// or https://"
        raise ValueError(msg)


class PlatformAppPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None
    category_code: str
    entry_type: AppEntryType
    entry_url: str
    icon: str | None
    sort_order: int
    is_active: bool
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


class PlatformAppCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    category_code: str = Field(min_length=1, max_length=100)
    entry_type: AppEntryType
    entry_url: str = Field(min_length=1, max_length=500)
    icon: str | None = Field(default=None, max_length=100)
    sort_order: int = 0
    is_active: bool = True

    @model_validator(mode="after")
    def validate_entry(self) -> Self:
        validate_entry_url(self.entry_type, self.entry_url)
        return self


class PlatformAppUpdate(BaseModel):
    code: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        pattern=r"^[A-Za-z0-9_.-]+$",
    )
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    category_code: str | None = Field(default=None, min_length=1, max_length=100)
    entry_type: AppEntryType | None = None
    entry_url: str | None = Field(default=None, min_length=1, max_length=500)
    icon: str | None = Field(default=None, max_length=100)
    sort_order: int | None = None
    is_active: bool | None = None


class PlatformAppStatusUpdate(BaseModel):
    is_active: bool
