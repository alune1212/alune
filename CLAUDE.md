# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository. Codex and other agents should also read `AGENTS.md`.

## 项目概述

alune-platform 是公司内部管理系统 MVP，采用 pnpm workspace + Turborepo monorepo 架构。当前阶段包含最小可运行的 FastAPI 后端、Vite React 前端、PostgreSQL、Redis、本地依赖、Alembic 数据库迁移基线、登录 MVP、权限基础和阶段 6G-K 内部系统底座交互、存储、上传扫描、前端测试、Orval API client 生成与兼容层请求迁移切口加固。

## Quick Start

```bash
# 1. 安装依赖
pnpm install
pnpm --filter @alune/web exec playwright install chromium
cd apps/api && uv sync && cd ../..

# 2. 启动数据库
pnpm docker:deps

# 3. 启动开发服务器
pnpm dev
```

访问：前端 http://localhost:5173 | 后端 http://localhost:8000/docs

如果 8000 或 5173 已被本机开发服务占用，完整 Docker 栈可以换端口：

```bash
API_PORT=18000 WEB_PORT=15173 VITE_API_BASE_URL=http://localhost:18000 docker compose --profile app up --build
```

## 常用命令

### 根目录（统一调度）

```bash
pnpm dev          # 同时启动前后端开发服务器
pnpm build        # 构建所有包
pnpm test         # 运行所有测试
pnpm lint         # 运行所有 lint
pnpm typecheck    # 运行所有类型检查
pnpm docker:deps  # 启动 PostgreSQL 和 Redis
pnpm docker:app   # 启动完整 Docker 栈（含 API 和 Web）
pnpm docker:down  # 停止所有 Docker 服务
pnpm docker:logs  # 查看 Docker 服务日志
pnpm db:upgrade   # 执行 Alembic upgrade head
pnpm db:seed      # 创建本地管理员，需要 FIRST_SUPERUSER_PASSWORD
UV_CACHE_DIR=.uv-cache pnpm api-client:generate  # 导出 OpenAPI 并生成前端 API client
```

### 后端（apps/api）

```bash
cd apps/api
uv sync                          # 同步依赖
uv run fastapi dev app/main.py   # 启动开发服务器 (http://localhost:8000)
uv run pytest                    # 运行所有测试
uv run pytest app/tests/test_health.py::test_health_check_returns_api_status  # 运行单个测试
uv run ruff check .              # Ruff lint
uv run ruff format .             # Ruff format
uv run ty check                  # 类型检查
uv run alembic upgrade head      # 执行数据库迁移
uv run alembic revision --autogenerate -m "message"  # 生成迁移
FIRST_SUPERUSER_PASSWORD=change-this-password uv run python -m app.modules.auth.seed
```

### 前端（apps/web）

```bash
cd apps/web
pnpm dev         # 启动开发服务器 (http://localhost:5173)
pnpm build       # TypeScript 编译 + Vite 构建
pnpm test        # 运行 Vitest 测试
pnpm typecheck   # TypeScript 类型检查
pnpm lint        # ESLint
pnpm exec playwright --version  # 检查 Playwright CLI
```

## 架构

### Monorepo 结构

```
alune-platform/
├── apps/
│   ├── api/          # FastAPI 后端 (Python 3.14, uv)
│   └── web/          # Vite React 前端
├── packages/
│   ├── api-client/   # API 客户端（兼容层 + Orval 生成结果）
│   ├── shared/       # 共享常量
│   ├── eslint-config/# ESLint 配置
│   └── tsconfig/     # TypeScript 配置
├── infra/
│   ├── docker/       # Dockerfile
│   ├── nginx/        # Nginx 配置
│   └── postgres/     # PostgreSQL Docker notes
├── docs/             # 面向接手者的架构、运维和交接文档
└── docker-compose.yml
```

### 后端架构 (apps/api)

