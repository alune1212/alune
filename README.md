# alune-platform

Alune Knowledge 个人/小团队 RAG 知识库平台 MVP。当前阶段包含最小可运行 monorepo、FastAPI 后端、Vite React 前端、PostgreSQL + pgvector、Redis、本地登录、权限基础、知识库与成员管理、文档入库、文档切片/向量索引、失败文档重新索引、多知识库单轮问答、引用溯源、操作日志、配置字典和文件存储。遗留应用中心 API 暂保留但不再作为主导航入口；平台不执行脚本、不加载动态插件。

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS v4、shadcn/ui、Radix UI、TanStack Router、TanStack Query、Zustand、Sonner、Vitest、Playwright。
- 后端：Python 3.14、uv、FastAPI、Pydantic v2、pydantic-settings、SQLAlchemy 2.0 Async、asyncpg、Alembic、Ruff、ty、pytest。
- RAG：pgvector、OpenAI 兼容 chat/embedding API、PDF/DOCX/TXT/Markdown 文档入库。
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
│   ├── feature-module-checklist.md
│   ├── feature-readiness.md
│   ├── handoff.md
│   ├── runbook.md
│   └── security.md
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
- [Feature Module Checklist](docs/feature-module-checklist.md) - 个人平台模块开发前的范围、权限、审计、迁移、前端和测试准入清单。
- [Feature Readiness](docs/feature-readiness.md) - 进入下一轮功能开发前的准入检查和阻塞项。
- [Runbook](docs/runbook.md) - 本地启动、Docker、冒烟检查和排障。
- [Security](docs/security.md) - 依赖安全审计基线和当前边界。
- [Handoff](docs/handoff.md) - 当前完成状态、已验证命令和下一阶段建议。

## 本地启动

复制环境变量示例：

```bash
cp .env.example .env
```

`ENVIRONMENT` 设为 `development`（开发环境）；生产环境需设为 `production`，此时不允许使用默认 JWT、PostgreSQL 和 MinIO 密钥，JWT 密钥至少需 32 字符。知识问答需要配置 `AI_API_KEY`；未配置时仍可使用登录、知识库和文档管理。

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
API_PORT=18000 WEB_PORT=15173 docker compose --profile app up --build
```

完整 Docker 栈会启动：

- PostgreSQL + pgvector：http://localhost:5432
- Redis：http://localhost:6379
- API：http://localhost:8000
- Web：http://localhost:5173

Docker Web serves browser API requests through Nginx at the relative `/api/` path and proxies them to the API service. Local Vite development can still set `VITE_API_BASE_URL=http://localhost:8000`.

如果使用上面的替代端口命令，访问地址变为：

- API：http://localhost:18000
- Web：http://localhost:15173

后端根路径 `/` 没有定义页面，浏览器直接打开 API 根地址会返回 `{"detail":"Not Found"}`。这是正常行为；查看接口文档请打开 `/docs`，健康检查请打开 `/api/v1/health`。

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
UV_CACHE_DIR=.uv-cache pnpm api-client:generate
pnpm --filter @alune/api-client typecheck
pnpm --filter @alune/api-client test
pnpm --filter @alune/web e2e --list
pnpm exec prettier --check .github/workflows/ci.yml
pnpm exec prettier --check .github/dependabot.yml
pnpm security:audit:npm
UV_CACHE_DIR=.uv-cache pnpm security:audit:python
docker compose config
docker compose --profile app config
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

Playwright 冒烟测试需要先启动 API/Web，并准备一个有完整菜单权限的本地管理员：

```bash
FIRST_SUPERUSER_USERNAME=e2e_admin FIRST_SUPERUSER_EMAIL=e2e_admin@example.com FIRST_SUPERUSER_PASSWORD=change-this-password pnpm db:seed
E2E_BASE_URL=http://localhost:5173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
```

如果使用完整 Docker app profile 且端口映射为 `15173/18000`：

```bash
E2E_BASE_URL=http://localhost:15173 E2E_ADMIN_USERNAME=e2e_admin E2E_ADMIN_PASSWORD=change-this-password pnpm --filter @alune/web e2e
```

## 访问地址

- 前端：http://localhost:5173
- 后端 Swagger：http://localhost:8000/docs
- Health：http://localhost:8000/api/v1/health
- DB Health：http://localhost:8000/api/v1/health/db

替代端口运行 Docker app profile 时：

