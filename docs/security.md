# Security

This project currently uses a lightweight, manual security audit baseline. The goal is dependency risk visibility without making the default CI pipeline noisy while the MVP foundation is still changing quickly.

## Dependency Audits

Run all dependency audits from the repository root:

```bash
pnpm security:audit
```

Run only the Node.js workspace audit:

```bash
pnpm security:audit:npm
```

Run only the Python backend audit:

```bash
pnpm security:audit:python
```

The Python audit script exports the `apps/api/uv.lock` dependency graph to a temporary requirements file and scans it with `uvx pip-audit`.

## Current Boundaries

- The audit baseline is not part of the default GitHub Actions `quality` job yet.
- Docker image scanning is intentionally not included in this stage.
- Treat audit findings as triage input first. Confirm exploitability and upgrade impact before changing dependencies.
- Keep `pnpm audit` and `pip-audit` outputs in issue or PR notes when a finding requires follow-up.

## Runtime Hardening

- `ENVIRONMENT` supports `development`, `staging`, and `production`.
- In `production`, backend settings reject the default `JWT_SECRET_KEY=please-change-me`, require `JWT_SECRET_KEY` to be at least 32 characters, reject the default PostgreSQL password `app` through either `POSTGRES_PASSWORD` or `DATABASE_URL`, and reject the default `MINIO_SECRET_KEY=minioadmin`.
- Docker Compose passes `ENVIRONMENT`, `DATABASE_URL`, and `POSTGRES_PASSWORD` into the API container so the same production checks run in the app profile.
- Upload policy checks file size before invoking the scanner, and download responses sanitize/encode filenames before setting `Content-Disposition`.

## Current Findings

As of stage 6G-W:

- `pnpm security:audit:npm` reports no known vulnerabilities.
- `pnpm security:audit:python` reports no known vulnerabilities.

Stage 6G-U remediated the previous `lodash` advisories by adding a pnpm override for `lodash@4.18.1`, which updates the dev-time API client generation dependency chain `orval > @orval/core > @ibm-cloud/openapi-ruleset > @stoplight/spectral-functions > lodash`.

## Next Security Step

Keep `pnpm security:audit:npm` and `pnpm security:audit:python` passing before the first business module PR. When Orval or the Stoplight dependency chain releases a native fix, prefer removing the override if the audit remains clean.
