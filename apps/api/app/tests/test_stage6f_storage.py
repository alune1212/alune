from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.modules.files.storage import (
    LocalFileStorage,
    NoopUploadScanner,
    UploadScanResult,
    get_file_storage,
    get_upload_scanner,
    validate_upload_policy,
)


class RejectingScanner:
    async def scan(self, upload: UploadFile) -> UploadScanResult:
        return UploadScanResult(is_clean=False, message="Rejected by scanner")


def build_upload(*, filename: str, content_type: str, content: bytes) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


def test_get_file_storage_returns_local_storage(tmp_path: Path) -> None:
    storage = get_file_storage(backend="local", local_root=tmp_path)

    assert isinstance(storage, LocalFileStorage)


def test_get_file_storage_rejects_reserved_minio_backend(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="not implemented"):
        get_file_storage(backend="minio", local_root=tmp_path)


def test_get_upload_scanner_returns_noop_when_disabled() -> None:
    scanner = get_upload_scanner(enabled=False)

    assert isinstance(scanner, NoopUploadScanner)


def test_get_upload_scanner_rejects_enabled_scanner_until_implemented() -> None:
    with pytest.raises(ValueError, match="not implemented"):
        get_upload_scanner(enabled=True)


@pytest.mark.asyncio
async def test_noop_upload_scanner_allows_clean_upload() -> None:
    upload = build_upload(filename="safe.txt", content_type="text/plain", content=b"safe")

    result = await NoopUploadScanner().scan(upload)

    assert result.is_clean is True


@pytest.mark.asyncio
async def test_upload_policy_rejects_scanner_failure(tmp_path: Path) -> None:
    upload = build_upload(filename="unsafe.txt", content_type="text/plain", content=b"unsafe")

    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_policy(
            upload,
            storage=LocalFileStorage(tmp_path),
            scanner=RejectingScanner(),
            max_size_bytes=1024,
            allowed_content_types=["text/plain"],
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Rejected by scanner"
