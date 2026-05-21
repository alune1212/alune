# @alune/api-client

Frontend API client package.

The current package contains:

- `src/index.ts`: compatibility layer still used by mutation-heavy page actions and binary download/export boundaries. JSON requests and multipart upload delegate to generated request functions; CSV export and file download keep `Blob` returns while reusing generated URL helpers.
- `src/generated/api.ts`: Orval-generated TypeScript types, request functions, and React Query hooks from FastAPI OpenAPI.

Generate the client from the monorepo root:

```bash
pnpm --filter @alune/api-client generate
```

The command first exports FastAPI's OpenAPI schema to `openapi/openapi.json`, then runs Orval against that local schema. This keeps generation reproducible without requiring a live API server.

The OpenAPI export normalizes multipart binary fields to `format: binary`, so generated upload request bodies use `Blob`.
