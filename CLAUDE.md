# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

alune-platform 是公司内部管理系统 MVP，采用 pnpm workspace + Turborepo monorepo 架构。当前阶段包含最小可运行的 FastAPI 后端、Vite React 前端、PostgreSQL 和 Redis 本地依赖。

## Quick Start

```bash
# 1. 安装依赖
pnpm install
cd apps/api && uv sync && cd ../..

# 2. 启动数据库
pnpm docker:deps

# 3. 启动开发服务器
pnpm dev
```

访问：前端 http://localhost:5173 | 后端 http://localhost:8000/docs

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
```

### 前端（apps/web）

```bash
cd apps/web
pnpm dev         # 启动开发服务器 (http://localhost:5173)
pnpm build       # TypeScript 编译 + Vite 构建
pnpm test        # 运行 Vitest 测试
pnpm typecheck   # TypeScript 类型检查
pnpm lint        # ESLint
```

## 架构

### Monorepo 结构

```
alune-platform/
├── apps/
│   ├── api/          # FastAPI 后端 (Python 3.14, uv)
│   └── web/          # Vite React 前端
├── packages/
│   ├── api-client/   # API 客户端（Orval 生成，当前为占位）
│   ├── shared/       # 共享常量
│   ├── eslint-config/# ESLint 配置
│   └── tsconfig/     # TypeScript 配置
├── infra/
│   ├── docker/       # Dockerfile
│   └── nginx/        # Nginx 配置
└── docker-compose.yml
```

### 后端架构 (apps/api)

- **框架**: FastAPI + Pydantic v2 + SQLAlchemy 2.0 Async
- **入口**: `app/main.py` - 使用 lifespan 管理引擎生命周期
- **配置**: `app/core/config.py` - pydantic-settings，支持 `.env` 文件
- **数据库**: `app/db/session.py` - asyncpg 驱动，`get_db_session` 依赖注入
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
- **路径别名**: `@/*` -> `./src/*`

### Docker Compose 服务

- **postgres**: PostgreSQL 18，端口 5432
- **redis**: Redis 8，端口 6379
- **api**: FastAPI 应用，端口 8000（profile: app）
- **web**: Nginx 静态服务，端口 5173（profile: app）

## 环境变量

复制 `.env.example` 到 `.env` 并根据需要修改。关键变量：

- `DATABASE_URL` - PostgreSQL 连接字符串（默认: `postgresql+asyncpg://app:app@localhost:5432/company_admin`）
- `REDIS_URL` - Redis 连接字符串（默认: `redis://localhost:6379/0`）
- `API_CORS_ORIGINS` - CORS 来源（逗号分隔）
- `JWT_SECRET_KEY` - JWT 密钥（**必须修改**）
- `VITE_API_BASE_URL` - 前端 API 基础 URL

## 代码规范

- **Python**: 4 空格缩进，Ruff lint + format，ty 类型检查
- **TypeScript/React**: 2 空格缩进，ESLint，严格模式
- **提交信息**: 使用中文
- **通用**: LF 换行符，UTF-8 编码，尾随空格自动移除（.editorconfig）

## 关键模式

- **Settings 单例**: `get_settings()` 使用 `@lru_cache` 缓存，全局单例
- **数据库连接池**: `pool_pre_ping=True` 每次连接前检测可用性，避免使用失效连接
- **路径别名**: 前端 `@/*` 映射到 `./src/*`，在 tsconfig.app.json 和 vite.config.ts 中配置
- **API 响应格式**: 所有端点返回 `ApiResponse[DataT]` 泛型模型

## 测试

- **后端**: pytest + pytest-asyncio，测试在 `app/tests/`
- **前端**: Vitest + Testing Library，测试文件 `*.test.ts` / `*.test.tsx`
- **API 测试**: 使用 httpx AsyncClient + ASGITransport

## 当前阶段边界

已完成阶段 0、1、2 的最小 MVP。不包含：登录、权限、用户管理、复杂业务模块、Alembic migration。下一阶段建议：添加 Alembic 并创建第一张基础表。
