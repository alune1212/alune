# alune-platform

公司内部管理系统 MVP。当前阶段包含最小可运行 monorepo、FastAPI 后端、Vite React 前端、PostgreSQL、Redis、本地登录、权限基础，以及阶段 6F 的内部系统底座。

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS v4、shadcn/ui、Radix UI、TanStack Router、TanStack Query、Zustand、Sonner、Vitest、Playwright。
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

安装 Playwright Chromium 浏览器：

```bash
pnpm --filter @alune/web exec playwright install chromium
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
pnpm exec playwright --version
```

## 访问地址

- 前端：http://localhost:5173
- 后端 Swagger：http://localhost:8000/docs
- Health：http://localhost:8000/api/v1/health
- DB Health：http://localhost:8000/api/v1/health/db

## 当前阶段边界

已完成阶段 0、阶段 1、阶段 2、阶段 3、阶段 4、阶段 5、阶段 6A、阶段 6B、阶段 6C、阶段 6D、阶段 6E 和阶段 6F 的内部系统底座 MVP。当前包含登录 MVP、权限基础、用户创建/启停/批量启停/资料编辑/部门分配/密码重置、用户角色分配、角色增删改和权限配置搜索分组、部门创建/启停/删除规则、部门树、登录/操作日志筛选分页/日期过滤/CSV 导出、字典类型维护、字典项维护、文件附件本地上传下载、上传策略、文件存储后端抽象和上传扫描 hook。不包含审批、报表、MinIO 实际接入、病毒扫描实际引擎和公司业务模块。

## 当前数据库

- `system_info` - 系统基础信息表，通过 Alembic migration 创建。
- `users` - 登录 MVP 用户表，通过 Alembic migration 创建。
- `roles` - 角色表，通过 Alembic migration 创建。
- `permissions` - 菜单/操作权限表，通过 Alembic migration 创建。
- `user_roles` - 用户角色关联表。
- `role_permissions` - 角色权限关联表。
- `departments` - 部门基础表，支持层级和用户归属。
- `operation_logs` - 操作日志基础表。
- `login_logs` - 登录日志基础表。
- `dictionary_types` / `dictionary_items` - 字典基础表。
- `file_attachments` - 文件附件元数据基础表。

## 当前 API

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/v1/health` | API 存活检查 |
| GET | `/api/v1/health/db` | PostgreSQL 连接检查；数据库不可用时返回 503 |
| POST | `/api/v1/auth/login` | OAuth2 password 登录，返回 JWT access token |
| GET | `/api/v1/auth/me` | 根据 Bearer token 返回当前用户和权限码 |
| GET | `/api/v1/users` | 用户分页列表，支持 `q`/`department_id`/`role_code`/`page`/`page_size`，需 `action:users:read` |
| POST | `/api/v1/users` | 创建用户，需 `action:users:create` |
| PATCH | `/api/v1/users/bulk-status` | 批量启用/禁用用户，需 `action:users:update` |
| PATCH | `/api/v1/users/{user_id}` | 更新/启停用户，需 `action:users:update` |
| PATCH | `/api/v1/users/{user_id}/password` | 重置用户密码，需 `action:users:update` |
| GET | `/api/v1/users/{user_id}/roles` | 用户角色码，需 `action:users:read` |
| PUT | `/api/v1/users/{user_id}/roles` | 更新用户角色，需 `action:users:update_roles` |
| GET | `/api/v1/roles` | 角色列表，需 `action:roles:read` |
| POST | `/api/v1/roles` | 创建角色，需 `action:roles:create` |
| GET | `/api/v1/roles/permissions` | 权限列表，需 `action:roles:read` |
| GET | `/api/v1/roles/{role_id}/permissions` | 角色权限码，需 `action:roles:read` |
| PATCH | `/api/v1/roles/{role_id}` | 更新非系统角色，需 `action:roles:update` |
| DELETE | `/api/v1/roles/{role_id}` | 删除未分配用户的非系统角色，需 `action:roles:delete` |
| PUT | `/api/v1/roles/{role_id}/permissions` | 更新角色权限，需 `action:roles:update_permissions` |
| GET | `/api/v1/departments` | 部门分页列表，支持 `q`/`page`/`page_size`，需 `action:departments:read` |
| GET | `/api/v1/departments/tree` | 部门树，需 `action:departments:read` |
| POST | `/api/v1/departments` | 创建部门，需 `action:departments:create` |
| PATCH | `/api/v1/departments/{department_id}` | 更新/启停部门，需 `action:departments:update` |
| DELETE | `/api/v1/departments/{department_id}` | 删除无子部门且无用户的部门，需 `action:departments:delete` |
| GET | `/api/v1/audit/operation-logs` | 操作日志分页筛选，支持 `q`/`status`/`started_at`/`ended_at`/`page`/`page_size`，需 `action:audit:read` |
| GET | `/api/v1/audit/operation-logs/export` | 导出操作日志 CSV，支持同列表筛选，需 `action:audit:read` |
| GET | `/api/v1/audit/login-logs` | 登录日志分页筛选，支持 `q`/`status`/`started_at`/`ended_at`/`page`/`page_size`，需 `action:audit:read` |
| GET | `/api/v1/audit/login-logs/export` | 导出登录日志 CSV，支持同列表筛选，需 `action:audit:read` |
| GET | `/api/v1/dictionaries/types` | 字典类型列表，需 `action:dictionaries:read` |
| POST | `/api/v1/dictionaries/types` | 创建字典类型，需 `action:dictionaries:create` |
| PATCH | `/api/v1/dictionaries/types/{type_id}` | 更新非系统字典类型，需 `action:dictionaries:update` |
| DELETE | `/api/v1/dictionaries/types/{type_id}` | 删除无字典项的非系统字典类型，需 `action:dictionaries:update` |
| GET | `/api/v1/dictionaries/items` | 字典项列表，需 `action:dictionaries:read` |
| POST | `/api/v1/dictionaries/items` | 创建字典项，需 `action:dictionaries:create` |
| PATCH | `/api/v1/dictionaries/items/{item_id}` | 更新/启停字典项，需 `action:dictionaries:update` |
| DELETE | `/api/v1/dictionaries/items/{item_id}` | 删除字典项，需 `action:dictionaries:update` |
| GET | `/api/v1/files` | 文件分页列表，支持 `q`/`page`/`page_size`，需 `action:files:read` |
| POST | `/api/v1/files` | 创建文件元数据，需 `action:files:create` |
| POST | `/api/v1/files/upload` | 上传文件内容并创建元数据，需 `action:files:create` |
| GET | `/api/v1/files/{file_id}/download` | 下载文件内容，需 `action:files:read` |
