import asyncio
import socket
import struct
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from typing import Protocol, cast, runtime_checkable
from urllib.parse import quote
from uuid import uuid4

from fastapi import HTTPException, Response, UploadFile, status
from starlette.responses import FileResponse, StreamingResponse

from app.modules.files.schemas import StoredUpload

_CHUNK_SIZE = 1024 * 1024


def _sanitize_filename(filename: str) -> str:
    """Remove newlines and other dangerous characters from filenames
    to prevent HTTP header injection.
    """
    sanitized = filename.replace("\r", "").replace("\n", "")
    return sanitized[:255]


@runtime_checkable
class FileStorage(Protocol):
    async def save(self, upload: UploadFile, *, max_size_bytes: int = 0) -> StoredUpload: ...

    async def download_response(
        self,
        *,
        storage_path: str,
        filename: str,
        content_type: str | None,
    ) -> Response: ...


class MinioClient(Protocol):
    def put_object(
        self,
        bucket_name: str,
        object_name: str,
        data: BytesIO,
        length: int,
        content_type: str = "application/octet-stream",
    ) -> object: ...

    def get_object(self, bucket_name: str, object_name: str) -> object: ...


@dataclass(frozen=True)
class UploadScanResult:
    is_clean: bool
    message: str | None = None


class UploadScanner(Protocol):
    async def scan(self, upload: UploadFile) -> UploadScanResult: ...


class ClamAvClient(Protocol):
    def scan_bytes(self, content: bytes) -> str: ...


class NoopUploadScanner:
    async def scan(self, upload: UploadFile) -> UploadScanResult:
        await upload.seek(0)
        return UploadScanResult(is_clean=True)


class ClamAvTcpClient:
    def __init__(self, *, host: str, port: int, timeout_seconds: float) -> None:
        self.host = host
        self.port = port
        self.timeout_seconds = timeout_seconds

    def scan_bytes(self, content: bytes) -> str:
        with socket.create_connection(
            (self.host, self.port),
            timeout=self.timeout_seconds,
        ) as connection:
            connection.sendall(b"zINSTREAM\0")
            for index in range(0, len(content), _CHUNK_SIZE):
                chunk = content[index : index + _CHUNK_SIZE]
                connection.sendall(struct.pack("!I", len(chunk)))
                connection.sendall(chunk)
            connection.sendall(struct.pack("!I", 0))
            return connection.recv(4096).decode("utf-8", errors="replace").strip()


class ClamAvUploadScanner:
    def __init__(self, *, client: ClamAvClient) -> None:
        self.client = client

    async def scan(self, upload: UploadFile) -> UploadScanResult:
        chunks: list[bytes] = []
        while chunk := await upload.read(_CHUNK_SIZE):
            chunks.append(chunk)
        content = b"".join(chunks)
        response = await asyncio.to_thread(self.client.scan_bytes, content)
        await upload.seek(0)
        if response.endswith("OK"):
            return UploadScanResult(is_clean=True)
        if response.endswith("FOUND"):
            message = response.removeprefix("stream: ").removesuffix("FOUND").strip()
            return UploadScanResult(is_clean=False, message=message)
        return UploadScanResult(is_clean=False, message=f"ClamAV scan failed: {response}")


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
        while chunk := await upload.read(_CHUNK_SIZE):
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

    async def download_response(
        self,
        *,
        storage_path: str,
        filename: str,
        content_type: str | None,
    ) -> Response:
        file_path = self.resolve(storage_path)
        if not await asyncio.to_thread(file_path.is_file):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File content not found",
            )
        safe_filename = _sanitize_filename(filename)
        return FileResponse(path=file_path, filename=safe_filename, media_type=content_type)

    def resolve(self, storage_path: str) -> Path:
        resolved_path = (self.root / storage_path).resolve()
        if resolved_path != self.root and self.root not in resolved_path.parents:
            msg = "Invalid storage path"
            raise ValueError(msg)
        return resolved_path


