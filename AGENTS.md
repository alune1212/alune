# alune repository guidance

本仓库是 alune 的单包 Astro 静态个人品牌站点。开始工作前阅读 [README](README.md) 和与任务相关的 canonical 文档；保留工作树中的无关改动，不覆盖其他协作者正在进行的工作。

## 实施边界

- 页面在构建期生成静态 HTML、CSS 和必要的 JavaScript；Astro integrations 属于构建能力，不代表存在运行时服务。
- 当前没有后端 API、SSR、数据库、登录、CMS、队列或部署 workflow。只有用户明确开启新阶段时才能引入这些能力。
- 内容位于 `src/content/`。公开标识由相对文件路径生成 Astro entry ID，不在 frontmatter 中维护 `slug`。
- 不得把占位资料、未完成能力或未经确认的线上地址描述为已经发布。

## 单一事实来源

- 工程、构建、测试与发布流程：[docs/development.md](docs/development.md)
- 内容 schema 与写作约定：[docs/content-guide.md](docs/content-guide.md)
- 视觉与无障碍原则：[docs/design-direction.md](docs/design-direction.md)
- 阶段与扩展边界：[docs/roadmap.md](docs/roadmap.md)
- 代码与品牌权利：[LICENSE](LICENSE)、[CONTENT_LICENSE.md](CONTENT_LICENSE.md)

不要在本文件复制依赖版本、完整脚本列表、路由清单或 frontmatter 字段；修改事实时更新其对应的唯一文档和实现。

## 完成要求

- 优先复用现有 Astro 组件、纯函数和设计 tokens；不为未来假设预埋服务端依赖。
- 保持语义 HTML、键盘可用、可读对比度和 reduced-motion 行为。
- 提交前运行 `pnpm check`；涉及页面、交互、路由或样式时再运行 `pnpm e2e`。
- 修改发布资料后运行 `pnpm check:release`；占位阶段允许它按文档所列条件失败。
- 不提交构建产物、测试报告、环境文件、编辑器缓存或系统元数据。
