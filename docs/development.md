# 开发与维护

## 技术边界

alune 是单包 Astro 静态站点。Astro 在构建期读取配置和仓库内容，输出可由任意静态文件服务器托管的 HTML、CSS 与必要 JavaScript。

当前使用的构建能力包括 Astro Content Collections、MDX、sitemap 和 RSS 生成。它们都不改变当前边界：仓库没有后端 API、SSR、数据库、登录、CMS、队列、定时任务或部署 workflow。

## 单一事实来源

| 事实              | 来源                                                           |
| ----------------- | -------------------------------------------------------------- |
| Node.js 版本      | `.node-version`                                                |
| pnpm 版本         | `package.json` 的 `packageManager`                             |
| 依赖与脚本        | `package.json`、`pnpm-lock.yaml`                               |
| pnpm 安装策略     | `pnpm-workspace.yaml`                                          |
| 站点资料          | `src/config/site.config.json`                                  |
| 主导航            | `src/config/site.ts`                                           |
| 内容集合与 schema | `src/content.config.ts`、`src/lib/content.ts`                  |
| 页面与输出路由    | `src/pages/`、`astro.config.ts`                                |
| 协作流程          | 本文「协作流程」、`CONTRIBUTING.md`                            |
| 议题与 PR 模板    | `.github/ISSUE_TEMPLATE/`、`.github/pull_request_template.md`  |
| CI 与安全扫描     | `.github/workflows/`                                           |
| 依赖更新          | `.github/dependabot.yml`                                       |
| 本地提交钩子      | `package.json` 的 `prepare`、`simple-git-hooks`、`lint-staged` |

`pnpm-workspace.yaml` 没有声明子包；它只承载 pnpm 的依赖构建许可和版本覆盖。项目仍然是单包。

`package.json` 的 `engines` 声明可运行范围：Node.js `>=26.3.0 <27`，pnpm `>=11.20.0 <12`。CI 和本地钉选仍以上表的 `.node-version` 与 `packageManager` 为准。

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

`src/content/_templates/` 仅用于复制，不会被 loader 发布。作品（`studio`）、文章（`journal`）和固定页面的相对文件路径会生成 entry ID；例如 `journal/notes/hello.md` 的 ID 是 `notes/hello`，详情地址是 `/journal/notes/hello/`。生产构建排除 `draft: true` 的条目，开发环境保留草稿预览。

页面文件是路由事实来源。作品（`studio`）、文章（`journal`）的详情文件分别是 `src/pages/studio/[...id].astro` 和 `src/pages/journal/[...id].astro`；catch-all 参数对应 entry ID，因此支持嵌套路径。完整公开入口见 [README](../README.md)。新增或删除页面时同时更新导航配置、README 和对应测试。

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
| `pnpm format`        | 用 Prettier 写回格式                              |
| `pnpm format:check`  | 检查 Prettier 格式，不写入文件                    |
| `pnpm typecheck`     | Astro 与 TypeScript 类型检查                      |
| `pnpm test`          | 运行 `tests/unit/` 下的 Vitest 单元测试           |
| `pnpm test:watch`    | Vitest 监听模式                                   |
| `pnpm build`         | 生成 `dist/` 静态站点                             |
| `pnpm e2e`           | 构建当前站点并运行基础与隔离内容 Playwright E2E   |
| `pnpm e2e:preview`   | 预览已有 `dist` 并运行当前站点基础 E2E            |
| `pnpm e2e:content`   | 在系统临时目录构建完整内容 fixture 并运行 E2E     |
| `pnpm e2e:ci`        | 顺序运行 preview-only 与隔离内容两套 E2E          |
| `pnpm e2e:list`      | 列出当前站点与隔离内容两套 Playwright 用例        |
| `pnpm check`         | 依次运行文档、lint、格式、类型、单元测试和构建    |
| `pnpm check:release` | 先检查正式发布资料和最低内容，再运行 `pnpm check` |

首次执行 E2E 前运行 `pnpm exec playwright install chromium`。质量 workflow 的触发条件、权限和另外两条检查见下方「协作流程」。`pnpm check:release` 不在 CI 里。仓库没有部署 workflow。

## 协作流程

一个人维护。GitHub 上的分支保护、合并方式和删除分支是仓库设置，不在本仓库文件里，这里只记录它们现在的值和仓库内已经落地的部分。

### 分支

