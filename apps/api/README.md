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

The migrations create `system_info`, `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `departments`, audit log tables, dictionary tables, and file attachment metadata. Do not use `Base.metadata.create_all()` for production schema changes.

Create a local administrator after migrations:

```bash
FIRST_SUPERUSER_PASSWORD=change-this-password uv run python -m app.modules.auth.seed
```

The seed command also creates the default `admin` role, menu/action permissions, a default root department, and links the first superuser to that role and department.

## Endpoints

- `GET /api/v1/health` - API health status.
- `GET /api/v1/health/db` - PostgreSQL connectivity check.
- `POST /api/v1/auth/login` - OAuth2 password login, returns a JWT access token.
- `GET /api/v1/auth/me` - Current user profile and permission codes for a Bearer token.
- `GET /api/v1/users` - User list for administrators.
- `POST /api/v1/users` - Create a user.
- `PATCH /api/v1/users/{user_id}` - Update or enable/disable a user.
- `GET /api/v1/users/{user_id}/roles` - User role codes.
- `PUT /api/v1/users/{user_id}/roles` - Replace user role codes.
- `GET /api/v1/roles` - Role list for administrators.
- `GET /api/v1/roles/permissions` - Permission list.
- `GET /api/v1/roles/{role_id}/permissions` - Role permission codes.
- `PUT /api/v1/roles/{role_id}/permissions` - Replace role permission codes.
- `GET /api/v1/departments` - Department list for administrators.
- `GET /api/v1/departments/tree` - Department hierarchy tree.
- `POST /api/v1/departments` - Create a department.
- `PATCH /api/v1/departments/{department_id}` - Update a department.
- `DELETE /api/v1/departments/{department_id}` - Delete an unused department.
- `GET /api/v1/audit/operation-logs` - Operation logs.
- `GET /api/v1/audit/login-logs` - Login logs.
- `GET /api/v1/dictionaries/types` - Dictionary types.
- `POST /api/v1/dictionaries/types` - Create a dictionary type.
- `GET /api/v1/dictionaries/items` - Dictionary items.
- `POST /api/v1/dictionaries/items` - Create a dictionary item.
- `GET /api/v1/files` - File attachment metadata.
- `POST /api/v1/files` - Create file attachment metadata.
- `POST /api/v1/files/upload` - Upload file content and create attachment metadata.
- `GET /api/v1/files/{file_id}/download` - Download stored file content.

`GET /users`, `GET /departments`, and `GET /files` return paginated payloads and accept `q`, `page`, and `page_size` query parameters.
