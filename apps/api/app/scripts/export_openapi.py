from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import cast

from app.main import create_app

DEFAULT_OUTPUT_PATH = (
    Path(__file__).resolve().parents[4] / "packages" / "api-client" / "openapi" / "openapi.json"
)


def _normalize_binary_schema(value: object) -> None:
    if isinstance(value, dict):
        schema = cast(dict[str, object], value)
        is_binary_string = (
            schema.get("type") == "string"
            and schema.get("contentMediaType") == "application/octet-stream"
        )
        if is_binary_string:
            schema["format"] = "binary"
            schema.pop("contentMediaType", None)

        for child in schema.values():
            _normalize_binary_schema(child)
        return

    if isinstance(value, list):
        for child in value:
            _normalize_binary_schema(child)


def export_openapi(output_path: Path = DEFAULT_OUTPUT_PATH) -> None:
    app = create_app()
    schema = app.openapi()
    _normalize_binary_schema(schema)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT_PATH
    export_openapi(output_path)


if __name__ == "__main__":
    main()
