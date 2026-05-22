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

As of stage 6G-T:

- `pnpm security:audit:npm` reports one high and one moderate `lodash` advisory through the dev-time API client generation dependency chain `orval > @orval/core > @ibm-cloud/openapi-ruleset > @stoplight/spectral-functions > lodash`.
- `pnpm security:audit:python` reports no known vulnerabilities.

## Next Security Step

Review the npm finding, then decide whether to remediate through an upstream dependency upgrade, a package override, or a documented temporary acceptance.

This is also the current feature-development gate from stage 6G-T. Do not start the first business module until this finding has either a committed fix or a committed temporary acceptance note with rationale and review date.
