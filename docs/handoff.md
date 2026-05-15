# Handoff

## Completed

- Initialized pnpm workspace and Turborepo root scripts.
- Added Vite React 19 frontend with TypeScript, Tailwind CSS v4, shadcn/ui-style primitives, TanStack Router, TanStack Query, Zustand, Sonner, and a dashboard shell.
- Added FastAPI backend with pydantic-settings, CORS, SQLAlchemy async engine/session, health routes, Ruff, ty, and pytest.
- Added `packages/api-client` as a temporary hand-written API client for health/auth/current-user permissions with an Orval TODO.
- Added `packages/shared` for shared constants.
- Added Docker Compose for PostgreSQL 18, Redis 8, API, and Web.
- Added Dockerfiles for API and Web images.
- Added Nginx config for serving the frontend SPA.
- Added Alembic migration environment and the first `system_info` table migration.
- Added login MVP with `users` migration, password hashing, JWT login, current-user API, frontend login page, and protected dashboard route.
- Added permission baseline with `roles`, `permissions`, `user_roles`, `role_permissions`, default permission seed data, backend `require_permission`, and frontend menu filtering from `/auth/me`.
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

Stage 6 should add the internal system foundation:

- User management.
- Role management.
- Department management.
- Operation logs.
- Login logs.
- Dictionary management.
- File attachment foundation.

Do not start approval flows, payroll, reports, or company-specific business modules before the internal system foundation is in place.
