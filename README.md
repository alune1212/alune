# alune

alune 是一个以 Astro 构建的个人品牌静态站点。它用来整理作品、文章和个人介绍，导航保持三项：**Studio**、**Journal**、**About**。

当前是第一版静态重建：内容和页面都在仓库中生成，没有后端、数据库、CMS 或部署配置。

## 快速开始

需要 Node.js 24 和仓库 `package.json` 中声明的 pnpm 版本。

```bash
pnpm install
pnpm dev
```

开发服务器启动后，打开终端提示的本地地址（通常是 `http://localhost:4321`）。

## 常用命令

```bash
pnpm lint          # ESLint / Astro 代码检查
pnpm format        # 按 Prettier 格式化
pnpm format:check  # 检查格式，不修改文件
pnpm typecheck     # Astro + TypeScript 类型检查
pnpm test          # 单元/组件测试
pnpm build         # 生成静态站点到 dist/
pnpm e2e           # Playwright 浏览器冒烟测试
pnpm e2e:list      # 列出 Playwright 测试
pnpm preview       # 预览最近一次构建结果
```

Playwright 首次运行需要安装 Chromium：

```bash
pnpm exec playwright install chromium
```

完整质量检查可以直接运行：

```bash
pnpm check
```

`check` 汇总 lint、格式检查、类型检查、测试和构建；`check:release` 是同一组检查加上发布前的额外约束。项目目前没有 deploy 脚本。

## 目录结构

```text
alune/
├── public/              # 不经 Astro 处理的静态资源
├── src/
│   ├── components/      # 可复用界面组件
│   ├── config/          # 站点和导航配置
│   ├── content/         # Journal 等内容源文件
│   ├── layouts/         # 页面布局
│   ├── lib/             # 小型纯函数和内容辅助逻辑
│   ├── pages/           # Astro 路由
│   ├── styles/          # 全局样式和设计 tokens
│   └── ...
├── tests/               # 测试与 Playwright 冒烟
├── scripts/             # 本地维护脚本
├── docs/                # 架构、内容和维护约定
├── astro.config.*
├── package.json
└── pnpm-lock.yaml
```

## 导航与内容

站点公开入口保持稳定：

- `/`：首页与近期内容入口。
- `/studio`：作品、实验和制作记录。
- `/journal`：文章索引；文章详情使用其 slug 路径。
- `/about`：个人介绍、工作方式和联系方式。

新增或修改文章前，请先阅读 [内容指南](docs/content-guide.md)。视觉和交互约束见 [设计方向](docs/design-direction.md)。

## 工程文档

- [架构](docs/architecture.md)：页面、内容、构建和测试边界。
- [内容指南](docs/content-guide.md)：文章 frontmatter、写作语气和发布前检查。
- [设计方向](docs/design-direction.md)：alune 的视觉、排版、响应式和无障碍原则。
- [路线图](docs/roadmap.md)：当前阶段、下一步和明确的非目标。
- [维护手册](docs/maintenance.md)：依赖、质量门和日常排障。

## 许可证

仓库中的代码按 [MIT](LICENSE) 发布。原创文章、文案、品牌名称、标志、字体配置、视觉设计和品牌素材不随 MIT 授权，具体范围见 [CONTENT_LICENSE.md](CONTENT_LICENSE.md)。
