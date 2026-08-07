import type { EntryPreviewData } from "../components/types";

const previewSummary = "仅供开发预览——请用你自己的已发布内容替换这个结构示例。";

const previewTopic = { slug: "topic", label: "主题" } as const;

export const studioPreviewEntries: readonly EntryPreviewData[] = [
  {
    id: "preview-project",
    title: "项目标题",
    summary: previewSummary,
    href: "/studio/",
    kind: "project",
    status: "preview",
    topics: [previewTopic],
    actionLabel: "打开作品",
  },
  {
    id: "preview-tool",
    title: "工具标题",
    summary: previewSummary,
    href: "/studio/",
    kind: "tool",
    status: "preview",
    topics: [previewTopic],
    actionLabel: "打开作品",
  },
  {
    id: "preview-experiment",
    title: "实验标题",
    summary: previewSummary,
    href: "/studio/",
    kind: "experiment",
    status: "preview",
    topics: [previewTopic],
    actionLabel: "打开作品",
  },
];

export const journalPreviewEntries: readonly EntryPreviewData[] = [
  {
    id: "preview-essay",
    title: "随笔标题",
    summary: previewSummary,
    href: "/journal/",
    kind: "essay",
    topics: [previewTopic],
    actionLabel: "打开文章",
  },
  {
    id: "preview-note",
    title: "笔记标题",
    summary: previewSummary,
    href: "/journal/",
    kind: "note",
    topics: [previewTopic],
    actionLabel: "打开文章",
  },
  {
    id: "preview-devlog",
    title: "开发日志标题",
    summary: previewSummary,
    href: "/journal/",
    kind: "devlog",
    topics: [previewTopic],
    actionLabel: "打开文章",
  },
];
