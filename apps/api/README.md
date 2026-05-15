# alune-platform API

FastAPI backend for the company admin platform MVP.

## Setup

```bash
uv sync
```

## Development

```bash
uv run fastapi dev app/main.py
```

The API docs are available at http://localhost:8000/docs.

## Checks

```bash
uv run pytest
uv run ruff check .
uv run ruff format . --check
uv run ty check
```

## Endpoints

- `GET /api/v1/health` - API health status.
- `GET /api/v1/health/db` - PostgreSQL connectivity check.
