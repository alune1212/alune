# Handoff

## Completed

- Initialized pnpm workspace and Turborepo root scripts.
- Added Vite React 19 frontend with TypeScript, Tailwind CSS v4, shadcn/ui-style primitives, TanStack Router, TanStack Query, Zustand, Sonner, and a dashboard shell.
- Added FastAPI backend with pydantic-settings, CORS, SQLAlchemy async engine/session, health routes, Ruff, ty, and pytest.
- Added `packages/api-client` with the current compatibility client plus Orval-generated API client output.
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
- Added stage 6G-D frontend test hardening: Vitest/Testing Library coverage for dictionary type creation, department tree/create flow, audit export filters, and file upload.
- Added stage 6G-E API client generation: FastAPI OpenAPI export script, local OpenAPI schema artifact, Orval fetch/react-query generation, generated client export path, and api-client package typecheck.
- Added stage 6G-F generated client migration: runtime API client configuration initialized from the web app, custom Orval fetcher with API base URL handling, api-client Vitest coverage for generated requests, and `fetchHealthStatus` delegation to the generated health request.
- Added stage 6G-G auth generated client migration: `loginWithPassword` and `fetchCurrentUser` now delegate to Orval-generated auth requests while keeping the compatibility API stable.
- Added stage 6G-H read-list generated client migration: `fetchUsers`, `fetchRoles`, and `fetchDepartments` now delegate to Orval-generated requests with token and filter mapping covered by api-client tests.
- Added stage 6G-I remaining read-only generated client migration: department tree, audit log lists, dictionary lists, and file attachment list now delegate to Orval-generated requests; login failure logs now use the OpenAPI/model status value `failure`.
- Added stage 6G-J JSON write generated client migration: user, role, department, dictionary, file metadata, and role/user permission compatibility functions now delegate to Orval-generated requests while keeping the frontend-facing API stable.
- Added stage 6G-K binary/multipart migration boundary: file upload now delegates to the generated multipart request; CSV export and file download keep `Blob` compatibility while reusing generated URL helpers.
- Added stage 6G-L generated hook migration: OpenAPI export normalizes multipart binary fields so Orval emits `Blob` upload bodies, and dashboard health/auth frontend entry points now use generated React Query hooks directly.
- Added stage 6G-M internal-system read hook migration: users, roles, departments, dictionaries, audit logs, and file attachment pages now use Orval-generated React Query hooks for read queries while keeping write actions on the compatibility layer.
- Added stage 6G-N internal-system JSON write hook migration: user, role, department, and dictionary page mutations now use Orval-generated mutation hooks; binary upload/download and CSV export remain on the compatibility layer.
- Added stage 6G-O API client compatibility shrink: removed migrated JSON helper exports from `packages/api-client`, leaving runtime configuration, audit CSV export, file upload, file download, and boundary types.
- Added stage 6G-P Playwright smoke tests: web e2e config, root/web e2e scripts, and browser coverage for protected-route redirect, seeded-admin login, and internal-system navigation.
- Added stage 6G-Q GitHub Actions CI: default quality gate for API client generation drift, lint, typecheck, tests, build, and Docker Compose config, plus a manual Playwright smoke job.
- Added stage 6G-R Dependabot dependency visibility: weekly grouped update checks for npm/pnpm, uv, Dockerfiles, Docker Compose, and GitHub Actions.
- Added stage 6G-S lightweight security audit baseline: root npm/Python audit scripts, Python pip-audit wrapper, and `docs/security.md`.
- Added stage 6G-T feature development readiness check: `docs/feature-readiness.md` now records the pre-feature decision, readiness checklist, blockers, and entry criteria.
- Added stage 6G-U security audit remediation: pnpm override pins transitive `lodash` to `4.18.1`, clearing the npm audit finding from the Orval development dependency chain.
- Added stage 6G-V feature module checklist: `docs/feature-module-checklist.md` now defines scope, backend, migration, permission, audit, API client, frontend, test, documentation, and verification gates for the first business module.
- Added stage 6G-W security and deployment hardening: `ENVIRONMENT` setting rejects default JWT, PostgreSQL, and MinIO credentials in production and enforces minimum JWT key length; non-superusers without `action:users:manage_superuser` cannot create or modify superuser accounts; users cannot disable their own accounts or change their own superuser status; system role permission modification requires `manage_superuser`; fixed department delete concurrent query (asyncio.gather replaced with sequential await); fixed empty role permission list SQL insert error; frontend auto-clears localStorage token on 401 from `/auth/me`, redirects protected routes to `/login?expired=true`, and shows a session-expired notice on login page; attached `RequirePermission` to internal system routes; Docker Web proxies same-origin `/api/` to the API container; file upload size checked before scanner to prevent large-file buffering; download filenames sanitized to prevent HTTP header injection.
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
UV_CACHE_DIR=.uv-cache pnpm api-client:generate
pnpm --filter @alune/api-client typecheck
pnpm --filter @alune/api-client test
UV_CACHE_DIR=.uv-cache uv run alembic check
pnpm --filter @alune/web typecheck
pnpm --filter @alune/web exec playwright install chromium
pnpm --filter @alune/web exec playwright install --list
pnpm --filter @alune/web e2e --list
E2E_BASE_URL=http://localhost:15173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
pnpm exec prettier --check .github/workflows/ci.yml
pnpm exec prettier --check .github/dependabot.yml
pnpm security:audit:npm
UV_CACHE_DIR=.uv-cache pnpm security:audit:python
rg -n "TODO|FIXME|create_all|print\\(" apps packages scripts --glob '!packages/api-client/src/generated/api.ts' --glob '!packages/api-client/openapi/openapi.json' --glob '!apps/api/uv.lock'
```

## Current Services

- Default frontend: http://localhost:5173
- Default API docs: http://localhost:8000/docs
- Default API health: http://localhost:8000/api/v1/health
- Default DB health: http://localhost:8000/api/v1/health/db
- Alternate Docker app profile frontend: http://localhost:15173
- Alternate Docker app profile API docs: http://localhost:18000/docs
- Alternate Docker app profile API health: http://localhost:18000/api/v1/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO API, when profile is enabled: http://localhost:9000
- MinIO console, when profile is enabled: http://localhost:9001
- ClamAV, when profile is enabled: localhost:3310

## Known Local Notes

- Full Docker app profile can be started with `docker compose --profile app up --build`.
- Local MinIO can be started with `docker compose --profile minio up -d minio minio-init`; use `FILE_STORAGE_BACKEND=minio` for API uploads against MinIO.
- `minio-init` is a one-shot bucket initializer. `Exited (0)` is expected and the container can be removed after completion; Compose recreates it on the next `minio-init` run.
- Local ClamAV can be started with `docker compose --profile clamav up -d clamav`; use `UPLOAD_SCANNER_ENABLED=true` to scan uploads through ClamAV.
- The API root `/` intentionally returns `{"detail":"Not Found"}`. Use `/docs`, `/api/v1/health`, or `/api/v1/health/db` for browser/API checks.
- Playwright Chromium for this project is installed for Playwright `1.60.0` under `/Users/alune/Library/Caches/ms-playwright/chromium-1223`.
- Codex sandbox may block Chromium launch with a macOS Mach port permission error; browser smoke tests should be run outside the sandbox when that happens.
- The Playwright smoke suite expects a seeded administrator. For isolated local verification, seed `e2e_admin` with `FIRST_SUPERUSER_USERNAME=e2e_admin FIRST_SUPERUSER_EMAIL=e2e_admin@example.com FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed`, then pass `E2E_ADMIN_USERNAME` and `E2E_ADMIN_PASSWORD`.
- GitHub Actions CI is defined in `.github/workflows/ci.yml`. The default `quality` job runs on push/PR; the Playwright smoke job is manual through `workflow_dispatch` with `run_playwright_smoke=true`.
- Dependabot is defined in `.github/dependabot.yml` and checks npm/pnpm, uv, Docker, Docker Compose, and GitHub Actions weekly with per-ecosystem grouping.
- Lightweight dependency audits are available through `pnpm security:audit`, `pnpm security:audit:npm`, and `pnpm security:audit:python`. These are manual for now and are not part of the default CI quality job.
- Stage 6G-U audit output: npm audit and Python `pip-audit` both report no known vulnerabilities.
- Stage 6G-W readiness output: the pre-feature and security hardening checks are complete. Before coding stage 7A, choose the first small business module and write its scope brief using `docs/feature-module-checklist.md`.
- If local dev servers already occupy 8000 or 5173, use:

```bash
API_PORT=18000 WEB_PORT=15173 docker compose --profile app up --build
```

## Recommended Next Phase

Next stage can start scoped business feature preparation:

- Stage 7A: choose the first small business module and write its scope brief before implementation.

Do not start approval flows, payroll, reports, or company-specific business modules before the internal system foundation is in place.
