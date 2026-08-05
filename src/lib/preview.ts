import type { EntryPreviewData } from "../components/types";

const previewSummary =
  "Development preview only — replace this structural example with your own published content.";

export const studioPreviewEntries: readonly EntryPreviewData[] = [
  {
    id: "preview-project",
    title: "Project title",
    summary: previewSummary,
    href: "/studio/",
    kind: "project",
    status: "preview",
    topics: ["topic"],
    actionLabel: "Open Studio",
  },
  {
    id: "preview-tool",
    title: "Tool title",
    summary: previewSummary,
    href: "/studio/",
    kind: "tool",
    status: "preview",
    topics: ["topic"],
    actionLabel: "Open Studio",
  },
  {
    id: "preview-experiment",
    title: "Experiment title",
    summary: previewSummary,
    href: "/studio/",
    kind: "experiment",
    status: "preview",
    topics: ["topic"],
    actionLabel: "Open Studio",
  },
];

export const journalPreviewEntries: readonly EntryPreviewData[] = [
  {
    id: "preview-essay",
    title: "Essay title",
    summary: previewSummary,
    href: "/journal/",
    kind: "essay",
    topics: ["topic"],
    actionLabel: "Open Journal",
  },
  {
    id: "preview-note",
    title: "Note title",
    summary: previewSummary,
    href: "/journal/",
    kind: "note",
    topics: ["topic"],
    actionLabel: "Open Journal",
  },
  {
    id: "preview-devlog",
    title: "Devlog title",
    summary: previewSummary,
    href: "/journal/",
    kind: "devlog",
    topics: ["topic"],
    actionLabel: "Open Journal",
  },
];
