# @alune/api-client

Frontend API client package.

The current package contains:

- `src/index.ts`: narrow compatibility layer for runtime configuration, audit CSV export, file upload, file download, and the types needed by those boundaries. Normal JSON reads and writes should use `@alune/api-client/generated` directly.
- `src/generated/api.ts`: Orval-generated TypeScript types, request functions, and React Query hooks from FastAPI OpenAPI.

Generate the client from the monorepo root:

```bash
pnpm --filter @alune/api-client generate
```

The command first exports FastAPI's OpenAPI schema to `openapi/openapi.json`, then runs Orval against that local schema. This keeps generation reproducible without requiring a live API server.

The OpenAPI export normalizes multipart binary fields to `format: binary`, so generated upload request bodies use `Blob`.