class MinioFileStorage:
    def __init__(self, *, bucket: str, client: MinioClient) -> None:
        self.bucket = bucket
        self.client = client

    async def save(self, upload: UploadFile, *, max_size_bytes: int = 0) -> StoredUpload:
        original_filename = Path(upload.filename or "upload.bin").name
        suffix = Path(original_filename).suffix
        now = datetime.now(UTC)
        object_dir = Path(str(now.year), f"{now.month:02d}")
        filename = f"{uuid4().hex}{suffix}"
        object_name = (object_dir / filename).as_posix()

        chunks: list[bytes] = []
        accumulated = 0
        digest = sha256()
        while chunk := await upload.read(_CHUNK_SIZE):
            accumulated += len(chunk)
            if max_size_bytes and accumulated > max_size_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="File is too large",
                )
            digest.update(chunk)
            chunks.append(chunk)

        content = b"".join(chunks)

        await asyncio.to_thread(
            self.client.put_object,
            self.bucket,
            object_name,
            BytesIO(content),
            len(content),
            upload.content_type or "application/octet-stream",
        )

        return StoredUpload(
            filename=filename,
            original_filename=original_filename,
            content_type=upload.content_type,
            size_bytes=len(content),
            storage_path=object_name,
            checksum=digest.hexdigest(),
        )

    async def download_response(
        self,
        *,
        storage_path: str,
        filename: str,
        content_type: str | None,
    ) -> Response:
        try:
            minio_response = await asyncio.to_thread(
                self.client.get_object,
                self.bucket,
                storage_path,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File content not found",
            ) from exc

        def iter_object() -> Iterator[bytes]:
            try:
                stream = getattr(minio_response, "stream", None)
                if not callable(stream):
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Invalid MinIO object response",
                    )
                yield from stream(_CHUNK_SIZE)
            finally:
                close = getattr(minio_response, "close", None)
                if callable(close):
                    close()
                release_conn = getattr(minio_response, "release_conn", None)
                if callable(release_conn):
                    release_conn()

        safe_filename = _sanitize_filename(filename)
        headers = {"Content-Disposition": f"attachment; filename*=UTF-8''{quote(safe_filename)}"}
        return StreamingResponse(iter_object(), media_type=content_type, headers=headers)


def create_minio_client(
    *,
    endpoint: str,
    access_key: str,
    secret_key: str,
    secure: bool,
) -> MinioClient:
    from minio import Minio

    return cast(
        MinioClient,
        Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
        ),
    )


def get_file_storage(
    *,
    backend: str,
    local_root: str | Path,
    minio_endpoint: str | None = None,
    minio_access_key: str | None = None,
    minio_secret_key: str | None = None,
    minio_bucket: str | None = None,
    minio_secure: bool = True,
) -> FileStorage:
    if backend == "local":
        return LocalFileStorage(local_root)
    if backend == "minio":
        missing_settings = [
            name
            for name, value in {
                "MINIO_ENDPOINT": minio_endpoint,
                "MINIO_ACCESS_KEY": minio_access_key,
                "MINIO_SECRET_KEY": minio_secret_key,
                "MINIO_BUCKET": minio_bucket,
            }.items()
            if not value
        ]
        if missing_settings:
            msg = f"Missing MinIO storage settings: {', '.join(missing_settings)}"
            raise ValueError(msg)
        assert minio_endpoint is not None
        assert minio_access_key is not None
        assert minio_secret_key is not None
        assert minio_bucket is not None
        client = create_minio_client(
            endpoint=minio_endpoint,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure,
        )
        return MinioFileStorage(bucket=minio_bucket, client=client)
    msg = f"Unsupported file storage backend: {backend}"
    raise ValueError(msg)


def get_upload_scanner(
    *,
    enabled: bool,
    backend: str = "noop",
    clamav_host: str = "localhost",
    clamav_port: int = 3310,
    clamav_timeout_seconds: float = 10.0,
) -> UploadScanner:
    if not enabled:
        return NoopUploadScanner()
    if backend == "clamav":
        return ClamAvUploadScanner(
            client=ClamAvTcpClient(
                host=clamav_host,
                port=clamav_port,
                timeout_seconds=clamav_timeout_seconds,
            )
        )
    msg = f"Unsupported upload scanner backend: {backend}"
    raise ValueError(msg)


async def validate_upload_policy(
    upload: UploadFile,
    *,
    storage: FileStorage,
    scanner: UploadScanner | None = None,
    max_size_bytes: int,
    allowed_content_types: list[str],
) -> StoredUpload:
    content_type = upload.content_type or "application/octet-stream"
    if content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is not allowed",
        )

    # Size check BEFORE scan: measure file size without streaming
    # content through memory. Starlette UploadFile.seek() only accepts
    # a single offset arg, so we use the underlying file descriptor.
    upload.file.seek(0, 2)
    file_size = upload.file.tell()
    upload.file.seek(0)
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File is too large",
        )

    scan_result = await (scanner or NoopUploadScanner()).scan(upload)
    if not scan_result.is_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=scan_result.message or "File did not pass security scan",
        )
    await upload.seek(0)

    return await storage.save(upload, max_size_bytes=max_size_bytes)
