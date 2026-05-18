import asyncio
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.modules.files.schemas import StoredUpload


class LocalFileStorage:
    def __init__(self, root: str | Path) -> None:
        self.root = Path(root).resolve()

    async def save(self, upload: UploadFile, *, max_size_bytes: int = 0) -> StoredUpload:
        original_filename = Path(upload.filename or "upload.bin").name
        suffix = Path(original_filename).suffix
        now = datetime.now(UTC)
        relative_dir = Path(str(now.year), f"{now.month:02d}")
        filename = f"{uuid4().hex}{suffix}"
        relative_path = relative_dir / filename
        target_path = self.resolve(str(relative_path))
        target_path.parent.mkdir(parents=True, exist_ok=True)

        chunks: list[bytes] = []
        accumulated = 0
        while chunk := await upload.read(1024 * 1024):
            accumulated += len(chunk)
            if max_size_bytes and accumulated > max_size_bytes:
                target_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="File is too large",
                )
            chunks.append(chunk)

        def write_file() -> tuple[int, str]:
            digest = sha256()
            size_bytes = 0
            with target_path.open("wb") as target_file:
                for chunk in chunks:
                    size_bytes += len(chunk)
                    digest.update(chunk)
                    target_file.write(chunk)
            return size_bytes, digest.hexdigest()

        size_bytes, checksum = await asyncio.to_thread(write_file)

        return StoredUpload(
            filename=filename,
            original_filename=original_filename,
            content_type=upload.content_type,
            size_bytes=size_bytes,
            storage_path=relative_path.as_posix(),
            checksum=checksum,
        )

    def resolve(self, storage_path: str) -> Path:
        resolved_path = (self.root / storage_path).resolve()
        if resolved_path != self.root and self.root not in resolved_path.parents:
            msg = "Invalid storage path"
            raise ValueError(msg)
        return resolved_path


async def validate_upload_policy(
    upload: UploadFile,
    *,
    storage: LocalFileStorage,
    max_size_bytes: int,
    allowed_content_types: list[str],
) -> StoredUpload:
    content_type = upload.content_type or "application/octet-stream"
    if content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is not allowed",
        )

    return await storage.save(upload, max_size_bytes=max_size_bytes)
