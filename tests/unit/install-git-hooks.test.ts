import { describe, expect, it } from "vitest";

import { gitHookSkipReason } from "../../scripts/install-git-hooks.mjs";

const installed = { hasGit: true, hasHooksPackage: true };

describe("git hook install", () => {
  it("installs hooks for a normal local checkout", () => {
    expect(gitHookSkipReason({ ...installed, ci: undefined })).toBeUndefined();
  });

  it("skips CI, a missing git checkout, and a production install", () => {
    expect(gitHookSkipReason({ ...installed, ci: "true" })).toBe("CI");
    expect(gitHookSkipReason({ ...installed, ci: "1" })).toBe("CI");
    expect(gitHookSkipReason({ ...installed, hasGit: false })).toBe(
      "no .git directory",
    );
    expect(gitHookSkipReason({ ...installed, hasHooksPackage: false })).toBe(
      "simple-git-hooks is not installed",
    );
  });

  it("still installs when CI is explicitly disabled", () => {
    expect(gitHookSkipReason({ ...installed, ci: "false" })).toBeUndefined();
    expect(gitHookSkipReason({ ...installed, ci: "" })).toBeUndefined();
  });
});
