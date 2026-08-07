/**
 * Chinese display labels for the public site.
 *
 * Route segments and content discriminators remain stable English identifiers;
 * these maps are only for the text rendered to visitors and assistive tech.
 */
import type { JournalData, StudioData } from "./content";

const kindLabels = {
  project: "项目",
  tool: "工具",
  experiment: "实验",
  "open-source": "开源作品",
  essay: "随笔",
  note: "笔记",
  devlog: "开发日志",
  update: "更新",
} satisfies Record<StudioData["kind"] | JournalData["kind"], string>;

type StudioStatus = StudioData["status"];
type UiStatus = StudioStatus | "preview";

const statusLabels = {
  idea: "构想",
  building: "构建中",
  active: "进行中",
  paused: "已暂停",
  archived: "已归档",
  preview: "预览",
} satisfies Record<UiStatus, string>;

export function kindLabel(value: string): string {
  return value in kindLabels
    ? kindLabels[value as keyof typeof kindLabels]
    : value;
}

export function statusLabel(value: string): string {
  return value in statusLabels
    ? statusLabels[value as keyof typeof statusLabels]
    : value;
}

export function topicCountLabel(count: number): string {
  return `${count} 个条目`;
}
