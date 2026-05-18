# Runbook

## Prerequisites

- Node.js 24+
- pnpm 10+
- Python 3.14 available through uv
- uv
- Docker with Docker Compose

## First-Time Setup

```bash
cp .env.example .env
pnpm install
cd apps/api
uv sync
cd ../..
```

## Start Dependency Services

```bash
docker compose up -d postgres redis
```

Equivalent root script:

```bash
pnpm docker:deps
```

Check status:

```bash
docker compose ps
docker compose exec -T postgres pg_isready -U app -d company_admin
docker compose exec -T redis redis-cli ping
```

## Run Database Migrations

```bash
pnpm db:upgrade
```

Equivalent backend command:

```bash
cd apps/api
uv run alembic upgrade head
```

Create future migrations with:

```bash
cd apps/api
uv run alembic revision --autogenerate -m "describe change"
```

Do not use `Base.metadata.create_all()` for production schema changes.

## Seed Local Administrator

```bash
FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
```

Equivalent backend command:

```bash
cd apps/api
FIRST_SUPERUSER_PASSWORD=change-this-password uv run python -m app.modules.auth.seed
```

The seed command is idempotent by username. It refuses the placeholder password `please-change-me`. It creates:

- the first superuser
- the default `admin` role
- default menu permissions
- default action permissions
- a default root department
- user/role and role/permission links

Run the seed command again after permission registry changes. It is idempotent and syncs newly added permission codes such as `action:users:update_roles`.

## Start Local Development Servers

Backend:

```bash
cd apps/api
uv run fastapi dev app/main.py
```

Frontend:

```bash
cd apps/web
pnpm dev
```

Root orchestration:

```bash
pnpm dev
```

## Start Full Docker MVP Stack

```bash
docker compose --profile app up --build
```

Equivalent root script:

```bash
pnpm docker:app
```

If host ports are busy:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

## Smoke Tests

```bash
curl -s http://localhost:8000/api/v1/health
curl -s http://localhost:8000/api/v1/health/db
curl -s http://localhost:8000/docs
docker compose exec -T postgres psql -U app -d company_admin -c "\\dt"
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=change-this-password"
docker compose exec -T postgres psql -U app -d company_admin -c "select code, type from permissions order by code;"
docker compose exec -T postgres psql -U app -d company_admin -c "select code, name from departments order by code;"
docker compose exec -T postgres psql -U app -d company_admin -c "select code from permissions where code in ('menu:audit','menu:dictionaries','menu:files') order by code;"
docker compose exec -T postgres psql -U app -d company_admin -c "select code from permissions where code = 'action:users:update_roles';"
```

Expected DB health success:

```json
{"success":true,"data":{"status":"ok","database":"postgresql"},"message":"OK","error":null}
```

## Quality Gates

```bash
UV_CACHE_DIR=.uv-cache pnpm lint
UV_CACHE_DIR=.uv-cache pnpm typecheck
UV_CACHE_DIR=.uv-cache pnpm test
pnpm build
docker compose config
docker compose --profile app config
pnpm db:upgrade
FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
```

`UV_CACHE_DIR=.uv-cache` keeps uv cache writes inside the workspace when running from constrained agent environments.

## Troubleshooting

### PostgreSQL 18 Restart Loop

PostgreSQL 18 official Docker images expect the volume mounted at `/var/lib/postgresql`. Do not mount project data at `/var/lib/postgresql/data`.

The current Compose service uses:

```yaml
volumes:
  - postgres_cluster_data:/var/lib/postgresql
```

### Port Conflicts

Use alternate host ports for the full app stack:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

### API Cannot Reach Database

Check dependency services:

```bash
docker compose ps
docker compose logs --tail=120 postgres
docker compose exec -T postgres pg_isready -U app -d company_admin
```

In local development, backend uses `.env` or defaults:

```text
DATABASE_URL=postgresql+asyncpg://app:app@localhost:5432/company_admin
```

In Docker app profile, API uses the Compose service hostname:

```text
postgresql+asyncpg://app:app@postgres:5432/company_admin
```

### Uploaded Files

Local development stores uploaded file content under:

```text
.local/uploads
```

The Docker app profile stores uploaded content in the `api_uploads` named volume mounted at:

```text
/app/uploads
```

Change `LOCAL_FILE_STORAGE_DIR` only to a path controlled by the API process. Download paths are resolved relative to this storage root.
