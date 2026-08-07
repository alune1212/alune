import { spawn, spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixture = path.join(root, "tests/fixtures/populated-content");
const tempRoot = await realpath(
  await mkdtemp(path.join(tmpdir(), "alune-content-e2e-")),
);
let preview;

async function cleanup() {
  if (preview && !preview.killed) preview.kill("SIGTERM");
  await rm(tempRoot, { recursive: true, force: true });
}

function run(command, args, cwd = tempRoot) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(" ")} failed`);
}

try {
  for (const file of ["astro.config.ts", "tsconfig.json", "package.json"]) {
    await cp(path.join(root, file), path.join(tempRoot, file));
  }
  await cp(path.join(root, "src"), path.join(tempRoot, "src"), {
    recursive: true,
    filter: (source) => {
      const contentRoot = path.join(root, "src/content");
      return (
        source !== contentRoot &&
        !source.startsWith(`${contentRoot}${path.sep}`)
      );
    },
  });
  await cp(path.join(root, "public"), path.join(tempRoot, "public"), {
    recursive: true,
  });
  await cp(path.join(fixture, "public"), path.join(tempRoot, "public"), {
    recursive: true,
  });
  await mkdir(path.join(tempRoot, "src/content"), { recursive: true });
  await cp(path.join(fixture, "content"), path.join(tempRoot, "src/content"), {
    recursive: true,
  });
  await cp(
    path.join(fixture, "site.config.json"),
    path.join(tempRoot, "src/config/site.config.json"),
  );
  await symlink(
    path.join(root, "node_modules"),
    path.join(tempRoot, "node_modules"),
    "dir",
  );

  for (const collection of ["studio", "journal"]) {
    for (let index = 1; index <= 8; index += 1) {
      const destination = path.join(
        tempRoot,
        `src/content/${collection}/filler-${index}.md`,
      );
      await mkdir(path.dirname(destination), { recursive: true });
      const specific =
        collection === "studio"
          ? `kind: experiment\nstatus: active\nlinks: {}\nrelatedJournal: []`
          : `kind: note\nrelatedStudio: []`;
      await writeFile(
        destination,
        `---\ntitle: Fixture ${collection} ${index}\nsummary: Published filler ${index}.\n${specific}\ndraft: false\nfeatured: false\npublishedAt: 2026-07-${String(index).padStart(2, "0")}\norder: ${index}\ntopics:\n  - filler-topic\n---\n\nPublished fixture body ${index}.\n`,
      );
    }
  }

  run(process.execPath, [path.join(root, "scripts/check-release.mjs")]);
  run(path.join(root, "node_modules/.bin/astro"), [
    "build",
    "--root",
    tempRoot,
  ]);

  preview = spawn(
    path.join(root, "node_modules/.bin/astro"),
    ["preview", "--root", tempRoot, "--host", "127.0.0.1", "--port", "4322"],
    {
      cwd: tempRoot,
      stdio: "inherit",
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    },
  );
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await cleanup();
      process.exit(0);
    });
  }
  preview.on("exit", async (code) => {
    await cleanup();
    process.exit(code ?? 0);
  });
} catch (error) {
  console.error(error);
  await cleanup();
  process.exit(1);
}
