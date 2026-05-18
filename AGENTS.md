# AGENTS.md

Project guidance for Codex and other AI agents working in this repository.

## Current Scope

`alune-platform` is a company internal admin platform MVP. The current codebase covers only:

- pnpm workspace + Turborepo monorepo wiring.
- FastAPI backend health endpoints.
- Vite React dashboard shell.
- PostgreSQL 18 and Redis 8 through Docker Compose.
- API/Web Docker images for a complete MVP stack.
- Alembic migration baseline with the `system_info` table.
- Login MVP with `users`, password hashing, JWT login, `/auth/me`, frontend login, and a protected dashboard.
- Permission baseline with roles, permissions, user-role links, role-permission links, backend permission dependency, and frontend menu filtering.
- Stage 6A internal system foundation with user list, role list, department list/create, and database foundations for audit logs, login logs, dictionaries, and file attachments.

Do not add approval flows, reports, payroll, or company-specific business modules unless the user explicitly asks for that phase.

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
pnpm db:upgrade
FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
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
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/users`
  - `GET /api/v1/roles`
  - `GET /api/v1/departments`
  - `POST /api/v1/departments`
- Backend settings live in `apps/api/app/core/config.py`.
- Async SQLAlchemy engine/session lives in `apps/api/app/db/session.py`.
- Alembic config lives in `apps/api/alembic.ini` and `apps/api/alembic/`.
- Current baseline table: `system_info`.
- Current auth table: `users`.
- Current permission tables: `roles`, `permissions`, `user_roles`, `role_permissions`.
- Current internal system tables: `departments`, `operation_logs`, `login_logs`, `dictionary_types`, `dictionary_items`, `file_attachments`.
- Frontend entry: `apps/web/src/app/main.tsx`.
- TanStack Router setup: `apps/web/src/app/router.tsx` and `apps/web/src/routes/`.
- App shell: `apps/web/src/components/layout/`.
- Dashboard page: `apps/web/src/features/dashboard/dashboard-page.tsx`.
- Login page and auth provider: `apps/web/src/features/auth/`.
- Internal system pages: `apps/web/src/features/users/`, `apps/web/src/features/roles/`, `apps/web/src/features/departments/`.
- Navigation config: `apps/web/src/config/navigation.ts`.
- Menu filtering: `apps/web/src/config/navigation.ts`.
- Temporary hand-written API client: `packages/api-client/src/index.ts`; keep the TODO to replace it with Orval-generated code later.
- Shared constants: `packages/shared/src/index.ts`.

## Guardrails

- Keep stage 0-6A minimal. Avoid over-abstracting before real business modules exist.
- Use TanStack Query for server state and Zustand only for UI state.
- Keep shadcn/ui-compatible primitives under `apps/web/src/components/ui/`.
- Keep backend modules under `apps/api/app/modules/<feature>/`.
- Use Alembic for schema changes; do not add production table creation through `create_all`.
- PostgreSQL 18 Docker volume must mount at `/var/lib/postgresql`, not `/var/lib/postgresql/data`.
- Use `ruff format`; do not add Black, isort, or flake8.

## Docs To Keep In Sync

- `README.md` for quick start.
- `docs/architecture.md` for structure and data flow.
- `docs/runbook.md` for local operations and troubleshooting.
- `docs/handoff.md` for current completion state and next phase.
- `CLAUDE.md` and this file for agent-facing project facts.
