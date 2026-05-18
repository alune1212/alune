from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FileAttachmentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    original_filename: str
    content_type: str | None
    size_bytes: int
    storage_path: str
    checksum: str | None
    uploaded_by_user_id: UUID | None


class StoredUpload(BaseModel):
    filename: str
    original_filename: str
    content_type: str | None
    size_bytes: int
    storage_path: str
    checksum: str


class FileAttachmentCreate(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    original_filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = Field(default=None, max_length=100)
    size_bytes: int = Field(ge=0)
    storage_path: str = Field(min_length=1, max_length=500)
    checksum: str | None = Field(default=None, max_length=128)
