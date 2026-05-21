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
- Stage 6G-Q internal system foundation with user create/enable/disable/batch-status confirmation and result feedback/edit/password reset, user role assignment, user role/department filters, role create/update/delete guards, searchable grouped role permission assignment with empty-state feedback, department tree/update/delete rules, audit log filtering/pagination/date range/CSV export, dictionary type/item maintenance guards, local and MinIO file upload/download, upload policy checks, file storage backend factory, ClamAV upload scanner adapter, frontend interaction tests, Orval API client generation from FastAPI OpenAPI, generated-client migration for frontend reads/writes, multipart binary type normalization, a narrowed root API client compatibility layer for runtime configuration, CSV export, file upload, and file download, Playwright smoke coverage for login and internal-system navigation, and GitHub Actions CI quality gates.

Do not add approval flows, reports, payroll, or company-specific business modules unless the user explicitly asks for that phase.

## Key Commands

```bash
pnpm install
pnpm --filter @alune/web exec playwright install chromium
cd apps/api && uv sync && cd ../..
pnpm docker:deps
pnpm dev
```

Quality gates:

```bash
UV_CACHE_DIR=.uv-cache pnpm lint
UV_CACHE_DIR=.uv-cache pnpm typecheck
UV_CACHE_DIR=.uv-cache pnpm test
UV_CACHE_DIR=.uv-cache pnpm api-client:generate
pnpm --filter @alune/api-client typecheck
pnpm --filter @alune/api-client test
pnpm --filter @alune/web e2e --list
pnpm exec prettier --check .github/workflows/ci.yml
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
E2E_BASE_URL=http://localhost:5173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
```

If ports 8000 or 5173 are already occupied:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

With that alternate Docker mapping, use `http://localhost:15173` for Web and `http://localhost:18000/docs` or `http://localhost:18000/api/v1/health` for API checks. The API root `/` is intentionally unrouted and returns `{"detail":"Not Found"}`.

## Architecture Facts

- Backend entry: `apps/api/app/main.py`.
- Backend routers are included under `/api/v1`.
- Implemented API routes:
  - `GET /api/v1/health`
  - `GET /api/v1/health/db`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/users`
  - `POST /api/v1/users`
  - `PATCH /api/v1/users/bulk-status`
  - `PATCH /api/v1/users/{user_id}`
  - `PATCH /api/v1/users/{user_id}/password`
  - `GET /api/v1/users/{user_id}/roles`
  - `PUT /api/v1/users/{user_id}/roles`
  - `GET /api/v1/roles`
  - `POST /api/v1/roles`
  - `GET /api/v1/roles/permissions`
  - `GET /api/v1/roles/{role_id}/permissions`
  - `PATCH /api/v1/roles/{role_id}`
  - `DELETE /api/v1/roles/{role_id}`
  - `PUT /api/v1/roles/{role_id}/permissions`
  - `GET /api/v1/departments`
  - `GET /api/v1/departments/tree`
  - `POST /api/v1/departments`
  - `PATCH /api/v1/departments/{department_id}`
  - `DELETE /api/v1/departments/{department_id}`
  - `GET /api/v1/audit/operation-logs`
  - `GET /api/v1/audit/operation-logs/export`
  - `GET /api/v1/audit/login-logs`
  - `GET /api/v1/audit/login-logs/export`
  - `GET /api/v1/dictionaries/types`
  - `POST /api/v1/dictionaries/types`
  - `PATCH /api/v1/dictionaries/types/{type_id}`
  - `DELETE /api/v1/dictionaries/types/{type_id}`
  - `GET /api/v1/dictionaries/items`
  - `POST /api/v1/dictionaries/items`
  - `PATCH /api/v1/dictionaries/items/{item_id}`
  - `DELETE /api/v1/dictionaries/items/{item_id}`
  - `GET /api/v1/files`
  - `POST /api/v1/files`
  - `POST /api/v1/files/upload`
  - `GET /api/v1/files/{file_id}/download`
- Backend settings live in `apps/api/app/core/config.py`.
- Async SQLAlchemy engine/session lives in `apps/api/app/db/session.py`.
- Alembic config lives in `apps/api/alembic.ini` and `apps/api/alembic/`.
- Current baseline table: `system_info`.
- Current auth table: `users`.
- Current permission tables: `roles`, `permissions`, `user_roles`, `role_permissions`.
- Current internal system tables: `departments`, `operation_logs`, `login_logs`, `dictionary_types`, `dictionary_items`, `file_attachments`.
- Local file storage defaults to `.local/uploads`; Docker app profile mounts `api_uploads` at `/app/uploads`.
- Upload policy is configured by `MAX_UPLOAD_SIZE_BYTES` and `ALLOWED_UPLOAD_CONTENT_TYPES`.
- File storage backend is configured by `FILE_STORAGE_BACKEND`; `local` and `minio` are implemented. MinIO uses `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, and `MINIO_SECURE`.
- `minio-init` is a one-shot Compose bucket initializer. `Exited (0)` is normal and the stopped container can be removed; it is recreated when the `minio-init` service is started again.
- Upload scanning is configured by `UPLOAD_SCANNER_ENABLED`; the default is no-op, and `UPLOAD_SCANNER_BACKEND=clamav` scans through clamd using `CLAMAV_HOST`, `CLAMAV_PORT`, and `CLAMAV_TIMEOUT_SECONDS`.
- Playwright package version is `1.60.0` in the current install; matching Chromium browser binaries are installed under `/Users/alune/Library/Caches/ms-playwright/chromium-1223` and `/Users/alune/Library/Caches/ms-playwright/chromium_headless_shell-1223`.
- If Chromium launch fails inside Codex with a macOS Mach port permission error, rerun browser checks outside the sandbox.
- Frontend entry: `apps/web/src/app/main.tsx`.
- TanStack Router setup: `apps/web/src/app/router.tsx` and `apps/web/src/routes/`.
- App shell: `apps/web/src/components/layout/`.
- Dashboard page: `apps/web/src/features/dashboard/dashboard-page.tsx`.
- Login page and auth provider: `apps/web/src/features/auth/`.
- Internal system pages: `apps/web/src/features/users/`, `apps/web/src/features/roles/`, `apps/web/src/features/departments/`, `apps/web/src/features/audit/`, `apps/web/src/features/dictionaries/`, `apps/web/src/features/files/`.
- Navigation config: `apps/web/src/config/navigation.ts`.
- Menu filtering: `apps/web/src/config/navigation.ts`.
- Compatibility API client: `packages/api-client/src/index.ts`; keep the TODO to migrate call sites to `@alune/api-client/generated`.
- Generated API client: `packages/api-client/src/generated/api.ts`, generated from `packages/api-client/openapi/openapi.json` by Orval.
- API client runtime config: `packages/api-client/src/runtime-config.ts`; web initializes it in `apps/web/src/app/main.tsx`.
- Generated client fetcher: `packages/api-client/src/orval-fetch.ts`.
- OpenAPI export script: `apps/api/app/scripts/export_openapi.py`.
- Shared constants: `packages/shared/src/index.ts`.

## Guardrails

- Keep stage 0-6G minimal. Avoid over-abstracting before real business modules exist.
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
