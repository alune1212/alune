# 内容指南

alune 的内容先服务于阅读，再服务于展示。写作保持具体、诚实、克制；不要把未完成的想法写成已经上线的产品，也不要为了 SEO 堆砌关键词。

## 内容集合

内容位于 `src/content/`：

- `studio/`：项目、工具、实验和开源作品。
- `journal/`：essay、note、devlog、update 等文章。
- `pages/`：`about`、`now` 等固定页面。
- `_templates/`：仅供复制的模板，不会被发布。

集合由 Astro schema 校验。新增文件后，先运行 `pnpm typecheck`，再运行 `pnpm build`。

## 共享字段

`studio` 和 `journal` 条目使用这些核心字段。`slug` 不写进 frontmatter：Astro glob loader 从文件名生成 entry ID/slug，文件名就是需要长期稳定的公开标识。

```yaml
title: "清楚而具体的标题"
summary: "一句话说明读者会得到什么"
draft: false
publishedAt: 2026-08-04
updatedAt: 2026-08-04
featured: false
order: 0
topics: ["knowledge", "typography"]
# cover: "/images/example.webp"  # Journal 可选；使用时同时填写 coverAlt
# coverAlt: "准确描述封面内容的替代文字"
```

日期使用 ISO 格式；`updatedAt` 只有在内容实质变化时才更新。`slug` 一旦公开尽量保持不变，确需变更时要考虑旧链接和内部关联。

Studio 列表可使用 `featured` 与 `order` 做人工编排；Journal 列表始终按 `publishedAt` 倒序，确保首页的 Latest Journal 与归档顺序名副其实。

## Studio 字段

除共享字段外，Studio 需要：

```yaml
kind: project # project | tool | experiment | open-source
status: active # idea | building | active | paused | archived
relatedJournal: []
links:
  primary: "https://example.com" # 可选
  source: "https://github.com/..." # 可选
```

`role`、`outcomes` 可按 project schema 需要补充。`tool` 使用 `links.launch`（必填）和可选的 `links.source`；`open-source` 必须提供 `links.source`；project/experiment 使用可选的 `links.primary`、`links.source`。`relatedJournal` 填文章 ID，不要填展示标题；链接必须能说明其用途，不能留下无效占位地址。

## Journal 字段

除共享字段外，Journal 需要：

```yaml
kind: essay # essay | note | devlog | update
series: "系列名" # 可选
relatedStudio: []
cover: "/images/example.webp" # 可选
coverAlt: "准确描述封面内容的替代文字" # 使用 cover 时必填
```

文章开头先给读者上下文，正文使用短段落和明确的小标题。代码、命令、外部事实和个人判断要分开；涉及外部资料时保留来源链接。

## Fixed pages

`pages` 条目使用 `about` 或 `now` 类型，并至少包含 `title`、`summary`、`updatedAt`、`draft`。About 介绍现在在做什么和如何联系；Now 只记录当前阶段，不承诺固定更新频率。

## 发布前检查

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

人工检查：

1. 标题、摘要、slug 和日期是否一致，是否误将草稿设为公开。
2. 内部关联 ID 是否存在；外链是否指向正确页面并使用 HTTPS（本地地址除外）。
3. 图片有替代文字、尺寸合理、来源和许可清楚；品牌素材按 [CONTENT_LICENSE.md](../CONTENT_LICENSE.md) 处理。
4. 在窄屏和键盘操作下阅读顺畅；不要把 hover 或动效当成唯一信息入口。
