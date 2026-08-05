# alune

alune 是一个使用 Astro 构建的个人数字主页，用来长期沉淀作品、文章和个人介绍。站点保持静态优先：内容随仓库构建，不依赖后端、数据库或 CMS。

当前工程基础已经完成，但站点仍使用占位域名、作者信息和内容。补齐真实资料前，它不是可正式发布的版本。

## 开始使用

Node.js 版本以 [`.node-version`](.node-version) 为准，pnpm 版本以 [`package.json`](package.json) 的 `packageManager` 为准。

```bash
pnpm install
pnpm dev
```

常用质量命令：

```bash
pnpm docs:check    # 检查文档链接、索引和工程事实
pnpm check         # 文档、代码、格式、类型、单元测试和构建
pnpm e2e           # Playwright 桌面端与移动端测试
pnpm check:release # 质量门加正式发布条件
```

首次运行浏览器测试前，需要安装 Chromium：

```bash
pnpm exec playwright install chromium
```

`check:release` 当前会因占位站点资料及缺少正式 Studio、Journal 内容而失败，这是预期的发布保护，而不是工程故障。

## 公开结构

主导航固定为 **Studio**、**Journal**、**About**。

| 路径                                | 用途                                    |
| ----------------------------------- | --------------------------------------- |
| `/`                                 | 首页、精选内容和近期状态                |
| `/studio/`、`/studio/page/<n>/`     | 作品列表与分页                          |
| `/studio/<entry-id>/`               | Studio 详情；entry ID 可以包含嵌套路径  |
| `/journal/`、`/journal/page/<n>/`   | 文章列表与分页                          |
| `/journal/<entry-id>/`              | Journal 详情；entry ID 可以包含嵌套路径 |
| `/about/`                           | 个人介绍与联系方式                      |
| `/now/`                             | 当前关注与近期状态                      |
| `/topics/`、`/topics/<topic>/`      | 跨 Studio、Journal 的主题索引           |
| `/rss.xml`                          | Journal RSS 订阅源                      |
| `/robots.txt`、`/sitemap-index.xml` | 搜索引擎入口                            |
| `/404.html`                         | 静态未找到页面                          |

## 文档

- [开发与维护](docs/development.md)：技术边界、数据流、质量门和发布检查。
- [内容指南](docs/content-guide.md)：内容集合、entry ID、frontmatter 和模板约定。
- [设计方向](docs/design-direction.md)：视觉、排版、响应式与无障碍原则。
- [路线图](docs/roadmap.md)：当前状态、下一阶段和扩展决策门。
- [协作规范](AGENTS.md)：仓库内 agent 的实施和验证要求。

## 许可证

源代码按 [MIT License](LICENSE) 发布。原创文章、品牌名称、视觉识别和其他品牌素材不随 MIT 授权，具体范围见 [CONTENT_LICENSE.md](CONTENT_LICENSE.md)。
