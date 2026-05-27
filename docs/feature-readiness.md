# Feature Development Readiness

Last reviewed: 2026-05-27

Current stage: 7A

Decision: stage 6H completes the Alune Hub personal-platform repositioning, and stage 7A adds the first personal-platform core module: App Center V1. The foundation is ready to continue with another narrow personal module after that module has a written scope brief.

## Scope

This document is a feature-readiness check for Alune Hub. It does not introduce approval flows, reports, payroll, employee workflows, executable scripts, task scheduling, dynamic plugin loading, or other company-specific enterprise workflows.

## Readiness Checklist

| Area                            | Status                         | Evidence                                                                                                                                                                           | Required before feature development                                                                                                     |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo and task orchestration | Ready                          | pnpm workspace and Turborepo scripts cover dev, build, lint, typecheck, test, e2e, Docker, migrations, API client generation, and security audit.                                  | Keep using root scripts as the canonical entrypoints.                                                                                   |
| Backend module structure        | Ready                          | FastAPI routers live under `apps/api/app/modules/<feature>/`, with shared config, exceptions, responses, pagination, and async SQLAlchemy session handling separated from routers. | New personal-platform modules should follow the same module layout.                                                                     |
| Database changes                | Ready                          | Alembic owns all schema changes; no production `create_all` usage exists.                                                                                                          | Every new table must ship with an Alembic migration.                                                                                    |
| Authentication                  | Ready                          | Login, password hashing, JWT access token, `/auth/me`, seed admin, and protected frontend routes are implemented.                                                                  | New pages should not bypass the existing auth provider or backend dependencies.                                                         |
| Permissions                     | Ready                          | Roles, permissions, user-role links, role-permission links, `require_permission`, and menu filtering are implemented.                                                              | Each new module needs explicit `menu:<module>` and `action:<module>:<verb>` permissions.                                                |
| Audit logs                      | Ready with convention          | Existing mutating platform routes record operation logs; login attempts record login logs.                                                                                         | New mutating routes must record operation logs with consistent action/resource labels.                                                  |
| API client                      | Ready                          | OpenAPI export and Orval generation exist; frontend reads/writes have migrated to generated hooks except CSV/file binary boundaries.                                               | New JSON endpoints should be consumed through `@alune/api-client/generated`, not hand-written fetch wrappers.                           |
| Frontend foundation             | Ready                          | App shell, protected routes, navigation filtering, TanStack Query, shadcn/ui primitives, App Center, and platform-management pages exist.                                           | New pages should keep server state in TanStack Query and UI-only state in Zustand.                                                      |
| Tests                           | Ready with limited smoke depth | Backend pytest, frontend Vitest/Testing Library, api-client tests, and Playwright login/navigation smoke coverage exist.                                                           | New user-facing modules should add backend route tests, frontend interaction tests, and a smoke path when the workflow is critical.     |
| Docker local stack              | Ready                          | Compose covers PostgreSQL, Redis, API, Web, optional MinIO, and optional ClamAV.                                                                                                   | Keep new runtime dependencies out unless the module cannot work without them.                                                           |
| CI                              | Ready                          | GitHub Actions quality job checks API client drift, lint, typecheck, test, build, and Docker Compose config.                                                                       | Add security audit to CI only after the current npm audit finding is resolved or explicitly accepted.                                   |
| Dependency updates              | Ready                          | Dependabot watches npm/pnpm, uv, Docker, Docker Compose, and GitHub Actions.                                                                                                       | Review dependency PRs before starting a large personal-platform module.                                                                 |
| Security audit                  | Ready                          | Python audit reports no known vulnerabilities; npm audit reports no known vulnerabilities after the stage 6G-U `lodash` override.                                                  | Re-run npm and Python audit before the next feature PR.                                                                                 |
| Module implementation checklist | Ready                          | `docs/feature-module-checklist.md` records scope, backend, migration, permission, audit, API client, frontend, test, documentation, and verification gates.                        | Use the checklist before coding the next personal-platform module.                                                                      |
| App Center V1                   | Ready                          | Stage 7A adds `/api/v1/apps`, `platform_apps`, `menu:apps` and app action permissions, app category dictionary seed data, frontend `/apps`, and a homepage app-entry area.         | Keep V1 limited to registration and navigation; do not run scripts, schedules, or dynamic plugins through App Center.                   |
| Production hardening            | Ready for current MVP boundary | `ENVIRONMENT=production` rejects default JWT, PostgreSQL, and MinIO credentials, enforces minimum JWT key length, and Docker Web proxies `/api/` to the API container.              | Before real deployment, add deployment-specific secret distribution, monitoring, backup, and recovery procedures.                       |

## Code Shape Observations

- `apps/web/src/features/users/users-page.tsx` is already a large page. Do not create a generic CRUD framework yet, but extract small reusable patterns when another personal module repeats the same table/filter/dialog behavior.
- `apps/api/app/modules/users/`, `roles/`, `departments/`, `apps/`, `dictionaries/`, and `files/` routers are still understandable, but new module logic should avoid growing existing platform-management routers.
- File uploads currently enforce a 10 MB policy and are suitable for the MVP attachment baseline. Larger business attachments should trigger a streaming/storage review before implementation.
- No focused scan found production `print(`, active `TODO`/`FIXME`, or production `create_all` usage outside documentation that explicitly forbids it.

## Feature Entry Criteria

Start the next personal-platform module only after all of these are true:

1. The npm audit `lodash` finding remains resolved in the current lockfile.
2. The next module has a narrow written scope following `docs/feature-module-checklist.md`.
3. The module's API contract will be generated through Orval before frontend integration.
4. The module's schema changes are represented by Alembic migrations.
5. The module has a minimum verification plan: backend tests, frontend interaction tests, and a smoke check for the main user path.

## Recommended Next Stages

1. Stage 7B: choose one small personal-platform module that complements App Center, such as notes, bookmarks, lightweight automation registry, or resource collections, and write its scope brief before implementation.
2. Keep approval flows, payroll, reports, script execution, schedulers, and broad workflow engines out until a narrow module needs them.
