# Handoff

## Completed

- Initialized pnpm workspace and Turborepo root scripts.
- Added Vite React 19 frontend with TypeScript, Tailwind CSS v4, shadcn/ui-style primitives, TanStack Router, TanStack Query, Zustand, Sonner, and a dashboard shell.
- Added FastAPI backend with pydantic-settings, CORS, SQLAlchemy async engine/session, health routes, Ruff, ty, and pytest.
- Added `packages/api-client` as a temporary hand-written health client with an Orval TODO.
- Added `packages/shared` for shared constants.
- Added Docker Compose for PostgreSQL 18, Redis 8, API, and Web.
- Added Dockerfiles for API and Web images.
- Added Nginx config for serving the frontend SPA.
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

Stage 3 should add Alembic:

- Add `apps/api/alembic.ini` and migration environment.
- Create the first base table, preferably `system_info`.
- Verify `uv run alembic upgrade head`.
- Document migration commands in `docs/runbook.md`.

Do not start login, RBAC, user management, or business modules before the migration baseline is in place.
