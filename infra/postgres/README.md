# PostgreSQL

The Docker Compose service uses `postgres:18`.

PostgreSQL 18 Docker images expect the persistent volume to be mounted at `/var/lib/postgresql`, not `/var/lib/postgresql/data`. This keeps the data layout compatible with the upstream image's major-version-specific cluster directory structure.
