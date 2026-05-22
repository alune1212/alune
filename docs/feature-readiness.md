# Feature Development Readiness

Last reviewed: 2026-05-22

Current stage: 6G-T

Decision: do not enter business feature development yet. The internal system foundation is structurally ready for a small first business module, but the npm audit finding must be remediated or explicitly accepted before feature work starts.

## Scope

This document is a pre-feature readiness check. It does not introduce approval flows, reports, payroll, employee business modules, or other company-specific workflows.

## Readiness Checklist

| Area                            | Status                         | Evidence                                                                                                                                                                           | Required before feature development                                                                                                     |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo and task orchestration | Ready                          | pnpm workspace and Turborepo scripts cover dev, build, lint, typecheck, test, e2e, Docker, migrations, API client generation, and security audit.                                  | Keep using root scripts as the canonical entrypoints.                                                                                   |
| Backend module structure        | Ready                          | FastAPI routers live under `apps/api/app/modules/<feature>/`, with shared config, exceptions, responses, pagination, and async SQLAlchemy session handling separated from routers. | New business modules should follow the same module layout.                                                                              |
| Database changes                | Ready                          | Alembic owns all schema changes; no production `create_all` usage exists.                                                                                                          | Every new table must ship with an Alembic migration.                                                                                    |
| Authentication                  | Ready                          | Login, password hashing, JWT access token, `/auth/me`, seed admin, and protected frontend routes are implemented.                                                                  | Business pages should not bypass the existing auth provider or backend dependencies.                                                    |
| Permissions                     | Ready                          | Roles, permissions, user-role links, role-permission links, `require_permission`, and menu filtering are implemented.                                                              | Each new module needs explicit `menu:<module>` and `action:<module>:<verb>` permissions.                                                |
| Audit logs                      | Ready with convention          | Existing mutating internal-system routes record operation logs; login attempts record login logs.                                                                                  | New mutating business routes must record operation logs with consistent action/resource labels.                                         |
| API client                      | Ready                          | OpenAPI export and Orval generation exist; frontend reads/writes have migrated to generated hooks except CSV/file binary boundaries.                                               | New JSON endpoints should be consumed through `@alune/api-client/generated`, not hand-written fetch wrappers.                           |
| Frontend foundation             | Ready                          | App shell, protected routes, navigation filtering, TanStack Query, shadcn/ui primitives, and internal-system pages exist.                                                          | New pages should keep server state in TanStack Query and UI-only state in Zustand.                                                      |
| Tests                           | Ready with limited smoke depth | Backend pytest, frontend Vitest/Testing Library, api-client tests, and Playwright login/navigation smoke coverage exist.                                                           | First business module should add backend route tests, frontend interaction tests, and at least one e2e smoke path if it is user-facing. |
| Docker local stack              | Ready                          | Compose covers PostgreSQL, Redis, API, Web, optional MinIO, and optional ClamAV.                                                                                                   | Keep new runtime dependencies out unless the module cannot work without them.                                                           |
| CI                              | Ready                          | GitHub Actions quality job checks API client drift, lint, typecheck, test, build, and Docker Compose config.                                                                       | Add security audit to CI only after the current npm audit finding is resolved or explicitly accepted.                                   |
| Dependency updates              | Ready                          | Dependabot watches npm/pnpm, uv, Docker, Docker Compose, and GitHub Actions.                                                                                                       | Review dependency PRs before starting a large business module.                                                                          |
| Security audit                  | Blocked                        | Python audit reports no known vulnerabilities; npm audit currently reports one high and one moderate `lodash` advisory through the dev-time Orval dependency chain.                | Remediate, override with evidence, or document temporary risk acceptance for the npm audit finding.                                     |
| Production hardening            | Not a feature blocker          | Local defaults still include development secrets and local Docker-oriented settings.                                                                                               | Before deployment, add production env validation and deployment-specific secret handling.                                               |

## Code Shape Observations

- `apps/web/src/features/users/users-page.tsx` is already a large page. Do not create a generic CRUD framework yet, but extract small reusable patterns when the first business module repeats the same table/filter/dialog behavior.
- `apps/api/app/modules/users/`, `roles/`, `departments/`, `dictionaries/`, and `files/` routers are still understandable, but new business logic should avoid growing existing internal-system routers.
- File uploads currently enforce a 10 MB policy and are suitable for the MVP attachment baseline. Larger business attachments should trigger a streaming/storage review before implementation.
- No focused scan found production `print(`, active `TODO`/`FIXME`, or production `create_all` usage outside documentation that explicitly forbids it.

## Feature Entry Criteria

Start stage 7 business feature development only after all of these are true:

1. The npm audit `lodash` finding has a committed resolution or a committed temporary acceptance note.
2. The first business module has a narrow written scope, including entities, permissions, audit events, routes, pages, and tests.
3. The module's API contract will be generated through Orval before frontend integration.
4. The module's schema changes are represented by Alembic migrations.
5. The module has a minimum verification plan: backend tests, frontend interaction tests, and a smoke check for the main user path.

## Recommended Next Stages

1. Stage 6G-U: resolve or explicitly accept the npm audit `lodash` finding.
2. Stage 6G-V: write a feature module implementation checklist covering backend module layout, permissions, audit logs, migrations, generated API client usage, frontend page structure, and tests.
3. Stage 7A: start the first business module only after the previous two stages are complete.
