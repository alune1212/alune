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
