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

## Database Migrations

Start PostgreSQL first:

```bash
docker compose up -d postgres redis
```

Run migrations from `apps/api`:

```bash
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic revision --autogenerate -m "describe change"
```

The first migration creates `system_info`. Do not use `Base.metadata.create_all()` for production schema changes.

## Endpoints

- `GET /api/v1/health` - API health status.
- `GET /api/v1/health/db` - PostgreSQL connectivity check.