从 `main` 拉出短分支，命名为 `<type>/<short-description>`，例如 `fix/theme-toggle`、`docs/contributing`。`type` 与 Conventional Commits 的类型一致。Dependabot 使用自己的 `dependabot/` 分支。

### 本地提交

`pnpm install` 会运行 `prepare`，由 `simple-git-hooks` 把 pre-commit 写到 `.git/hooks`。钩子只执行 `pnpm exec lint-staged`：

- `*.js`、`*.mjs`、`*.cjs`、`*.ts`、`*.tsx`、`*.astro` 先 `eslint --max-warnings=0 --fix`，再 Prettier。
- 其余暂存文件交给 Prettier，未知类型跳过。
- `pnpm-lock.yaml` 不交给 Prettier。

钩子不跑文档检查、类型检查、单元测试、构建或 E2E。完整门禁仍是提交前的 `pnpm check`，以及改了页面、交互、路由或样式时的 `pnpm e2e`。`git commit --no-verify` 可以跳过钩子。质量 workflow 仍会运行 `pnpm check` 和 `pnpm e2e:ci`。

`pnpm-workspace.yaml` 把 `simple-git-hooks` 的依赖构建设为 `false`。它的安装脚本只做写钩子这一件事，根目录的 `prepare` 已经负责；pnpm 11 对未列入 `allowBuilds` 的依赖构建会让安装失败。钩子缺失时执行 `pnpm exec simple-git-hooks`。

本地提交说明不强制 Conventional Commits。合进 `main` 的提交说明来自拉取请求标题。

### 拉取请求

使用 `.github/pull_request_template.md`，写清改了什么、为什么、怎么验证，并勾选 `pnpm check` 和需要时的 `pnpm e2e`。标题遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-v1.0.0/)：`<type>[optional scope]: <subject>`。未额外收窄类型，因此默认接受 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。破坏性变更写在类型后面的 `!`。

`.github/workflows/pr-title.yml` 在拉取请求打开、编辑、重新打开和推送新提交时检查标题。job 名称是 `Validate PR title`。这条 workflow 使用 `pull_request_target`，只读标题，不检出拉取请求代码；用的是默认分支上的 workflow 文件。第一次把它合进 `main` 之前，当前拉取请求上不会出现这次检查，也不要提前把它设成必需检查。

议题模板在 `.github/ISSUE_TEMPLATE/`：缺陷报告、功能请求，以及关闭空白议题的 `config.yml`。

### 持续集成

