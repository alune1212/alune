import type { PagePlatformAppPublic } from "@alune/api-client/generated";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getPlatformAppPage(value: unknown): PagePlatformAppPublic | undefined {
  if (!isRecord(value) || !isRecord(value.data) || !Array.isArray(value.data.items)) {
    return undefined;
  }

  return value.data as unknown as PagePlatformAppPublic;
}
