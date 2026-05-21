# Architecture

`alune-platform` is a minimal monorepo foundation for a company internal admin platform. The current implementation stops at the stage 6G-P MVP: infrastructure, health checks, a dashboard shell, Alembic-managed tables, a narrow login flow, the first RBAC baseline, internal system pages for users, roles, departments, audit logs, dictionaries, and file attachments backed by local storage or MinIO with optional ClamAV scanning, plus Orval API client generation from FastAPI OpenAPI, generated-client migration for frontend reads/writes, a narrow compatibility client for binary and CSV boundaries, and Playwright smoke tests for login/navigation.

## Monorepo Layout

```text
alune-platform/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Vite React frontend
├── packages/
│   ├── api-client/   # Compatibility client plus Orval-generated API client
│   ├── eslint-config/
│   ├── shared/
│   └── tsconfig/
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── postgres/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

## Backend

Backend entrypoint: `apps/api/app/main.py`.

FastAPI creates one app with:

- CORS from `Settings.api_cors_origins`.
- Global exception handler registration.
- Health router mounted at `/api/v1/health`.
- Lifespan cleanup that disposes the async SQLAlchemy engine.

Important modules:

- `app/core/config.py` reads environment variables with `pydantic-settings`.
- `app/db/session.py` creates an async SQLAlchemy engine with `asyncpg`.
- `app/db/base.py` defines SQLAlchemy declarative metadata for Alembic.
- `app/common/response.py` defines the generic `ApiResponse[DataT]` envelope, and `app/common/pagination.py` defines paginated list payloads.
- `app/modules/health/router.py` implements API and database health checks.
- `app/modules/system/models.py` defines the `system_info` table model.
- `app/modules/auth/` implements the login MVP: `users` model, password hashing, JWT creation, current-user dependency, and auth router.
- `app/modules/permissions/` implements the RBAC baseline: roles, permissions, association tables, default permission registry, permission queries, and `require_permission`.
- `app/modules/users/`, `app/modules/roles/`, and `app/modules/departments/` implement user creation/update/password reset, batch user status updates, user role assignment, user filtering by role/department, role create/update/delete guards, role permission assignment, department trees, and department edit/delete rules.
- `app/modules/audit/`, `app/modules/dictionaries/`, and `app/modules/files/` implement paginated log reads with date filters and CSV export, dictionary type/item maintenance with system/delete guards, and local/MinIO file upload/download metadata with upload policy checks, a file storage backend factory, and an optional ClamAV upload scanner.
- `alembic/` contains migration environment and versioned schema changes.

## Frontend

Frontend entrypoint: `apps/web/src/app/main.tsx`.

The app uses:

- TanStack Router in `src/app/router.tsx` and `src/routes/`.
- TanStack Query via `src/lib/query-client.ts`.
- Zustand only for UI state in `src/stores/ui-store.ts`.
- shadcn/ui-compatible primitives in `src/components/ui/`.
- App shell layout in `src/components/layout/`.
- Dashboard page in `src/features/dashboard/dashboard-page.tsx`.
- Login page and auth provider in `src/features/auth/`.
- Users, roles, departments, audit, dictionaries, and files pages in `src/features/`; users include role/department filters plus confirmed batch status controls with result feedback, roles include guarded create/edit/delete controls plus searchable grouped permissions with empty-state feedback, audit includes date filters and CSV export, and dictionaries include type/item maintenance controls.
- Frontend interaction tests cover user batch status, role permission search, dictionary type creation, department tree/create flow, audit export filters, and file upload.
- Playwright smoke tests in `apps/web/e2e/` cover protected-route redirect, seeded-admin login, and internal-system navigation.
- Navigation permission filtering in `src/config/navigation.ts`.

The dashboard health check, auth entry points, internal-system read queries, and user/role/department/dictionary JSON write actions now use Orval-generated React Query hooks from `@alune/api-client/generated`. The `@alune/api-client` root export is now intentionally narrow: runtime configuration, audit CSV export, file upload, file download, and the few types needed by those compatibility boundaries.

Stage 6G-E adds a reproducible generation path:

- `apps/api/app/scripts/export_openapi.py` exports FastAPI OpenAPI to `packages/api-client/openapi/openapi.json`.
- The export script normalizes Pydantic v2 multipart binary schemas from `contentMediaType: application/octet-stream` to OpenAPI `format: binary`, so Orval generates upload fields as `Blob`.
- `packages/api-client/orval.config.ts` reads that local schema and writes `packages/api-client/src/generated/api.ts`.
- `packages/api-client/src/runtime-config.ts` stores the API base URL; `apps/web/src/app/main.tsx` initializes it from `VITE_API_BASE_URL`.
- `packages/api-client/src/orval-fetch.ts` is the generated client's custom fetcher. It uses the runtime API base URL and returns Orval's `{ data, status, headers }` response shape.
- `packages/api-client/src/index.ts` remains a narrow compatibility layer for runtime configuration, audit CSV export, file upload, and file download. It no longer exports the migrated JSON read/write helpers; frontend code should import generated hooks and types from `@alune/api-client/generated` for normal API access.

## Runtime Data Flow

```mermaid
flowchart LR
  Browser["Browser"] --> Web["Vite dev server or Nginx static web"]
  Web --> GeneratedClient["@alune/api-client/generated hooks"]
  Web --> BinaryClient["@alune/api-client CSV / file binary helpers"]
  Web --> RuntimeConfig["@alune/api-client configureApiClient"]
  GeneratedClient --> API["FastAPI /api/v1/health"]
  GeneratedClient --> Login["/api/v1/auth/login"]
  GeneratedClient --> Me["/api/v1/auth/me"]
  GeneratedClient --> Users["/api/v1/users"]
  GeneratedClient --> Roles["/api/v1/roles"]
  GeneratedClient --> Departments["/api/v1/departments"]
  GeneratedClient --> Audit["/api/v1/audit"]
  GeneratedClient --> Dictionaries["/api/v1/dictionaries"]
  GeneratedClient --> Files["/api/v1/files"]
  BinaryClient --> Audit
  BinaryClient --> Files
  API --> DBCheck["/api/v1/health/db"]
  DBCheck --> Postgres["PostgreSQL 18"]
  Login --> Postgres
  Me --> Postgres
  Me --> Permissions["roles / permissions / links"]
  Users --> Postgres
  Roles --> Postgres
  Departments --> Postgres
  Audit --> Postgres
  Dictionaries --> Postgres
  Files --> Postgres
  Files --> LocalStorage["Local upload storage"]
  API --> Redis["Redis 8 (reserved for later modules)"]
  Alembic["Alembic upgrade head"] --> Postgres
