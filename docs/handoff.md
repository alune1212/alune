# Handoff

## Completed

- Initialized pnpm workspace and Turborepo root scripts.
- Added Vite React 19 frontend with TypeScript, Tailwind CSS v4, shadcn/ui-style primitives, TanStack Router, TanStack Query, Zustand, Sonner, and a dashboard shell.
- Added FastAPI backend with pydantic-settings, CORS, SQLAlchemy async engine/session, health routes, Ruff, ty, and pytest.
- Added `packages/api-client` as a temporary hand-written API client for health/auth/internal-system APIs with an Orval TODO.
- Added `packages/shared` for shared constants.
- Added Docker Compose for PostgreSQL 18, Redis 8, API, and Web.
- Added Dockerfiles for API and Web images.
- Added Nginx config for serving the frontend SPA.
- Added Alembic migration environment and the first `system_info` table migration.
- Added login MVP with `users` migration, password hashing, JWT login, current-user API, frontend login page, and protected dashboard route.
- Added permission baseline with `roles`, `permissions`, `user_roles`, `role_permissions`, default permission seed data, backend `require_permission`, and frontend menu filtering from `/auth/me`.
- Added stage 6A internal system foundation: user list API/page, role list API/page, department list/create API and page, plus database models for operation logs, login logs, dictionaries, and file attachments.
- Added stage 6B internal system depth: user create/enable/disable, role permission assignment, department update/delete rules, login/operation log reads and writes, dictionary type/item APIs/pages, and file metadata APIs/pages.
- Added stage 6C internal system hardening: local file binary upload/download, user role assignment API/page controls, department tree API/page view with recursive move guard, and search/pagination for users, departments, and file attachments.
- Added stage 6D internal system hardening: upload type/size policy, user edit/department assignment/password reset, dictionary item update/enable-disable/delete, and audit log pagination/search/status filters.
- Added stage 6E internal system hardening: user filtering by role/department, role create/update/delete with system and assignment guards, dictionary type update/delete guards, and audit log date-range filters plus CSV export.
- Added stage 6F internal system hardening: batch user enable/disable with audit logging, file storage backend factory with reserved MinIO path, upload scanner hook with safe default no-op behavior, and searchable grouped role permissions in the frontend.
- Added stage 6G-A frontend hardening: batch user enable/disable confirmation with result feedback, plus Vitest/Testing Library coverage for batch user status and role permission search/grouping.
- Added stage 6G-B storage hardening: MinIO storage adapter, storage-backed download responses, MinIO settings, optional Docker MinIO profile, and bucket initialization service.
- Added stage 6G-C upload scanning: ClamAV scanner adapter over clamd `INSTREAM`, scanner settings, optional Docker ClamAV profile, and unit coverage for clean/infected scan results.
- Verified Docker dependency services with PostgreSQL and Redis healthy.
- Verified `/api/v1/health/db` returns 200 when the API can reach Docker PostgreSQL.

## Verified Commands

```bash
docker compose config
docker compose --profile app config
docker compose up -d postgres redis
docker compose exec -T postgres pg_isready -U app -d company_admin
docker compose exec -T redis redis-cli ping
docker compose --profile app build api web
UV_CACHE_DIR=.uv-cache pnpm db:upgrade
FIRST_SUPERUSER_PASSWORD=change-this-password UV_CACHE_DIR=.uv-cache pnpm db:seed
UV_CACHE_DIR=.uv-cache pnpm lint
UV_CACHE_DIR=.uv-cache pnpm typecheck
UV_CACHE_DIR=.uv-cache pnpm test
pnpm build
UV_CACHE_DIR=.uv-cache uv run alembic check
pnpm --filter @alune/web typecheck
pnpm --filter @alune/web exec playwright install chromium
pnpm --filter @alune/web exec playwright install --list
```

## Current Services

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/api/v1/health
- DB health: http://localhost:8000/api/v1/health/db
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO API, when profile is enabled: http://localhost:9000
- MinIO console, when profile is enabled: http://localhost:9001
- ClamAV, when profile is enabled: localhost:3310

## Known Local Notes

- Full Docker app profile can be started with `docker compose --profile app up --build`.
- Local MinIO can be started with `docker compose --profile minio up -d minio minio-init`; use `FILE_STORAGE_BACKEND=minio` for API uploads against MinIO.
- Local ClamAV can be started with `docker compose --profile clamav up -d clamav`; use `UPLOAD_SCANNER_ENABLED=true` to scan uploads through ClamAV.
- Playwright Chromium for this project is installed for Playwright `1.60.0` under `/Users/alune/Library/Caches/ms-playwright/chromium-1223`.
- Codex sandbox may block Chromium launch with a macOS Mach port permission error; browser smoke tests should be run outside the sandbox when that happens.
- If local dev servers already occupy 8000 or 5173, use:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

## Recommended Next Phase

Stage 6G should continue hardening the internal system foundation:

- Expand frontend interaction tests for dictionary, department, audit, and file-management pages.

Do not start approval flows, payroll, reports, or company-specific business modules before the internal system foundation is in place.
