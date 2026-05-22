#!/usr/bin/env sh
set -eu

requirements_file="$(mktemp)"
trap 'rm -f "$requirements_file"' EXIT
export UV_TOOL_DIR="${UV_TOOL_DIR:-.uv-tools}"

uv export \
  --directory apps/api \
  --frozen \
  --format requirements.txt \
  --no-hashes \
  --output-file "$requirements_file" \
  >/dev/null

uvx pip-audit --requirement "$requirements_file" --no-deps --disable-pip --progress-spinner off
