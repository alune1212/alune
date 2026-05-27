from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.modules.files.storage import LocalFileStorage, UploadScanResult, validate_upload_policy


def build_upload(*, filename: str, content_type: str, content: bytes) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


@pytest.mark.asyncio
async def test_upload_policy_rejects_disallowed_content_type(tmp_path: Path) -> None:
    upload = build_upload(
        filename="script.sh",
        content_type="application/x-sh",
        content=b"echo unsafe",
    )

    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_policy(
            upload,
            storage=LocalFileStorage(tmp_path),
            max_size_bytes=1024,
            allowed_content_types=["text/plain"],
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "文件类型不允许"


@pytest.mark.asyncio
async def test_upload_policy_rejects_oversized_file(tmp_path: Path) -> None:
    upload = build_upload(
        filename="large.txt",
        content_type="text/plain",
        content=b"123456",
    )

    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_policy(
            upload,
            storage=LocalFileStorage(tmp_path),
            max_size_bytes=3,
            allowed_content_types=["text/plain"],
        )

    assert exc_info.value.status_code == 413
    assert exc_info.value.detail == "文件过大"


@pytest.mark.asyncio
async def test_upload_policy_rejects_oversized_file_before_scanner(tmp_path: Path) -> None:
    class RecordingScanner:
        called = False

        async def scan(self, upload: UploadFile) -> UploadScanResult:
            self.called = True
            return UploadScanResult(is_clean=True)

    scanner = RecordingScanner()
    upload = build_upload(
        filename="large.txt",
        content_type="text/plain",
        content=b"123456",
    )

    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_policy(
            upload,
            storage=LocalFileStorage(tmp_path),
            scanner=scanner,
            max_size_bytes=3,
            allowed_content_types=["text/plain"],
        )

    assert exc_info.value.status_code == 413
    assert scanner.called is False
