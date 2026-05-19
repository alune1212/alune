from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DictionaryTypePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None
    is_system: bool


class DictionaryItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type_id: UUID
    label: str
    value: str
    sort_order: int
    is_active: bool


class DictionaryTypeCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9:_-]+$")
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    is_system: bool = False


class DictionaryTypeUpdate(BaseModel):
    code: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        pattern=r"^[A-Za-z0-9:_-]+$",
    )
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class DictionaryItemCreate(BaseModel):
    type_id: UUID
    label: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=100)
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True


class DictionaryItemUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=100)
    value: str | None = Field(default=None, min_length=1, max_length=100)
    sort_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
