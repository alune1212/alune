# alune 交接说明

`alune` 是一个单一根目录的 Astro 静态个人品牌站点。它不是旧版 RAG、后台或 monorepo 的延续；旧服务端、数据库和 Docker 资料不属于当前实现边界。

## 先确认这些事实

1. 公开导航只保留 `Studio`、`Journal`、`About`。
2. Astro 在构建阶段读取 `src/content/`，生成静态页面到 `dist/`。
3. 当前没有 API、数据库、登录、CMS、动态插件或 deployment workflow。
4. 文章和品牌素材按 [CONTENT_LICENSE.md](CONTENT_LICENSE.md) 保留所有权利；代码才适用 [LICENSE](LICENSE) 的 MIT 条款。

## 开发入口

```bash
pnpm install
pnpm dev
pnpm check
pnpm exec playwright install chromium
pnpm e2e
```

单项质量命令是 `pnpm lint`、`pnpm format:check`、`pnpm typecheck`、`pnpm test` 和 `pnpm build`。根 `package.json` 是脚本和依赖的唯一入口；不要重新引入 workspace、Python 或服务端启动命令。

## 内容与 UI

- 内容集合位于 `src/content/studio`、`src/content/journal`、`src/content/pages`，schema 在 `src/content.config.ts`。模板和字段说明见 [docs/content-guide.md](docs/content-guide.md)。
- 页面路由在 `src/pages/`，复用组件在 `src/components/`，全局样式和 tokens 在 `src/styles/`。
- 视觉判断以 [docs/design-direction.md](docs/design-direction.md) 为准：克制、编辑感、留白、清晰层级和可访问性优先，避免仪表盘式堆叠。

## 变更纪律

- 先读相关实现和测试，再做最小改动；不要覆盖其他 agent 的未完成工作。
- 新增内容要能通过 schema、lint、类型检查和构建；涉及交互时补 Playwright 或组件测试。
- 修改导航、内容字段、脚本、许可证或 CI 时同步 README 与 `docs/`。
- 不新增后端、数据库、CMS、部署或网络服务，除非用户明确开启新的阶段并更新路线图。
