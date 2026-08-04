# 维护手册

## 日常开发

```bash
pnpm install
pnpm dev
```

Node 使用 24；pnpm 版本以根 `package.json` 的 `packageManager` 为准。不要在本机手动升级到另一个 pnpm 版本后提交锁文件。

## 提交前质量门

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

也可以运行 `pnpm check` 一次完成。需要浏览器冒烟时：

```bash
pnpm exec playwright install chromium
pnpm e2e
```

CI 会在相同质量门之后安装 Chromium 并执行 Playwright；工作流只验证，不部署。

## 内容维护

1. 在 `src/content/` 复制对应集合模板，填写 schema 要求的字段。
2. 本地预览草稿、列表、详情和关联内容；确认生产构建不会泄露 `draft: true`。
3. 运行 lint、typecheck、test、build，并检查链接、图片替代文字和移动端阅读。
4. 若字段、导航或内容约定变化，同步 README、`architecture.md` 和 `content-guide.md`。

## 依赖维护

Dependabot 每周只检查根 npm 依赖和 GitHub Actions。合并依赖更新前：

```bash
pnpm install --frozen-lockfile
pnpm check
```

若更新影响 Astro、TypeScript、内容 schema 或 Playwright，额外运行 `pnpm e2e` 并记录行为变化。不要为了清除告警引入未使用的服务端依赖。

## 常见排查

- **安装失败**：确认 Node 版本为 24，并使用 `corepack`/pnpm action 读取 `packageManager`；不要先删除锁文件。
- **schema 报错**：对照 [content-guide.md](content-guide.md) 检查日期、枚举、slug 和关联 ID；先修内容再改 schema。
- **构建找不到页面**：确认文件位于 `src/pages/`，动态路由的 slug 和内容条目一致，并重新运行 `pnpm build`。
- **Playwright 无浏览器**：运行 `pnpm exec playwright install chromium`；查看 `test-results/` 和 `playwright-report/`，这些目录不应提交。
- **格式检查失败**：运行 `pnpm format` 后重新检查，只提交预期文件。

## 发布边界

当前没有 deployment workflow，也没有约定的线上域名或托管平台。`dist/` 只作为本地构建产物；任何线上发布都必须先完成路线图中的决策门，并补充对应文档和回滚说明。
