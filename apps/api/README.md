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

The first migrations create `system_info`, `users`, `roles`, `permissions`, `user_roles`, and `role_permissions`. Do not use `Base.metadata.create_all()` for production schema changes.

Create a local administrator after migrations:

```bash
FIRST_SUPERUSER_PASSWORD=change-this-password uv run python -m app.modules.auth.seed
```

The seed command also creates the default `admin` role, menu/action permissions, and links the first superuser to that role.

## Endpoints

- `GET /api/v1/health` - API health status.
- `GET /api/v1/health/db` - PostgreSQL connectivity check.
- `POST /api/v1/auth/login` - OAuth2 password login, returns a JWT access token.
- `GET /api/v1/auth/me` - Current user profile and permission codes for a Bearer token.
