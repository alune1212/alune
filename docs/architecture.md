# 架构

## 定位

alune 是一个单一根目录的 Astro 静态个人品牌站点。页面、内容和样式在同一个仓库中协作；Astro 在构建阶段生成 HTML、CSS 和需要的 JavaScript，当前不依赖运行时服务。

当前明确不包含：后端 API、数据库、登录、CMS、动态插件、队列、定时任务和部署配置。以后若要引入其中任何一项，应先在 [roadmap.md](roadmap.md) 设立新的阶段和验收边界。

## 目录与职责

```text
src/
├── components/     # 页面级和可复用 UI
├── config/         # 站点元数据、导航和展示配置
├── content/        # studio、journal、pages 内容集合与模板
├── layouts/        # 页面外壳、SEO 和共享结构
├── lib/            # 纯函数、内容筛选和关联解析
├── pages/          # Astro 路由
└── styles/         # 全局样式、tokens 和响应式规则
public/             # 原样复制的静态资源
tests/              # 单元/组件测试与 Playwright 冒烟
scripts/            # 本地维护脚本
docs/               # 架构、内容、设计、路线和维护文档
```

页面只负责组装数据和组件。内容筛选、排序、草稿过滤、关联解析等逻辑放在 `src/lib/`，这样可以被页面和测试复用。

## 内容流

```text
Markdown/内容集合
        │
        ▼
 Astro content schema
        │  draft、日期、slug、关联 ID
        ▼
纯函数筛选/排序/关联解析
        │
        ▼
layouts + components + pages
        │
        ▼
静态 HTML/CSS/JS（dist/）
```

生产构建会排除 `draft: true` 的条目；开发环境可用于预览草稿。内容 schema 是公开的内部契约，字段变更必须同步 [content-guide.md](content-guide.md)、模板和测试。

## 页面与导航

| 入口              | 用途                             |
| ----------------- | -------------------------------- |
| `/`               | 个人品牌首页、精选内容和最近更新 |
| `/studio`         | 作品、工具、实验和开源项目       |
| `/studio/[slug]`  | 单个 Studio 条目的完整记录       |
| `/journal`        | 文章索引与筛选                   |
| `/journal/[slug]` | 单篇文章                         |
| `/about`          | 个人介绍、工作方式和联系方式     |
| `/now`            | 当前关注与近期状态               |
| `/topics`         | Studio 与 Journal 的共享主题入口 |
| `/topics/[slug]`  | 某一主题下的跨集合内容           |
| `/rss.xml`        | Journal 的 RSS 订阅源            |

导航文案固定为 `Studio`、`Journal`、`About`。新增入口需要同时更新导航配置、页面、测试、README 和 [design-direction.md](design-direction.md)。站点配置使用带尾斜杠的 canonical URL；表格中的路径省略尾斜杠只是便于阅读。

## 构建与测试

开发：

```bash
pnpm dev
```

质量门：

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

`pnpm build` 产物在 `dist/`，由 Astro 生成后即可交给任意静态文件服务器；本仓库目前不提供部署 workflow。Playwright 冒烟测试在独立的 `pnpm e2e` 脚本中运行，CI 会先安装 Chromium。

## 依赖边界

- Astro 负责静态路由、内容构建和必要的渐进增强。
- TypeScript 负责配置、内容 helper 和组件类型；服务端状态管理不是当前问题。
- 内容文件是仓库源代码的一部分，不通过远程 API 拉取。
- `public/` 中的品牌素材受 [CONTENT_LICENSE.md](../CONTENT_LICENSE.md) 约束；代码文件受 [MIT](../LICENSE) 约束。
