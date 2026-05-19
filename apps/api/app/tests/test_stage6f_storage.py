from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.modules.files.storage import (
    LocalFileStorage,
    MinioFileStorage,
    NoopUploadScanner,
    UploadScanResult,
    get_file_storage,
    get_upload_scanner,
    validate_upload_policy,
)


class RejectingScanner:
    async def scan(self, upload: UploadFile) -> UploadScanResult:
        return UploadScanResult(is_clean=False, message="Rejected by scanner")


class FakeMinioClient:
    def __init__(self) -> None:
        self.put_calls: list[dict[str, object]] = []

    def put_object(
        self,
        bucket_name: str,
        object_name: str,
        data: BytesIO,
        length: int,
        content_type: str = "application/octet-stream",
    ) -> None:
        self.put_calls.append(
            {
                "bucket_name": bucket_name,
                "object_name": object_name,
                "content": data.read(),
                "length": length,
                "content_type": content_type,
            }
        )

    def get_object(self, bucket_name: str, object_name: str) -> object:
        raise NotImplementedError


def build_upload(*, filename: str, content_type: str, content: bytes) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


def test_get_file_storage_returns_local_storage(tmp_path: Path) -> None:
    storage = get_file_storage(backend="local", local_root=tmp_path)

    assert isinstance(storage, LocalFileStorage)


def test_get_file_storage_returns_minio_storage(tmp_path: Path) -> None:
    storage = get_file_storage(
        backend="minio",
        local_root=tmp_path,
        minio_endpoint="localhost:9000",
        minio_access_key="minioadmin",
        minio_secret_key="minioadmin",
        minio_bucket="alune-files",
        minio_secure=False,
    )

    assert isinstance(storage, MinioFileStorage)


def test_get_file_storage_requires_minio_settings(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="MINIO_ENDPOINT"):
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


@pytest.mark.asyncio
async def test_minio_storage_uploads_object_and_returns_metadata() -> None:
    client = FakeMinioClient()
    upload = build_upload(filename="../report.pdf", content_type="application/pdf", content=b"pdf")

    stored = await MinioFileStorage(bucket="alune-files", client=client).save(
        upload,
        max_size_bytes=1024,
    )

    assert stored.original_filename == "report.pdf"
    assert stored.content_type == "application/pdf"
    assert stored.size_bytes == 3
    assert stored.checksum == "c35b21d6ca39aa7cc3b79a705d989f1a6e88b99ab43988d74048799e3db926a3"
    assert stored.storage_path.endswith(f"/{stored.filename}")
    assert client.put_calls == [
        {
            "bucket_name": "alune-files",
            "object_name": stored.storage_path,
            "content": b"pdf",
            "length": 3,
            "content_type": "application/pdf",
        }
    ]


@pytest.mark.asyncio
async def test_minio_storage_rejects_oversized_upload() -> None:
    client = FakeMinioClient()
    upload = build_upload(filename="large.txt", content_type="text/plain", content=b"large")

    with pytest.raises(HTTPException) as exc_info:
        await MinioFileStorage(bucket="alune-files", client=client).save(upload, max_size_bytes=4)

    assert exc_info.value.status_code == 413
    assert client.put_calls == []
