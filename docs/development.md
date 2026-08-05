# 开发与维护

## 技术边界

alune 是单包 Astro 静态站点。Astro 在构建期读取配置和仓库内容，输出可由任意静态文件服务器托管的 HTML、CSS 与必要 JavaScript。

当前使用的构建能力包括 Astro Content Collections、MDX、sitemap、Tailwind CSS Vite 插件和 RSS 生成。它们都不改变当前边界：仓库没有后端 API、SSR、数据库、登录、CMS、队列、定时任务或部署 workflow。

## 单一事实来源

| 事实              | 来源                                          |
| ----------------- | --------------------------------------------- |
| Node.js 版本      | `.node-version`                               |
| pnpm 版本         | `package.json` 的 `packageManager`            |
| 依赖与脚本        | `package.json`、`pnpm-lock.yaml`              |
| pnpm 安装策略     | `pnpm-workspace.yaml`                         |
| 站点资料          | `src/config/site.config.json`                 |
| 主导航            | `src/config/site.ts`                          |
| 内容集合与 schema | `src/content.config.ts`、`src/lib/content.ts` |
| 页面与输出路由    | `src/pages/`、`astro.config.ts`               |
| CI 行为           | `.github/workflows/ci.yml`                    |

`pnpm-workspace.yaml` 没有声明子包；它只承载 pnpm 的依赖构建许可、版本覆盖和发布年龄例外。项目仍然是单包，而不是 monorepo。

## 内容与页面数据流

```text
src/content/**/*.md(x)
        ↓
Astro glob loader + strict schema
        ↓
草稿过滤、排序、主题与关联校验
        ↓
layouts + components + pages
        ↓
dist/ 静态输出
```

`src/content/_templates/` 仅用于复制，不会被 loader 发布。Studio、Journal 和固定页面的相对文件路径会生成 entry ID；例如 `journal/notes/hello.md` 的 ID 是 `notes/hello`，详情地址是 `/journal/notes/hello/`。生产构建排除 `draft: true` 的条目，开发环境保留草稿预览。

页面文件是路由事实来源。Studio、Journal 的详情文件分别是 `src/pages/studio/[...id].astro` 和 `src/pages/journal/[...id].astro`；catch-all 参数对应 entry ID，因此支持嵌套路径。完整公开入口见 [README](../README.md)。新增或删除页面时同时更新导航配置、README 和对应测试。

## 本地开发与质量门

安装和开发入口：

```bash
pnpm install
pnpm dev
```

| 命令                 | 作用                                              |
| -------------------- | ------------------------------------------------- |
| `pnpm docs:check`    | 检查文档链接、索引、脚本引用和关键工程事实        |
| `pnpm lint`          | ESLint 与 Astro 静态检查                          |
| `pnpm format:check`  | 检查 Prettier 格式，不写入文件                    |
| `pnpm typecheck`     | Astro 与 TypeScript 类型检查                      |
| `pnpm test`          | 运行 `tests/unit/` 下的 Vitest 单元测试           |
| `pnpm build`         | 生成 `dist/` 静态站点                             |
| `pnpm e2e`           | 对生产构建运行桌面端和移动端 Playwright E2E       |
| `pnpm check`         | 依次运行文档、lint、格式、类型、单元测试和构建    |
| `pnpm check:release` | 先检查正式发布资料和最低内容，再运行 `pnpm check` |

首次执行 E2E 前运行 `pnpm exec playwright install chromium`。CI 使用锁文件安装依赖，逐项执行与 `pnpm check` 相同的质量门，再安装 Chromium 并运行 Playwright；CI 只验证，不部署。

## 内容与依赖维护

新增内容时从 `src/content/_templates/` 复制对应模板，并遵循 [内容指南](content-guide.md)。修改 schema 时同步模板、内容指南和单元测试；修改页面或交互时同步 Playwright 覆盖。

依赖更新以根 `package.json` 和锁文件为准。Dependabot 每周检查 npm 与 GitHub Actions；合并依赖更新前至少运行：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm e2e
```

不要为清除告警或假设性扩展引入没有消费者的运行时依赖。

## 发布门禁

`pnpm check:release` 额外要求：

1. `src/config/site.config.json` 的 `placeholder` 为 `false`。
2. 使用非保留域名的 HTTPS 生产地址。
3. 作者姓名和联系邮箱不再是占位值。
4. Studio 与 Journal 各至少有一条非草稿内容。
5. 已发布内容不含 TODO、TBD、replace-me、示例域名等占位资料。

当前仓库尚未满足这些条件，因此该命令应失败；普通工程验收使用 `pnpm check` 和 `pnpm e2e`。确定域名、托管、缓存与回滚方案后，才能新增部署配置。

## 常见排查

- 安装失败：核对 `.node-version`、`packageManager` 和锁文件，不要先删除锁文件。
- schema 报错：对照 [内容指南](content-guide.md) 检查字段、日期、entry ID 和关联目标。
- 页面缺失：检查 `src/pages/`、内容 entry ID、草稿状态和生产构建输出。
- Playwright 缺少浏览器：运行 `pnpm exec playwright install chromium`；报告目录不应提交。
- 文档检查失败：根据输出修复断链、孤立文档、无效命令或与主导航不一致的描述。