| Workflow                         | 何时运行                            | job 名称            | 做什么                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`       | 推送 `main`、拉取请求、手动         | `Quality gates`     | 按锁文件安装依赖，运行一次 `pnpm check` 并复用其 `dist`，再执行 `pnpm exec playwright install --with-deps chromium` 与 `pnpm e2e:ci`。隔离内容套件单独构建临时站点。权限只有 `contents: read`。 |
| `.github/workflows/pr-title.yml` | 拉取请求打开、编辑、重新打开、同步  | `Validate PR title` | 检查标题是否为 Conventional Commits。权限是 `pull-requests: read`。                                                                                                                             |
| `.github/workflows/codeql.yml`   | 推送 `main`、拉取请求、每周一、手动 | `CodeQL`            | 用 CodeQL 扫描 JavaScript / TypeScript，不编译站点。权限含 `security-events: write`。                                                                                                           |

Action 版本使用与 `ci.yml` 相同的主版本标签，例如 `actions/checkout@v7`。没有部署 job，`pnpm check:release` 也不是其中任何一步。

分支保护要把状态检查设为必需时，使用这三个 job 名称：`Quality gates`、`Validate PR title`、`CodeQL`。

### 审查与合并

审查确认改动和模板里的验证说明一致。当前 GitHub 仓库设置是：只允许 squash merge，squash 提交标题使用拉取请求标题，提交正文使用拉取请求正文，合并后删除分支。

### 部署

部署仍未决定。域名、托管、缓存、回滚和中国大陆三网直连的验收方式写在[路线图](roadmap.md)的部署决策门。这些决定完成之前，不添加 deployment workflow。

## 内容与依赖维护

新增内容时从 `src/content/_templates/` 复制对应模板，并遵循 [内容指南](content-guide.md)。修改 schema 时同步模板、内容指南和单元测试；修改页面或交互时同步 Playwright 覆盖。

TypeScript 按[官方并存方案](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)安装：`@typescript/native` 保留 TypeScript 7 编译器，`typescript` 指向 `@typescript/typescript6` 兼容包。`pnpm exec tsc` 使用 7.x；ESLint 和 `astro check` 导入 6.x API，因为当前工具尚不支持 TypeScript 7 的程序接口。版本与解析结果仍以 `package.json` 和锁文件为准。

依赖更新以根 `package.json` 和锁文件为准。Dependabot 每周把 npm 更新合成一组、把 GitHub Actions 更新合成一组。npm 拉取请求标题使用 `chore(deps)` 或 `chore(deps-dev)`，Actions 使用 `ci(deps)`，以便通过 `Validate PR title`。合并依赖更新前至少运行：

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
4. 作品（`studio`）与文章（`journal`）各至少有一条非草稿内容。
5. 站点名称、描述、首页 hero、首页近况及社交链接不含常见占位标记或现有脚手架文案；没有已发布关于页时，同样检查关于页回退文案。
6. 已发布作品、文章、固定页面的 frontmatter 值和正文通过占位标记检查；固定页面通过 schema 校验且每种 kind 最多有一条非草稿内容。草稿不计入发布内容，也不会阻止对应页面回退文案的检查。

自动检查识别 TODO、TBD、replace-me、待填写、待补充、占位和当前回退文案等明确标记；示例域名与英文 `placeholder` 只检查配置和 frontmatter 值。它不判断文案是否完整、事实是否真实或链接是否属于维护者，发布前仍需人工复核。frontmatter 注释不作为公开文案检查；正文中的 TODO 等标记（包括代码示例）仍会触发保护。

当前仓库尚未满足这些条件，因此该命令应失败；普通工程验收使用 `pnpm check` 和 `pnpm e2e`。确定域名、托管、缓存与回滚方案后，才能新增部署配置。

## 订阅源与索引

`/rss.xml` 只收录生产构建中的非草稿文章，顺序与文章列表相同。频道标题是站点名加「文章」，频道描述是站点描述。每条的 `description` 是摘要，`content` 是清洗后的正文，`categories` 是 `topics`；存在 `publishedAt` 时写入 `pubDate`。

订阅源不使用页面上的 Astro / MDX 渲染。`src/pages/rss.xml.ts` 用 markdown-it 把 `entry.body` 转成 HTML（关闭原始 HTML，开启 linkify 和 typographer），再用 sanitize-html 清洗：

- 允许的标签是 sanitize-html 的默认集合，再加 `img`。
- `a` 保留 `href` 和 `title`；`img` 保留 `src`、`alt`、`title`、`width` 和 `height`；`code` 保留 `class`。
- URL 协议只允许 `http`、`https` 和 `mailto`，不接受协议相对地址。
- 相对链接和图片地址按 `site.siteUrl` 改成绝对地址。解析失败的地址会被去掉；没有 `alt` 的图片会补上空字符串。

因此 MDX 组件、表达式和原始 HTML 不会进入订阅源。

`src/config/site.config.json` 的 `placeholder` 为 `true` 时，布局输出 `noindex, nofollow`，`/robots.txt` 写入 `Disallow: /`。改为 `false` 后，普通页面可以被索引，`robots.txt` 改为 `Allow: /`。两种情况下都会声明 `sitemap-index.xml`。`/404.html` 始终 `noindex`，并且不输出 canonical。

首页和关于页输出 schema.org `Person`。文章详情输出 `Article`。作品详情在 `kind` 为 `tool` 时输出 `SoftwareApplication`，其他作品输出 `CreativeWork`。近况页不附加结构化数据。分享图默认是 `/og-default.svg`；文章提供 `cover` 时，详情页改用这张封面。

## 常见排查

- 安装失败：核对 `.node-version`、`packageManager` 和锁文件，不要先删除锁文件。
- schema 报错：对照 [内容指南](content-guide.md) 检查字段、日期、entry ID 和关联目标。
- 页面缺失：检查 `src/pages/`、内容 entry ID、草稿状态和生产构建输出。
- Playwright 缺少浏览器：运行 `pnpm exec playwright install chromium`；报告目录不应提交。
- 文档检查失败：根据输出修复断链、孤立文档、无效命令或与主导航不一致的描述。
- pre-commit 失败：看 ESLint 或 Prettier 的输出并重新暂存。钩子不代替 `pnpm check`。
