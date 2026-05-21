# alune-platform Web

Vite React frontend for the company admin platform MVP.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The web app is available at http://localhost:5173.

## Checks

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## Playwright Smoke

Run the browser smoke suite after API/Web are running and a local admin has been seeded:

```bash
E2E_BASE_URL=http://localhost:5173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm e2e
```

When using the Docker app profile on alternate ports:

```bash
E2E_BASE_URL=http://localhost:15173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm e2e
```
