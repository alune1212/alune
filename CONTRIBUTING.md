# 参与协作

完整说明在[开发与维护](docs/development.md)的「协作流程」。打开拉取请求前：

1. 从 `main` 拉分支，命名为 `<type>/<short-description>`，例如 `fix/theme-toggle`。
2. 在本地克隆里，`pnpm install` 会装上 pre-commit。CI 和生产安装会跳过。钩子只格式化并 lint 暂存文件，不跑测试或构建。
3. 拉取请求标题使用 [Conventional Commits](https://www.conventionalcommits.org/zh-v1.0.0/)：`<type>[optional scope]: <subject>`。正文按模板写清改了什么、为什么、怎么验证。
4. 运行 `pnpm check`。改了页面、交互、路由或样式时再运行 `pnpm e2e`。
5. 审查通过后 squash merge。squash 提交标题使用 PR 标题，合并后删除分支。这两项是 GitHub 仓库设置，不是仓库里的脚本。合进 `main` 的提交若属于会发布的类型，release-please 会打开或更新发布拉取请求。不要修改那条拉取请求的标题。做法见[开发与维护](docs/development.md)的「版本与更新日志」。
6. 仓库里没有部署 workflow。域名和托管还没定，见[路线图](docs/roadmap.md)。GitHub Release 只记录仓库版本，不表示站点已经上线。

议题请用缺陷报告或功能请求模板。

要设成必需状态检查的 job 名称是 `Quality gates`、`Validate PR title`、`CodeQL`。`Validate PR title` 对应的 workflow 使用默认分支上的配置，合进 `main` 之后才会在后续拉取请求上出现。
