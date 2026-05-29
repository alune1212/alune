# Feature Module Checklist

Last reviewed: 2026-05-28

Current stage: 7B

Use this checklist before starting any new Alune Hub personal-platform module. A module is not ready to implement until the scope, data model, permissions, audit events, API contract, frontend surface, tests, and verification commands are all written down.

## Scope Gate

Write a short module brief before touching code:

- Module name, user-facing purpose, and the first user workflow.
- Explicitly excluded workflows for this iteration.
- Data entities and whether each entity is new or reuses an existing table.
- Required import, export, attachment, reporting, or approval behavior. If none are required, say so.
- Permission model: who can see the menu, read data, create data, update data, delete data, export data, or manage attachments.
- Audit expectations for every mutating action.
- Minimum test plan and manual smoke path.

Keep each module small. Do not create a generic workflow engine, report engine, approval engine, script executor, scheduler, or dynamic plugin runtime before a real module needs it.

## Backend Checklist

Create backend code under `apps/api/app/modules/<module>/`:

- `models.py` for SQLAlchemy models.
- `schemas.py` for Pydantic request and response models.
- `router.py` for FastAPI routes.
- `repository.py` or `service.py` only when router logic would otherwise become hard to read.
- `__init__.py` for the module package.

Backend rules:

- Use `async def` routes and SQLAlchemy `AsyncSession`.
- Return the existing `ApiResponse[...]` and paginated `Page[...]` shapes.
- Keep route prefixes under `/api/v1/<module>`.
- Use `HTTPException` with explicit status codes for client errors.
- Do not catch and swallow unexpected exceptions.
- Do not use `print`.
- Do not introduce table creation through `Base.metadata.create_all()`.

## Migration Checklist

Every schema change must use Alembic:

- Add or update SQLAlchemy models first.
- Import models in Alembic env wiring if needed so `Base.metadata` sees them.
- Generate a migration with `uv run alembic revision --autogenerate -m "<message>"`.
- Review the generated migration by hand.
- Run `UV_CACHE_DIR=.uv-cache pnpm db:upgrade`.
- Run `UV_CACHE_DIR=.uv-cache uv run alembic check` from `apps/api` or equivalent root workflow.

Use clear table names. Prefer singular module naming in code and plural table naming only when that matches existing project style.

## Permission Checklist

Add permissions in `apps/api/app/modules/permissions/registry.py`:

- One menu permission: `menu:<module>`.
- Read permission: `action:<module>:read`.
- Mutating permissions as needed: `action:<module>:create`, `action:<module>:update`, `action:<module>:delete`.
- Extra action permissions only when they represent a real product boundary, such as `action:<module>:export`, `action:<module>:share`, or `action:<module>:upload`.

Apply permissions in routers with `require_permission(...)`. Add the menu item in `apps/web/src/config/navigation.ts` only after the backend permission exists.

After changing the registry:

- Run the seed command again in local environments so the admin role receives new permission codes.
- Add backend tests that prove protected routes reject users without the needed permission.
- Add or update frontend menu filtering tests if a new menu item is added.

## Audit Checklist

Every mutating route must write an operation log with `record_operation_log`:

- Use stable `action` names such as `create`, `update`, `delete`, `submit`, `approve`, or `export`.
- Use a stable `resource_type`, usually the module name.
- Include the affected resource id when one exists.
- Log successful mutations after the database commit.
- For partial or batch operations, log the requested count and final result.

Read-only list/detail routes do not need operation logs unless they export data or access sensitive data.

## API Client Checklist

Frontend JSON reads and writes must use generated API client hooks:

1. Add or update backend routes and schemas.
2. Run `UV_CACHE_DIR=.uv-cache pnpm api-client:generate`.
3. Confirm `packages/api-client/openapi/openapi.json` and `packages/api-client/src/generated/api.ts` are intentionally updated.
4. Import generated hooks and types from `@alune/api-client/generated`.
5. Do not add hand-written fetch wrappers for normal JSON endpoints.

Keep `packages/api-client/src/index.ts` narrow. It is reserved for runtime configuration, CSV export, file upload, file download, and other binary/browser boundary helpers.

## Frontend Checklist

Create frontend code under `apps/web/src/features/<module>/`:

- `<module>-page.tsx` for the page entry.
- `<module>-page.test.tsx` for interaction coverage.
- Local components only when they reduce real complexity.
- Small helpers only when they are reused or isolate non-trivial mapping.

Frontend rules:

- Use TanStack Query generated hooks for server state.
- Use Zustand only for UI state that is shared outside the page.
- Use `standardSchemaResolver` for Zod v4 forms.
- Keep shadcn/ui-compatible primitives under `apps/web/src/components/ui/`.
- Add navigation in `apps/web/src/config/navigation.ts` with the matching `menu:<module>` permission.
- Show loading, empty, success, and error states for the primary workflow.
- Keep binary upload/download and CSV export on the existing compatibility helpers unless generated hooks can safely preserve the browser-facing behavior.

Avoid building a generic CRUD framework before at least two personal-platform modules prove the abstraction.

## Test Checklist

Minimum tests for a new personal-platform module:

- Backend route tests for list/detail and each mutation.
- Backend permission tests for at least one read route and one mutating route.
- Backend migration/model test if new tables are added.
- Frontend interaction test for the primary workflow.
- API client generation drift check through `pnpm api-client:generate`.
- Playwright smoke test only when the module adds a new critical navigation path or end-to-end workflow.

Update MSW only when a test or future e2e path needs browser-level API mocking.

## Documentation Checklist

Update docs in the same change as the feature:

- `docs/architecture.md` for new routes, tables, data flow, and meaningful design choices.
- `docs/runbook.md` for new environment variables, seed steps, smoke commands, import/export operations, or troubleshooting.
- `docs/handoff.md` for completed stage notes and verified commands.
- `README.md` only for top-level quick-start, phase boundary, or command changes.
- `AGENTS.md` and `CLAUDE.md` for agent-facing facts, routes, commands, guardrails, and stage status.

Do not duplicate full implementation details across every file. Put operational steps in the runbook, design facts in architecture, and current status in handoff.

## Verification Checklist

Before merging a feature module, run:

```bash
UV_CACHE_DIR=.uv-cache pnpm lint
UV_CACHE_DIR=.uv-cache pnpm typecheck
UV_CACHE_DIR=.uv-cache pnpm test
UV_CACHE_DIR=.uv-cache pnpm api-client:generate
pnpm --filter @alune/api-client typecheck
pnpm --filter @alune/api-client test
pnpm build
pnpm --filter @alune/web e2e --list
pnpm security:audit:npm
UV_CACHE_DIR=.uv-cache pnpm security:audit:python
docker compose config
docker compose --profile app config
```

If the module adds migrations or seed data, also run:

```bash
UV_CACHE_DIR=.uv-cache pnpm db:upgrade
FIRST_SUPERUSER_PASSWORD=change-this-password UV_CACHE_DIR=.uv-cache pnpm db:seed
```

If the module changes browser-critical behavior, run the actual Playwright smoke suite against local API/Web.

## Ready For Next Stage

The next stage can start only when:

1. This checklist is committed.
2. `docs/feature-readiness.md` says the platform is ready for feature development.
3. npm and Python security audits still report no known vulnerabilities.
4. The next personal-platform module has a written scope brief following the scope gate above.