- **框架**: FastAPI + Pydantic v2 + SQLAlchemy 2.0 Async
- **入口**: `app/main.py` - 使用 lifespan 管理引擎生命周期
- **配置**: `app/core/config.py` - pydantic-settings，支持 `.env` 文件
- **数据库**: `app/db/session.py` - asyncpg 驱动，`get_db_session` 依赖注入
- **迁移**: `alembic/` + `alembic.ini` - 迁移创建 `system_info`、`users`、`roles`、`permissions`、关联表、`departments`、日志表、字典表和文件附件元数据；env.py 中不需要 `_registered_models` 变量，import 模型即可让 Alembic 通过 `Base.metadata` 自动发现
- **基类**: `app/db/base.py` - `Base` + `TimestampMixin`（`created_at`/`updated_at`）
- **认证**: `app/modules/auth/` - 用户表、密码哈希、JWT 登录、当前用户依赖
- **权限**: `app/modules/permissions/` - 角色、权限、关联表、默认权限、权限校验依赖
- **内部系统**: `app/modules/users/`、`app/modules/roles/`、`app/modules/departments/` - 用户创建/启停/批量启停/资料编辑/密码重置、用户角色分配、用户角色/部门过滤、角色增删改守卫、角色权限配置、部门树、部门更新/删除规则
- **基础模块**: `app/modules/audit/`、`app/modules/dictionaries/`、`app/modules/files/` - 登录/操作日志筛选分页/日期过滤/CSV 导出、字典类型/字典项维护守卫、本地文件上传下载、上传策略、文件存储后端工厂和上传扫描 hook
- **模块化**: `app/modules/<feature>/router.py` - 每个功能模块独立路由
- **统一响应**: `app/common/response.py` - `ApiResponse[DataT]` 泛型模型
- **异常处理**: `app/core/exceptions.py` - 全局异常处理器

### 前端架构 (apps/web)

- **框架**: React 19 + TypeScript + Vite
- **路由**: TanStack Router（文件路由在 `src/routes/`）
- **状态管理**: Zustand（`src/stores/`）+ TanStack Query（`src/lib/query-client.ts`）
- **UI 组件**: shadcn/ui（`src/components/ui/`）基于 Radix UI
- **布局**: `src/components/layout/` - AppShell > Sidebar + Topbar
- **功能模块**: `src/features/<feature>/` - 按功能划分页面
- **导航配置**: `src/config/navigation.ts` - 共享导航项
- **认证前端**: `src/features/auth/` - 登录页、AuthProvider、token storage、受保护路由
- **内部系统前端**: `src/features/users/`、`src/features/roles/`、`src/features/departments/`、`src/features/audit/`、`src/features/dictionaries/`、`src/features/files/`；用户页面包含角色/部门过滤、批量启停确认和结果反馈，角色页面包含角色增删改、权限搜索、按类型分组配置和搜索空状态，审计页面包含日期过滤和 CSV 导出，字典页面包含类型/字典项维护
- **表单验证**: 项目使用 Zod v4，必须用 `@hookform/resolvers/standard-schema` 的 `standardSchemaResolver`，不能用 `zodResolver`（仅支持 Zod v3）
- **菜单权限**: `src/config/navigation.ts` - 根据 `/api/v1/auth/me` 返回的权限码过滤菜单
- **API client**: `packages/api-client/src/index.ts` - 当前兼容 client（health、auth、users、roles、departments、audit、dictionaries、files），其中 JSON 请求和 multipart 上传已委托给生成 request；CSV 导出和文件下载保留 `Blob` 返回，同时复用生成 URL helper；`packages/api-client/src/generated/api.ts` 是 Orval 从 FastAPI OpenAPI 生成的 types/request functions/React Query hooks；`packages/api-client/src/runtime-config.ts` 保存运行时 API base URL；`packages/api-client/src/orval-fetch.ts` 是生成 client 的自定义 fetcher
- **Shared constants**: `packages/shared/src/index.ts` - 当前导出 `platformName`
- **路径别名**: `@/*` -> `./src/*`

### Docker Compose 服务

- **postgres**: PostgreSQL 18，端口 5432
- **redis**: Redis 8，端口 6379
- **api**: FastAPI 应用，端口 8000（profile: app）
- **web**: Nginx 静态服务，端口 5173（profile: app）
- **minio**: MinIO 对象存储，端口 9000/9001（profile: minio）
- **minio-init**: 本地 Docker MinIO bucket 初始化（profile: minio）
- **clamav**: ClamAV/clamd 上传扫描服务，端口 3310（profile: clamav）
- PostgreSQL 18 volume 必须挂载到 `/var/lib/postgresql`，不要改回 `/var/lib/postgresql/data`

## 环境变量

复制 `.env.example` 到 `.env` 并根据需要修改。关键变量：

