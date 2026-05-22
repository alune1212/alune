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
pnpm --filter @alune/web exec playwright install chromium
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

Run the seed command again after permission registry changes. It is idempotent and syncs newly added permission codes such as `action:users:update_roles`, `action:dictionaries:update`, `action:roles:create`, `action:roles:update`, and `action:roles:delete`.

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

With the default mapping, open:

- Web: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- API health: `http://localhost:8000/api/v1/health`

With the alternate mapping above, open:

- Web: `http://localhost:15173`
- API docs: `http://localhost:18000/docs`
- API health: `http://localhost:18000/api/v1/health`

The API root path `/` is intentionally not routed. Opening `http://localhost:8000` or `http://localhost:18000` directly returns `{"detail":"Not Found"}`; use `/docs` or `/api/v1/health` for browser checks.

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
docker compose exec -T postgres psql -U app -d company_admin -c "select code from permissions where code = 'action:dictionaries:update';"
docker compose exec -T postgres psql -U app -d company_admin -c "select code from permissions where code in ('action:roles:create','action:roles:update','action:roles:delete') order by code;"
curl -s "http://localhost:8000/api/v1/audit/login-logs?started_at=2026-01-01T00:00:00&ended_at=2026-12-31T23:59:59" -H "Authorization: Bearer <token>"
curl -s "http://localhost:8000/api/v1/audit/login-logs/export" -H "Authorization: Bearer <token>" -o login-logs.csv
```

Expected DB health success:

```json
{
  "success": true,
  "data": { "status": "ok", "database": "postgresql" },
  "message": "OK",
  "error": null
}
```

## Quality Gates

```bash
UV_CACHE_DIR=.uv-cache pnpm lint
UV_CACHE_DIR=.uv-cache pnpm typecheck
UV_CACHE_DIR=.uv-cache pnpm test
pnpm build
UV_CACHE_DIR=.uv-cache pnpm api-client:generate
docker compose config
docker compose --profile app config
pnpm db:upgrade
FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
```

`UV_CACHE_DIR=.uv-cache` keeps uv cache writes inside the workspace when running from constrained agent environments.

## API Client Generation

Generate the frontend API client from FastAPI OpenAPI:

```bash
UV_CACHE_DIR=.uv-cache pnpm api-client:generate
pnpm --filter @alune/api-client typecheck
pnpm --filter @alune/api-client test
```

The generation command writes `packages/api-client/openapi/openapi.json` through `apps/api/app/scripts/export_openapi.py`, then Orval writes `packages/api-client/src/generated/api.ts`. The export script normalizes multipart binary fields to `format: binary` so generated upload bodies use `Blob`. Dashboard health, auth entry points, internal-system read queries, and user/role/department/dictionary JSON write actions already use generated hooks. The root compatibility client in `packages/api-client/src/index.ts` is now limited to runtime configuration, audit CSV export, file upload, file download, and the types needed by those binary/CSV boundaries.

Generated requests use `packages/api-client/src/orval-fetch.ts` and the runtime configuration in `packages/api-client/src/runtime-config.ts` so they follow the same API base URL behavior as the compatibility client. The web app initializes this from `VITE_API_BASE_URL`; normal JSON reads/writes should use `@alune/api-client/generated`. CSV export and file download helpers still return `Blob`, and file upload still exposes the current page-facing helper while delegating to the generated multipart request.

## Playwright Browser Setup

The frontend package includes `@playwright/test`. Install the matching browser binaries after `pnpm install`:

```bash
pnpm --filter @alune/web exec playwright install chromium
```

Check the installed browser list:

```bash
pnpm --filter @alune/web exec playwright --version
pnpm --filter @alune/web exec playwright install --list
```

On this Mac as of 2026-05-19, `alune-platform` uses Playwright `1.60.0` with:

```text
/Users/alune/Library/Caches/ms-playwright/chromium-1223
/Users/alune/Library/Caches/ms-playwright/chromium_headless_shell-1223
```

In constrained Codex sandbox sessions, launching Chromium may fail with a macOS Mach port permission error. Run Playwright browser checks outside the sandbox when that happens.

## Playwright Smoke Tests

The stage 6G-P smoke suite lives in `apps/web/e2e/admin-smoke.spec.ts` and covers:

- protected internal routes redirecting to `/login` when unauthenticated;
- successful login with a seeded administrator;
- navigation through Dashboard, Users, Roles, Departments, Audit, Dictionaries, and Files.

Prepare a dedicated local e2e administrator:

```bash
FIRST_SUPERUSER_USERNAME=e2e_admin FIRST_SUPERUSER_EMAIL=e2e_admin@example.com FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
```

Run against local dev servers:

```bash
E2E_BASE_URL=http://localhost:5173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
```

Run against the Docker app profile when Web/API are mapped to `15173/18000`:

```bash
E2E_BASE_URL=http://localhost:15173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
```

If you want Playwright to start the Vite dev server itself, keep the API running and use:

```bash
E2E_START_WEB_SERVER=true E2E_API_BASE_URL=http://localhost:8000 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
```

## GitHub Actions CI

The workflow lives at `.github/workflows/ci.yml`.

Default push/PR quality gate:

- installs pnpm, Node.js 24, Python 3.14, and uv;
- runs `pnpm install --frozen-lockfile` and `uv sync --frozen`;
- runs `pnpm api-client:generate`;
- fails if `packages/api-client/openapi/openapi.json` or `packages/api-client/src/generated/api.ts` changes after generation;
- runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`;
- validates `docker compose config` and `docker compose --profile app config`.