```

## Docker Topology

Default Compose services:

- `postgres`: PostgreSQL 18 on host port `5432`.
- `redis`: Redis 8 on host port `6379`.

`app` profile services:

- `api`: FastAPI image built from `infra/docker/api.Dockerfile`, exposed on host port `8000` by default.
- `web`: Nginx static image built from `infra/docker/web.Dockerfile`, exposed on host port `5173` by default.

PostgreSQL 18 stores data under a major-version-specific cluster directory. The Compose volume is mounted at `/var/lib/postgresql` to match the official image layout.

The `api` service stores uploaded file binaries under `/app/uploads`, backed by the named Compose volume `api_uploads`, when `FILE_STORAGE_BACKEND=local`. Local development defaults to `.local/uploads` through `LOCAL_FILE_STORAGE_DIR`. Uploads are limited by `MAX_UPLOAD_SIZE_BYTES` and `ALLOWED_UPLOAD_CONTENT_TYPES`. `FILE_STORAGE_BACKEND=minio` uses the MinIO SDK with `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, and `MINIO_SECURE`; the optional Compose `minio` profile starts MinIO and creates the configured bucket through `minio-init`. `UPLOAD_SCANNER_ENABLED=true` with `UPLOAD_SCANNER_BACKEND=clamav` scans uploads through clamd's `INSTREAM` protocol using `CLAMAV_HOST`, `CLAMAV_PORT`, and `CLAMAV_TIMEOUT_SECONDS`; the optional Compose `clamav` profile starts a local ClamAV service.

