# 内容指南

alune 的内容先服务于阅读，再服务于展示。写作保持具体、诚实和克制；不要把未完成的想法描述成已经上线的产品，也不要为了 SEO 堆砌关键词。

## 集合与模板

内容位于 `src/content/`：

- `studio/`：项目、工具、实验和开源作品。
- `journal/`：essay、note、devlog、update 等文章。
- `pages/`：关于（`about`）、近况（`now`）固定页面的可选正文覆盖。
- `_templates/`：可复制的写作模板，不会被发布。

集合由 `src/content.config.ts` 的 glob loader 加载，并由 `src/lib/content.ts` 的 strict schema 校验。

## Entry ID

不要在 frontmatter 中添加 `slug`。Astro 根据集合内的相对文件路径生成 entry ID，文件名和目录结构就是长期公开标识：

```text
src/content/studio/alune.md          → alune          → /studio/alune/
src/content/journal/notes/first.md   → notes/first    → /journal/notes/first/
```

文件公开后尽量不要移动或改名。`relatedJournal` 和 `relatedStudio` 填目标 entry ID，而不是标题或完整 URL；构建会拒绝不存在的关联。

## 共享字段

作品（`studio`）与文章（`journal`）使用以下字段：

| 字段               | 约定                                  |
| ------------------ | ------------------------------------- |
| `title`、`summary` | 必填且不能为空                        |
| `draft`            | 默认 `false`；生产页面会排除草稿      |
| `publishedAt`      | 作品可选；非草稿文章必填              |
| `updatedAt`        | 可选；不得早于 `publishedAt`          |
| `featured`         | 默认 `false`；用于首页和作品编排      |
| `order`            | 默认 `0`；数字越小越靠前              |
| `topics`           | 小写 kebab-case、不可重复，默认空数组 |

日期使用 ISO 格式。只有内容发生实质变化时才更新 `updatedAt`。文章归档始终按 `publishedAt` 倒序；作品依次按 featured、order 和日期排序。

## 作品（`studio`）

作品必须选择一种 `kind`，并填写 `status`、`links`；`relatedJournal` 未填写时默认为空数组：

```yaml
kind: project # project | tool | experiment | open-source
status: active # idea | building | active | paused | archived
relatedJournal: []
links: {}
```

- `project`、`experiment`：`links` 必填但可以为空，可使用 `primary`、`source`。
- `tool`：`links.launch` 必填，`links.source` 可选。
- `open-source`：`links.source` 必填，`links.primary` 可选。
- 只有 `project` 可以使用可选的 `role` 和 `outcomes`。

外链必须使用 HTTPS；仅 localhost、127.0.0.1 和 `[::1]` 可以使用 HTTP。不同 kind 的完整起始结构以 `_templates/` 中对应模板为准。

## 文章（`journal`）

```yaml
kind: note # essay | note | devlog | update
series: "系列名" # 可选
relatedStudio: []
cover: "/images/example.webp" # 可选；也可使用 HTTPS URL
coverAlt: "准确描述封面内容" # 使用 cover 时必填
```

`cover` 和 `coverAlt` 必须同时出现。正文先给出上下文，再使用短段落和明确标题；代码、外部事实和个人判断应清楚区分，引用外部资料时保留来源链接。

## 固定页面

`pages` 集合仅接受 `about`、`now`，并要求 `title`、`summary`、`updatedAt`；`draft` 未填写时默认为 `false`。没有对应内容文件时，页面使用 `src/config/site.config.json` 的占位文案；补充真实正文后，内容集合会覆盖该回退。

## 发布前检查

1. 确认标题、摘要、entry ID、日期和草稿状态正确。
2. 确认关联 ID 存在，外链安全且没有占位地址。
3. 图片具有准确替代文字、合理尺寸和清晰许可。
4. 在窄屏、键盘和 reduced-motion 环境下仍可阅读。
5. 按 [开发与维护](development.md) 运行普通质量门；准备正式上线时再运行 `pnpm check:release`。

原创文字和品牌素材的使用范围见 [CONTENT_LICENSE.md](../CONTENT_LICENSE.md)。