- 前端：http://localhost:15173
- 后端 Swagger：http://localhost:18000/docs
- Health：http://localhost:18000/api/v1/health
- DB Health：http://localhost:18000/api/v1/health/db

## 当前阶段边界

已完成阶段 0 到阶段 6G-W 的 MVP 底座，并完成阶段 6H 的个人平台定位调整和阶段 7A 的应用中心 V1。当前包含登录 MVP、权限基础、用户/协作者管理、空间管理、角色权限、操作日志、配置字典、文件资源、应用中心登记和导航、基于 FastAPI OpenAPI 的 Orval API client 生成、Playwright 登录/导航冒烟测试、GitHub Actions CI 质量门、Dependabot 依赖更新提醒、npm/Python 依赖安全审计基线和安全部署硬化。不包含审批、报表、薪资、供应商、客户、合同等企业流程。

阶段 7A 之后，最新基础能力边界是：

- `ENVIRONMENT` 支持 `development`、`staging` 和 `production`；生产模式会拒绝默认 JWT、PostgreSQL、MinIO 凭据，并要求 JWT 密钥至少 32 字符。
- 超级用户管理需要 `action:users:manage_superuser` 或当前用户本身是超级用户；用户不能禁用自己的账号，也不能修改自己的超级用户状态。
- 系统角色权限变更受超级用户管理权限保护，空权限列表更新和空间删除并发查询问题已修复。
- 前端 `/auth/me` 返回 401 时会清理本地 token，并跳转到 `/login?expired=true` 展示会话过期提示。
- 平台路由已接入 `RequirePermission`，无菜单权限时显示 forbidden 页面，而不是只依赖菜单隐藏。
- Docker Web 通过 Nginx 将同源 `/api/` 代理到 API 容器，生产浏览器不再调用 `localhost:8000`。
- 文件上传会在扫描前先做大小检查；文件下载响应会清理并编码文件名，避免 `Content-Disposition` 头注入。
- 应用中心 V1 只负责应用登记、筛选、启停和入口导航，不执行脚本、任务调度或动态插件加载。

进入下一轮功能开发前先阅读 [Feature Readiness](docs/feature-readiness.md) 和 [Feature Module Checklist](docs/feature-module-checklist.md)。阶段 7C 已完成 RAG MVP 的成员管理、重新索引和多知识库问答补强；后续新模块仍应先写清楚范围、权限、审计事件、API、页面和测试计划。

## Security Audit

轻量安全审计基线目前是手动命令，不在默认 CI 中阻塞构建：

```bash
pnpm security:audit
pnpm security:audit:npm
pnpm security:audit:python
```

Python 审计通过 `scripts/security-audit-python.sh` 将 `apps/api/uv.lock` 导出为临时 requirements 文件，再用 `uvx pip-audit` 扫描。更多说明见 [Security](docs/security.md)。

当前 npm audit remediation 通过 pnpm override 将传递依赖 `lodash` 固定到 `4.18.1`，用于清理 Orval 开发依赖链上的旧审计发现。生产运行硬化由 `ENVIRONMENT=production` 的启动校验覆盖，详见 [Security](docs/security.md)。

## CI

GitHub Actions workflow 位于 `.github/workflows/ci.yml`。

- `quality` job 在 push/PR 上运行：安装 Node/Python/uv/pnpm 依赖、生成 API client 并检查生成物已提交、执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 和 Docker Compose 配置校验。
- `playwright-smoke` job 仅在手动 `workflow_dispatch` 且勾选 `run_playwright_smoke` 时运行，会启动 PostgreSQL/Redis、迁移数据库、创建 `e2e_admin`、启动 API，并运行 Playwright 冒烟测试。

## Dependency Updates

Dependabot 配置位于 `.github/dependabot.yml`，每周一上午按 `Asia/Shanghai` 时区检查：

- npm / pnpm workspace：根目录 `package.json` 和 `pnpm-lock.yaml`。
- uv：`apps/api/pyproject.toml` 和 `apps/api/uv.lock`。
- Docker：`infra/docker/` 下的 Dockerfile。
- Docker Compose：根目录 `docker-compose.yml`。
- GitHub Actions：`.github/workflows/`。

每个生态都使用 `groups` 合并同类更新，减少零散依赖 PR。

## 当前数据库

