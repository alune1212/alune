from __future__ import annotations

import json

from app.scripts.export_openapi import export_openapi


def test_export_openapi_normalizes_multipart_binary_schema(tmp_path) -> None:
    output_path = tmp_path / "openapi.json"

    export_openapi(output_path)

    schema = json.loads(output_path.read_text(encoding="utf-8"))
    upload_schema = schema["components"]["schemas"][
        "Body_upload_file_attachment_api_v1_files_upload_post"
    ]["properties"]["upload"]

    assert upload_schema["type"] == "string"
    assert upload_schema["format"] == "binary"
    assert "contentMediaType" not in upload_schema
