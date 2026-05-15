# AGENTS.md

Project guidance for Codex and other AI agents working in this repository.

## Current Scope

`alune-platform` is a company internal admin platform MVP. The current codebase covers only:

- pnpm workspace + Turborepo monorepo wiring.
- FastAPI backend health endpoints.
- Vite React dashboard shell.
- PostgreSQL 18 and Redis 8 through Docker Compose.
- API/Web Docker images for a complete MVP stack.

Do not add login, RBAC, user management, approval flows, reports, or business modules unless the user explicitly asks for the next phase.

## Key Commands

```bash
pnpm install
cd apps/api && uv sync && cd ../..
pnpm docker:deps
pnpm dev
```

Quality gates:

```bash
UV_CACHE_DIR=.uv-cache pnpm lint
UV_CACHE_DIR=.uv-cache pnpm typecheck
UV_CACHE_DIR=.uv-cache pnpm test
pnpm build
docker compose config
docker compose --profile app config
```

Docker:

```bash
pnpm docker:deps
pnpm docker:app
pnpm docker:logs
pnpm docker:down
```

If ports 8000 or 5173 are already occupied:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

## Architecture Facts

- Backend entry: `apps/api/app/main.py`.
- Backend routers are included under `/api/v1`.
- Implemented API routes:
  - `GET /api/v1/health`
  - `GET /api/v1/health/db`
- Backend settings live in `apps/api/app/core/config.py`.
- Async SQLAlchemy engine/session lives in `apps/api/app/db/session.py`.
- Frontend entry: `apps/web/src/app/main.tsx`.
- TanStack Router setup: `apps/web/src/app/router.tsx` and `apps/web/src/routes/`.
- App shell: `apps/web/src/components/layout/`.
- Dashboard page: `apps/web/src/features/dashboard/dashboard-page.tsx`.
- Navigation config: `apps/web/src/config/navigation.ts`.
- Temporary hand-written API client: `packages/api-client/src/index.ts`; keep the TODO to replace it with Orval-generated code later.
- Shared constants: `packages/shared/src/index.ts`.

## Guardrails

- Keep stage 0-2 minimal. Avoid over-abstracting before real business modules exist.
- Use TanStack Query for server state and Zustand only for UI state.
- Keep shadcn/ui-compatible primitives under `apps/web/src/components/ui/`.
- Keep backend modules under `apps/api/app/modules/<feature>/`.
- Use Alembic for future schema changes; do not add production table creation through `create_all`.
- PostgreSQL 18 Docker volume must mount at `/var/lib/postgresql`, not `/var/lib/postgresql/data`.
- Use `ruff format`; do not add Black, isort, or flake8.

## Docs To Keep In Sync

- `README.md` for quick start.
- `docs/architecture.md` for structure and data flow.
- `docs/runbook.md` for local operations and troubleshooting.
- `docs/handoff.md` for current completion state and next phase.
- `CLAUDE.md` and this file for agent-facing project facts.
