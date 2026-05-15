# Docker

This directory contains Docker build files for the MVP services.

## Dependency Services

Start only PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

## Full MVP Stack

Build and start PostgreSQL, Redis, API, and Web:

```bash
docker compose --profile app up --build
```

If local dev servers already use ports 8000 or 5173:

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

Access:

- Web: http://localhost:5173
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health
- DB health: http://localhost:8000/api/v1/health/db