Manual Playwright smoke job:

1. Open the CI workflow in GitHub Actions.
2. Use **Run workflow**.
3. Enable `run_playwright_smoke`.
4. The job starts PostgreSQL/Redis, runs migrations, seeds `e2e_admin`, starts the API, and runs the web Playwright smoke suite.

## Dependabot

Dependabot configuration lives at `.github/dependabot.yml`.

It checks for dependency updates weekly on Monday morning in `Asia/Shanghai`:

- `npm` at `/` for the pnpm workspace.
- `uv` at `/apps/api` for Python dependencies.
- `docker` at `/infra/docker` for Dockerfile base images.
- `docker-compose` at `/` for Compose service images.
- `github-actions` at `/` for workflow actions.

Each ecosystem has a broad `groups` entry so routine version updates are batched by ecosystem instead of creating one pull request per dependency.

## Security Audit

Run the manual dependency audit baseline from the repository root:

```bash
pnpm security:audit
```

Run audits independently when triaging failures:

```bash
pnpm security:audit:npm
UV_CACHE_DIR=.uv-cache pnpm security:audit:python
```

The Python audit script exports the backend uv lockfile to a temporary requirements file before invoking `uvx pip-audit`. The security audit baseline is not part of the default GitHub Actions `quality` job yet.

## Feature Readiness Gate

Before starting a company-specific business module, read `docs/feature-readiness.md` and `docs/feature-module-checklist.md`. Stage 6G-U resolves the previous npm audit `lodash` finding with a pnpm override, and stage 6G-V defines the required scope, backend, migration, permission, audit, API client, frontend, test, documentation, and verification gates. Re-run npm and Python audits before the first business module PR.

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

The default upload policy is:

```text
MAX_UPLOAD_SIZE_BYTES=10485760
ALLOWED_UPLOAD_CONTENT_TYPES=application/pdf,image/jpeg,image/png,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

Oversized files return `413`. Disallowed content types return `400`.

Stage 6G-B supports both local storage and MinIO through the storage backend factory. Stage 6G-C adds ClamAV scanning behind the upload scanner factory:

```text
FILE_STORAGE_BACKEND=local
UPLOAD_SCANNER_ENABLED=false
UPLOAD_SCANNER_BACKEND=clamav
```

For local Docker testing with MinIO:

```bash
docker compose --profile minio up -d minio minio-init
FILE_STORAGE_BACKEND=minio docker compose --profile app --profile minio up --build
```

MinIO settings:

```text
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=alune-files
MINIO_SECURE=false
```

The `minio-init` service creates the configured bucket for local Docker runs.
It is a one-shot initialization container. After it exits with code `0`, it can be removed with `docker rm alune-platform-minio-init` without affecting the running `minio` service or the `minio_data` volume; Compose recreates it when the `minio-init` service is started again.

For local Docker testing with ClamAV:

```bash
docker compose --profile clamav up -d clamav
UPLOAD_SCANNER_ENABLED=true docker compose --profile app --profile clamav up --build
```

ClamAV settings:

```text
UPLOAD_SCANNER_BACKEND=clamav
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_SECONDS=10
```

When the API runs inside Docker, `CLAMAV_HOST` defaults to the Compose service name `clamav`. The scanner uses clamd's `INSTREAM` protocol and rejects infected files before storage.
