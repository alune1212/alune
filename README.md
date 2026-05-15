# alune-platform

公司内部管理系统 MVP。当前阶段只包含最小可运行 monorepo、FastAPI 后端、Vite React 前端、PostgreSQL 和 Redis 本地依赖，为后续员工管理、部门管理、权限、审批、报表、文件附件等模块预留清晰结构。

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS v4、shadcn/ui、Radix UI、TanStack Router、TanStack Query、Zustand、Sonner。
- 后端：Python 3.14、uv、FastAPI、Pydantic v2、pydantic-settings、SQLAlchemy 2.0 Async、asyncpg、Ruff、ty、pytest。
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
```

后端：

```bash
cd apps/api
uv run pytest
uv run ruff check .
uv run ty check
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

已完成阶段 0、阶段 1、阶段 2 的最小 MVP。当前不包含登录、权限、用户管理、复杂业务模块和 Alembic migration。下一阶段建议进入数据库迁移：添加 Alembic，并创建第一张基础表。