- `system_info` - 系统基础信息表，通过 Alembic migration 创建。
- `users` - 登录 MVP 用户表，通过 Alembic migration 创建。
- `roles` - 角色表，通过 Alembic migration 创建。
- `permissions` - 菜单/操作权限表，通过 Alembic migration 创建。
- `user_roles` - 用户角色关联表。
- `role_permissions` - 角色权限关联表。
- `departments` - 空间基础表，保留技术表名，用户界面显示为空间管理。
- `platform_apps` - Alune Hub 应用入口表，支持平台内页面和外部链接登记。
- `operation_logs` - 操作日志基础表。
- `login_logs` - 登录日志基础表。
- `dictionary_types` / `dictionary_items` - 字典基础表。
- `file_attachments` - 文件附件元数据基础表。
- `knowledge_bases` - RAG 知识库。
- `knowledge_base_members` - 知识库成员和 owner/editor/viewer 角色。
- `knowledge_documents` - 知识库文档、解析/索引状态和 chunk 数。
- `knowledge_chunks` - 文档切片、metadata 和 pgvector embedding。

## 当前 API

| Method | Path                                            | 说明                                                                                                   |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GET    | `/api/v1/health`                                | API 存活检查                                                                                           |
| GET    | `/api/v1/health/db`                             | PostgreSQL 连接检查；数据库不可用时返回 503                                                            |
| POST   | `/api/v1/auth/login`                            | OAuth2 password 登录，返回 JWT access token                                                            |
| GET    | `/api/v1/auth/me`                               | 根据 Bearer token 返回当前用户和权限码                                                                 |
| GET    | `/api/v1/apps`                                  | 应用中心分页列表，支持 `q`/`category_code`/`is_active`/`page`/`page_size`，需 `action:apps:read`       |
| POST   | `/api/v1/apps`                                  | 创建应用入口，需 `action:apps:create`                                                                  |
| PATCH  | `/api/v1/apps/{app_id}`                         | 更新应用入口，需 `action:apps:update`                                                                  |
| PATCH  | `/api/v1/apps/{app_id}/status`                  | 启用/停用应用入口，需 `action:apps:manage_status`                                                      |
| GET    | `/api/v1/knowledge-bases`                       | 知识库分页列表，需 `action:knowledge_bases:read`                                                       |
| POST   | `/api/v1/knowledge-bases`                       | 创建知识库并将创建者设为 owner，需 `action:knowledge_bases:create`                                     |
| GET    | `/api/v1/knowledge-bases/{id}`                  | 查看知识库，需全局读权限和知识库成员权限                                                               |
| PATCH  | `/api/v1/knowledge-bases/{id}`                  | 更新知识库，需全局更新权限和 owner/editor 成员权限                                                     |
| DELETE | `/api/v1/knowledge-bases/{id}`                  | 停用知识库，需全局删除权限和 owner 成员权限                                                            |
| GET    | `/api/v1/knowledge-bases/{id}/members`          | 查看知识库成员，需 owner 成员权限                                                                      |
| PUT    | `/api/v1/knowledge-bases/{id}/members`          | 替换知识库成员，需 owner 成员权限                                                                      |
| GET    | `/api/v1/knowledge-bases/{id}/documents`        | 查看知识库文档，需 `action:knowledge_documents:read` 和成员权限                                        |
| POST   | `/api/v1/knowledge-bases/{id}/documents/upload` | 上传并索引 PDF/DOCX/TXT/Markdown 文档，需 `action:knowledge_documents:upload`                          |
| GET    | `/api/v1/knowledge-documents/{id}`              | 查看知识文档，需文档所属知识库成员权限                                                                 |
| POST   | `/api/v1/knowledge-documents/{id}/index`        | 重新读取存储文件并索引，需 `action:knowledge_documents:index`                                          |
| DELETE | `/api/v1/knowledge-documents/{id}`              | 标记删除知识文档，需 `action:knowledge_documents:delete`                                               |
| POST   | `/api/v1/rag/ask`                               | 单轮知识问答，返回答案和引用来源，需 `action:rag:ask`                                                  |
| GET    | `/api/v1/users`                                 | 用户分页列表，支持 `q`/`department_id`/`role_code`/`page`/`page_size`，需 `action:users:read`          |
| POST   | `/api/v1/users`                                 | 创建用户，需 `action:users:create`                                                                     |
| PATCH  | `/api/v1/users/bulk-status`                     | 批量启用/禁用用户，需 `action:users:update`                                                            |
| PATCH  | `/api/v1/users/{user_id}`                       | 更新/启停用户，需 `action:users:update`                                                                |
| PATCH  | `/api/v1/users/{user_id}/password`              | 重置用户密码，需 `action:users:update`                                                                 |
| GET    | `/api/v1/users/{user_id}/roles`                 | 用户角色码，需 `action:users:read`                                                                     |
| PUT    | `/api/v1/users/{user_id}/roles`                 | 更新用户角色，需 `action:users:update_roles`                                                           |
| GET    | `/api/v1/roles`                                 | 角色列表，需 `action:roles:read`                                                                       |
| POST   | `/api/v1/roles`                                 | 创建角色，需 `action:roles:create`                                                                     |
| GET    | `/api/v1/roles/permissions`                     | 权限列表，需 `action:roles:read`                                                                       |
| GET    | `/api/v1/roles/{role_id}/permissions`           | 角色权限码，需 `action:roles:read`                                                                     |
| PATCH  | `/api/v1/roles/{role_id}`                       | 更新非系统角色，需 `action:roles:update`                                                               |
| DELETE | `/api/v1/roles/{role_id}`                       | 删除未分配用户的非系统角色，需 `action:roles:delete`                                                   |
| PUT    | `/api/v1/roles/{role_id}/permissions`           | 更新角色权限，需 `action:roles:update_permissions`                                                     |
| GET    | `/api/v1/departments`                           | 空间分页列表，技术路径仍为 departments，支持 `q`/`page`/`page_size`，需 `action:departments:read`      |
| GET    | `/api/v1/departments/tree`                      | 空间树，技术路径仍为 departments，需 `action:departments:read`                                         |
| POST   | `/api/v1/departments`                           | 创建空间，技术路径仍为 departments，需 `action:departments:create`                                     |
| PATCH  | `/api/v1/departments/{department_id}`           | 更新/启停空间，技术路径仍为 departments，需 `action:departments:update`                                |
| DELETE | `/api/v1/departments/{department_id}`           | 删除无子空间且无用户的空间，技术路径仍为 departments，需 `action:departments:delete`                   |
| GET    | `/api/v1/audit/operation-logs`                  | 操作日志分页筛选，支持 `q`/`status`/`started_at`/`ended_at`/`page`/`page_size`，需 `action:audit:read` |
| GET    | `/api/v1/audit/operation-logs/export`           | 导出操作日志 CSV，支持 `q`/`status`/`started_at`/`ended_at`，需 `action:audit:read`                    |
| GET    | `/api/v1/audit/login-logs`                      | 登录日志分页筛选，支持 `q`/`status`/`started_at`/`ended_at`/`page`/`page_size`，需 `action:audit:read` |
| GET    | `/api/v1/audit/login-logs/export`               | 导出登录日志 CSV，支持 `q`/`status`/`started_at`/`ended_at`，需 `action:audit:read`                    |
| GET    | `/api/v1/dictionaries/types`                    | 字典类型列表，需 `action:dictionaries:read`                                                            |
| POST   | `/api/v1/dictionaries/types`                    | 创建字典类型，需 `action:dictionaries:create`                                                          |
| PATCH  | `/api/v1/dictionaries/types/{type_id}`          | 更新非系统字典类型，需 `action:dictionaries:update`                                                    |
| DELETE | `/api/v1/dictionaries/types/{type_id}`          | 删除无字典项的非系统字典类型，需 `action:dictionaries:update`                                          |
| GET    | `/api/v1/dictionaries/items`                    | 字典项列表，需 `action:dictionaries:read`                                                              |
| POST   | `/api/v1/dictionaries/items`                    | 创建字典项，需 `action:dictionaries:create`                                                            |
| PATCH  | `/api/v1/dictionaries/items/{item_id}`          | 更新/启停字典项，需 `action:dictionaries:update`                                                       |
| DELETE | `/api/v1/dictionaries/items/{item_id}`          | 删除字典项，需 `action:dictionaries:update`                                                            |
| GET    | `/api/v1/files`                                 | 文件分页列表，支持 `q`/`page`/`page_size`，需 `action:files:read`                                      |
| POST   | `/api/v1/files`                                 | 创建文件元数据，需 `action:files:create`                                                               |
| POST   | `/api/v1/files/upload`                          | 上传文件内容并创建元数据，需 `action:files:create`                                                     |
| GET    | `/api/v1/files/{file_id}/download`              | 下载文件内容，需 `action:files:read`                                                                   |
