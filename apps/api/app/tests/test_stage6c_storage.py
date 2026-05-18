from io import BytesIO
from pathlib import Path

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.modules.files.storage import LocalFileStorage


@pytest.mark.asyncio
async def test_local_file_storage_writes_upload_and_checksum(tmp_path: Path) -> None:
    storage = LocalFileStorage(tmp_path)
    upload = UploadFile(
        filename="../Quarterly Report.txt",
        file=BytesIO(b"hello storage"),
        headers=Headers({"content-type": "text/plain"}),
    )

    stored = await storage.save(upload)

    assert stored.original_filename == "Quarterly Report.txt"
    assert stored.filename.endswith(".txt")
    assert stored.content_type == "text/plain"
    assert stored.size_bytes == 13
    assert stored.checksum == "ada7ad17eeff1826bdf1e69d6a70d542548a6f0a3c3809748a36076d97671047"
    assert (tmp_path / stored.storage_path).read_bytes() == b"hello storage"


def test_local_file_storage_resolves_only_inside_storage_root(tmp_path: Path) -> None:
    storage = LocalFileStorage(tmp_path)

    with pytest.raises(ValueError, match="Invalid storage path"):
        storage.resolve("../outside.txt")
