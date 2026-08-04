import { describe, expect, it } from "vitest";

import {
  countTopics,
  deriveUsedTopics,
  topicLabel,
} from "../../src/lib/topics";

describe("topic helpers", () => {
  it("derives deterministic unique topic slugs and supports production filtering", () => {
    const entries = [
      { draft: false, topics: ["web", "design"] },
      { draft: true, topics: ["private", "web"] },
    ];
    expect(deriveUsedTopics(entries)).toEqual(["design", "private", "web"]);
    expect(deriveUsedTopics(entries, { production: true })).toEqual([
      "design",
      "web",
    ]);
    expect(countTopics(entries, { production: true })).toEqual({
      design: 1,
      web: 1,
    });
  });

  it("formats stable topic slugs for labels", () => {
    expect(topicLabel("design-systems")).toBe("Design Systems");
  });
});
