/**
 * Chinese display labels for the public site.
 *
 * Route segments and content discriminators remain stable English identifiers;
 * these maps are only for the text rendered to visitors and assistive tech.
 */
export const sectionLabels = {
  studio: "作品",
  journal: "文章",
  about: "关于",
  now: "近况",
  topics: "主题",
} as const;

const kindLabels: Record<string, string> = {
  project: "项目",
  tool: "工具",
  experiment: "实验",
  "open-source": "开源作品",
  essay: "随笔",
  note: "笔记",
  devlog: "开发日志",
  update: "更新",
};

const statusLabels: Record<string, string> = {
  idea: "构想",
  building: "构建中",
  active: "进行中",
  paused: "已暂停",
  archived: "已归档",
  preview: "预览",
};

export function sectionLabel(value: string): string {
  return sectionLabels[value as keyof typeof sectionLabels] ?? value;
}

export function kindLabel(value: string): string {
  return kindLabels[value] ?? value;
}

export function statusLabel(value: string): string {
  return statusLabels[value] ?? value;
}

export function topicCountLabel(count: number): string {
  return `${count} 个条目`;
}