- `DATABASE_URL` - PostgreSQL 连接字符串（默认: `postgresql+asyncpg://app:app@localhost:5432/company_admin`）
- `REDIS_URL` - Redis 连接字符串（默认: `redis://localhost:6379/0`）
- `API_CORS_ORIGINS` - CORS 来源（逗号分隔）
- `JWT_SECRET_KEY` - JWT 密钥（**必须修改**）
- `VITE_API_BASE_URL` - 前端 API 基础 URL
- `LOCAL_FILE_STORAGE_DIR` - API 本地文件上传目录（本地默认 `.local/uploads`，Docker app profile 为 `/app/uploads`）
- `MAX_UPLOAD_SIZE_BYTES` - 上传文件大小上限
- `ALLOWED_UPLOAD_CONTENT_TYPES` - 允许上传的 MIME 类型列表
- `FILE_STORAGE_BACKEND` - 文件存储后端，支持 `local` 和 `minio`
- `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` / `MINIO_SECURE` - MinIO 存储配置
- `UPLOAD_SCANNER_ENABLED` - 上传扫描开关，默认 `false`
- `UPLOAD_SCANNER_BACKEND` / `CLAMAV_HOST` / `CLAMAV_PORT` / `CLAMAV_TIMEOUT_SECONDS` - ClamAV 扫描配置

## 代码规范

- **Python**: 4 空格缩进，Ruff lint + format，ty 类型检查
- **TypeScript/React**: 2 空格缩进，ESLint，严格模式
- **提交信息**: 使用中文
- **通用**: LF 换行符，UTF-8 编码，尾随空格自动移除（.editorconfig）

## 关键模式

- **Settings 单例**: `get_settings()` 使用 `@lru_cache` 缓存，全局单例
- **数据库连接池**: `pool_pre_ping=True` 每次连接前检测可用性，避免使用失效连接
- **数据库建表**: 生产 schema 变更必须走 Alembic migration，不使用 `create_all`
- **路径别名**: 前端 `@/*` 映射到 `./src/*`，在 tsconfig.app.json 和 vite.config.ts 中配置
- **API 响应格式**: 常规端点返回 `ApiResponse[DataT]` 泛型模型；分页列表使用 `ApiResponse[Page[T]]`
- **认证状态**: token 存储在浏览器 `localStorage`；当前用户由 TanStack Query 请求 `/api/v1/auth/me`
- **权限状态**: `/api/v1/auth/me` 返回 `permissions: string[]`；后端可用 `require_permission("permission:code")` 做操作权限校验
- **CurrentUser**: 定义在 `auth/dependencies.py`（`get_current_user` 之后），被 `auth/router.py` 和 `permissions/dependencies.py` 共用
- **superuser 权限**: `list_permission_codes_for_user` 对 `is_superuser=True` 返回数据库中已登记的全部权限码

## 测试

- **后端**: pytest + pytest-asyncio，测试在 `app/tests/`
- **前端**: Vitest + Testing Library，测试文件 `*.test.ts` / `*.test.tsx`
- **前端交互覆盖**: 用户批量状态、角色权限搜索、字典类型创建、部门树和创建、审计导出过滤、文件上传
- **API 测试**: 使用 httpx AsyncClient + ASGITransport
- **浏览器测试**: Playwright `1.60.0` 已安装 Chromium `1223` 和 `chromium_headless_shell-1223`。如果 Codex 沙箱内启动 Chromium 出现 macOS Mach port 权限错误，改到沙箱外执行浏览器检查。

## 文档同步

- `README.md`：新人快速启动。
- `docs/architecture.md`：架构、数据流、API surface。
- `docs/runbook.md`：本地运行、Docker、冒烟检查和排障。
- `docs/handoff.md`：当前阶段完成情况和下一阶段。
- `AGENTS.md`：Codex/其他 agent 项目约定。

## 当前阶段边界

已完成阶段 0、1、2、3、4、5、6A、6B、6C、6D、6E、阶段 6F、阶段 6G-A、阶段 6G-B、阶段 6G-C、阶段 6G-D、阶段 6G-E、阶段 6G-F、阶段 6G-G、阶段 6G-H、阶段 6G-I、阶段 6G-J 和阶段 6G-K 的最小 MVP。不包含：复杂组织架构、审批、报表和公司业务模块。下一阶段建议：逐步把前端调用点迁移到 Orval 生成的 `@alune/api-client/generated`，或修正 multipart `binary` 字段生成类型。
