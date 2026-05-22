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

## Current Findings

As of stage 6G-U:

- `pnpm security:audit:npm` reports no known vulnerabilities.
- `pnpm security:audit:python` reports no known vulnerabilities.

Stage 6G-U remediated the previous `lodash` advisories by adding a pnpm override for `lodash@4.18.1`, which updates the dev-time API client generation dependency chain `orval > @orval/core > @ibm-cloud/openapi-ruleset > @stoplight/spectral-functions > lodash`.

## Next Security Step

Keep `pnpm security:audit:npm` and `pnpm security:audit:python` passing before the first business module PR. When Orval or the Stoplight dependency chain releases a native fix, prefer removing the override if the audit remains clean.
