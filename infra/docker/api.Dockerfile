FROM python:3.14-slim AS runtime

COPY --from=ghcr.io/astral-sh/uv:0.11.14 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/api/alembic.ini ./alembic.ini
COPY apps/api/alembic ./alembic
COPY apps/api/app ./app

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
