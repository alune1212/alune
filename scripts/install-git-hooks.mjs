import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function gitHookSkipReason({ ci, hasGit, hasHooksPackage }) {
  if (isEnabled(ci)) return "CI";
  if (!hasGit) return "no .git directory";
  if (!hasHooksPackage) return "simple-git-hooks is not installed";
  return undefined;
}

function isEnabled(value) {
  return (
    value !== undefined && value !== "" && value !== "false" && value !== "0"
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  const reason = gitHookSkipReason({
    ci: process.env.CI,
    hasGit: existsSync(".git"),
    hasHooksPackage: existsSync("node_modules/simple-git-hooks"),
  });
  if (reason) {
    console.log(`Skipping git hook install (${reason}).`);
    process.exit(0);
  }

  const result = spawnSync("simple-git-hooks", {
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${path.resolve("node_modules/.bin")}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });
  if (result.error) {
    console.log(
      "Skipping git hook install (simple-git-hooks is not installed).",
    );
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}
