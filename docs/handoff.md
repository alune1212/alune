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
```

## Current Services

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/api/v1/health
- DB health: http://localhost:8000/api/v1/health/db
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Known Local Notes

- Full Docker app profile can be started with `docker compose --profile app up --build`.
- If local dev servers already occupy 8000 or 5173, use:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

## Recommended Next Phase

Stage 6F should continue hardening the internal system foundation:

- Add safer bulk status operations with explicit confirmation and audit records.
- Add MinIO/object storage adapter behind the existing file storage interface.
- Add antivirus scanning hooks once the upload lifecycle is stable.
- Improve role/permission UX for larger permission sets.

Do not start approval flows, payroll, reports, or company-specific business modules before the internal system foundation is in place.
