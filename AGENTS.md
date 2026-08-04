# alune repository guidance

本仓库是 **alune** 的单一根目录 Astro 静态个人品牌站点。开始工作前先读本文件和相关 `docs/`；当前工作树可能有并行改动，请只修改任务明确拥有的文件，保留无关改动。

## 当前边界

- 站点导航固定为 `Studio`、`Journal`、`About`，对应 `/studio`、`/journal`、`/about`。
- 页面在构建时由 Astro 生成静态 HTML、CSS 和 JavaScript；内容存放在仓库中。
- 当前没有后端 API、数据库、登录、CMS、运行时插件、队列或部署配置。不要为了“以后可能需要”提前加入这些依赖。
- 不要把未实现的服务端能力、内容管理后台或线上地址写进 README、页面或测试。

## 目录约定

- `src/pages/`：路由和页面组合；保持页面薄，把复用逻辑放进 `src/components/` 或 `src/lib/`。
- `src/components/`：可复用 Astro/前端组件。
- `src/content/`：`studio`、`journal`、`pages` 内容集合及模板；schema 是内容契约。
- `src/layouts/`、`src/styles/`、`src/config/`：布局、设计 tokens/全局样式、站点配置。
- `public/`：不经 Astro 处理的静态资源；品牌素材的权利见 `CONTENT_LICENSE.md`。
- `tests/`：单元/组件测试和 Playwright 冒烟测试配置。
- `docs/`：架构、内容、设计、路线和维护文档；改动工程事实时同步更新。

## 本地命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

提交前至少运行 `pnpm check`（lint、format:check、typecheck、test、build）。需要浏览器流程时再运行 `pnpm e2e`；CI 还会安装 Chromium 后执行同一冒烟入口。

## 实现规则

- 使用仓库 `package.json` 的 `packageManager` 字段锁定 pnpm；Node 版本按 `engines` 和 CI 的 Node 24 执行。
- 优先使用 Astro 的静态数据流和纯函数；不要在页面中加入网络请求、secret 或隐式运行时状态。
- 新增内容按 [docs/content-guide.md](docs/content-guide.md) 填写 frontmatter，并确认 draft、slug、关联 ID 和日期可被 schema 接受。
- 视觉实现遵循 [docs/design-direction.md](docs/design-direction.md)，优先复用现有 tokens 和组件，不为单个页面复制一套样式。
- 保持键盘可用、语义 HTML、可读对比度和 reduced-motion 行为；交互增强不能成为阅读内容的唯一入口。
- 不要提交构建产物、Playwright 报告、环境文件、编辑器缓存或 `.DS_Store`。

## 文档与验证

修改导航、内容 schema、构建脚本、许可证或质量门时，检查 README 及对应文档是否仍准确。CI 的顺序是：安装依赖 → lint → format check → typecheck → test → build → Playwright smoke；工作流不负责部署。