## Current API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Confirm API process is alive. |
| GET | `/api/v1/health/db` | Run `SELECT 1` through SQLAlchemy AsyncSession. Returns 503 if PostgreSQL is unavailable. |
| POST | `/api/v1/auth/login` | OAuth2 password login. Returns a JWT access token. |
| GET | `/api/v1/auth/me` | Returns the current active user and permission codes from a Bearer token. |
| GET | `/api/v1/users` | Returns paginated user records for administrators. Supports `q`, `department_id`, and `role_code`. |
| POST | `/api/v1/users` | Creates a user account. |
| PATCH | `/api/v1/users/bulk-status` | Enables or disables multiple users and records one audit log entry. |
| PATCH | `/api/v1/users/{user_id}` | Updates user account state. |
| PATCH | `/api/v1/users/{user_id}/password` | Resets a user password. |
| GET | `/api/v1/users/{user_id}/roles` | Returns role codes assigned to one user. |
| PUT | `/api/v1/users/{user_id}/roles` | Replaces role codes assigned to one user. |
| GET | `/api/v1/roles` | Returns role records for administrators. |
| POST | `/api/v1/roles` | Creates non-system role records. |
| GET | `/api/v1/roles/permissions` | Returns all permission records. |
| GET | `/api/v1/roles/{role_id}/permissions` | Returns permission codes assigned to one role. |
| PATCH | `/api/v1/roles/{role_id}` | Updates non-system roles. |
| DELETE | `/api/v1/roles/{role_id}` | Deletes non-system roles only when no users are assigned. |
| PUT | `/api/v1/roles/{role_id}/permissions` | Replaces permission codes assigned to one role. |
| GET | `/api/v1/departments` | Returns paginated department records for administrators. |
| GET | `/api/v1/departments/tree` | Returns a nested department tree. |
| POST | `/api/v1/departments` | Creates a department record. |
| PATCH | `/api/v1/departments/{department_id}` | Updates department fields. |
| DELETE | `/api/v1/departments/{department_id}` | Deletes departments only when no children or users are assigned. |
| GET | `/api/v1/audit/operation-logs` | Returns paginated/filterable operation logs with optional date range. |
| GET | `/api/v1/audit/operation-logs/export` | Exports operation logs as CSV with `q`, `status`, `started_at`, and `ended_at` filters. |
| GET | `/api/v1/audit/login-logs` | Returns paginated/filterable login logs with optional date range. |
| GET | `/api/v1/audit/login-logs/export` | Exports login logs as CSV with `q`, `status`, `started_at`, and `ended_at` filters. |
| GET | `/api/v1/dictionaries/types` | Returns dictionary types. |
| POST | `/api/v1/dictionaries/types` | Creates a dictionary type. |
| PATCH | `/api/v1/dictionaries/types/{type_id}` | Updates non-system dictionary types. |
| DELETE | `/api/v1/dictionaries/types/{type_id}` | Deletes non-system dictionary types only when no items exist. |
| GET | `/api/v1/dictionaries/items` | Returns dictionary items. |
| POST | `/api/v1/dictionaries/items` | Creates a dictionary item. |
| PATCH | `/api/v1/dictionaries/items/{item_id}` | Updates or enables/disables a dictionary item. |
| DELETE | `/api/v1/dictionaries/items/{item_id}` | Deletes a dictionary item. |
| GET | `/api/v1/files` | Returns paginated file attachment metadata. |
| POST | `/api/v1/files` | Creates file attachment metadata. |
| POST | `/api/v1/files/upload` | Uploads local file content and creates attachment metadata. |
| GET | `/api/v1/files/{file_id}/download` | Downloads stored file content. |

## Current Database Schema

| Table | Purpose |
| --- | --- |
| `system_info` | Minimal baseline table for system metadata and migration verification. |
| `users` | Login MVP user account table with password hash and active/superuser flags. |
| `roles` | RBAC role definitions. |
| `permissions` | Menu and action permission definitions. |
| `user_roles` | User-to-role assignments. |
| `role_permissions` | Role-to-permission assignments. |
| `departments` | Department hierarchy and user assignment target. |
| `operation_logs` | Operation log foundation. |
| `login_logs` | Login log foundation. |
| `dictionary_types` / `dictionary_items` | Dictionary management foundation. |
| `file_attachments` | File attachment metadata foundation. |

## Not Implemented Yet

- Complex organization workflows, approvals, reports, and company-specific business modules.
- Production reverse proxy or deployment topology.
