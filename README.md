# alune-platform

公司内部管理系统 MVP。当前阶段只包含最小可运行 monorepo、FastAPI 后端、Vite React 前端、PostgreSQL 和 Redis 本地依赖，为后续员工管理、部门管理、权限、审批、报表、文件附件等模块预留清晰结构。

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS v4、shadcn/ui、Radix UI、TanStack Router、TanStack Query、Zustand、Sonner。
- 后端：Python 3.14、uv、FastAPI、Pydantic v2、pydantic-settings、SQLAlchemy 2.0 Async、asyncpg、Alembic、Ruff、ty、pytest。
- 工程化：pnpm workspace、Turborepo、Docker Compose。

## 目录结构

```text
alune-platform/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── api-client/
│   ├── eslint-config/
│   ├── shared/
│   └── tsconfig/
├── docs/
│   ├── architecture.md
│   ├── handoff.md
│   └── runbook.md
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── postgres/
├── scripts/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 文档

- [Architecture](docs/architecture.md) - 当前架构、数据流和 API surface。
- [Runbook](docs/runbook.md) - 本地启动、Docker、冒烟检查和排障。
- [Handoff](docs/handoff.md) - 当前完成状态、已验证命令和下一阶段建议。

## 本地启动

复制环境变量示例：

```bash
cp .env.example .env
```

安装前端依赖：

```bash
pnpm install
```

同步后端依赖：

```bash
cd apps/api
uv sync
```

启动 Docker 依赖服务：

```bash
docker compose up -d postgres redis
```

也可以使用根目录脚本：

```bash
pnpm docker:deps
```

执行数据库迁移：

```bash
pnpm db:upgrade
```

创建本地管理员：

```bash
FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
```

使用 Docker 启动完整 MVP 栈：

```bash
docker compose --profile app up --build
```

如果本机已经有开发服务器占用了 8000 或 5173，可以临时换端口：

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

完整 Docker 栈会启动：

- PostgreSQL：http://localhost:5432
- Redis：http://localhost:6379
- API：http://localhost:8000
- Web：http://localhost:5173

停止 Docker 服务：

```bash
docker compose down
```

启动后端：

```bash
cd apps/api
uv run fastapi dev app/main.py
```

启动前端：

```bash
cd apps/web
pnpm dev
```

也可以在根目录统一调度：

```bash
pnpm dev
```

## 常用命令

根目录：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm docker:deps
pnpm docker:app
pnpm docker:down
pnpm docker:logs
pnpm db:upgrade
pnpm db:revision
pnpm db:seed
```

后端：

```bash
cd apps/api
uv run pytest
uv run ruff check .
uv run ty check
uv run alembic upgrade head
FIRST_SUPERUSER_PASSWORD=change-this-password uv run python -m app.modules.auth.seed
```

前端：

```bash
cd apps/web
pnpm typecheck
pnpm build
pnpm test
```

## 访问地址

- 前端：http://localhost:5173
- 后端 Swagger：http://localhost:8000/docs
- Health：http://localhost:8000/api/v1/health
- DB Health：http://localhost:8000/api/v1/health/db

## 当前阶段边界

已完成阶段 0、阶段 1、阶段 2、阶段 3、阶段 4 的最小 MVP。当前包含登录 MVP，但不包含复杂权限、用户管理、部门管理和业务模块。下一阶段建议进入权限基础：roles、permissions、user_roles、role_permissions，以及最小后端权限校验依赖。

## 当前数据库

- `system_info` - 系统基础信息表，通过 Alembic migration 创建。
- `users` - 登录 MVP 用户表，通过 Alembic migration 创建。

## 当前 API

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/v1/health` | API 存活检查 |
| GET | `/api/v1/health/db` | PostgreSQL 连接检查；数据库不可用时返回 503 |
| POST | `/api/v1/auth/login` | OAuth2 password 登录，返回 JWT access token |
| GET | `/api/v1/auth/me` | 根据 Bearer token 返回当前用户 |
