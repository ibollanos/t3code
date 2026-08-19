#!/usr/bin/env node
/**
 * Packs the `t3` CLI server package into an installable npm tarball.
 *
 * `pnpm pack`/`npm pack` cannot consume the monorepo's `workspace:` and
 * `catalog:` dependency protocols, so this stages apps/server with a plain
 * package.json (catalog entries resolved to their pinned versions,
 * devDependencies dropped) and packs that. Used by the fork release workflow;
 * safe to run locally after `pnpm --filter t3 run build:bundle` (or
 * `node apps/server/scripts/cli.ts build`).
 *
 * Usage: node scripts/pack-cli-tarball.mjs [outputDir]   (default: release/)
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "yaml";

const repoRoot = resolve(import.meta.dirname, "..");
const serverDir = join(repoRoot, "apps/server");
const outputDir = resolve(repoRoot, process.argv[2] ?? "release");

const manifest = JSON.parse(readFileSync(join(serverDir, "package.json"), "utf8"));
const catalog = parse(readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8")).catalog ?? {};

if (!manifest.bin?.t3) {
  throw new Error("apps/server/package.json is missing the t3 bin entry.");
}
if (!readFileSync(join(serverDir, "dist/bin.mjs"), "utf8").length) {
  throw new Error("apps/server/dist/bin.mjs is missing — build the CLI first.");
}

const dependencies = Object.fromEntries(
  Object.entries(manifest.dependencies ?? {}).map(([name, spec]) => {
    if (spec === "catalog:") {
      const resolved = catalog[name];
      if (!resolved) throw new Error(`No catalog entry for ${name}`);
      return [name, resolved];
    }
    if (spec.startsWith("workspace:")) {
      throw new Error(`${name} is a workspace dependency and cannot ship in the tarball.`);
    }
    return [name, spec];
  }),
);

const stageDir = join(
  tmpdir(),
  `t3-cli-pack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
);
try {
  mkdirSync(stageDir, { recursive: true });
  cpSync(join(serverDir, "dist"), join(stageDir, "dist"), { recursive: true });

  const packedManifest = {
    name: manifest.name,
    version: manifest.version,
    license: manifest.license,
    repository: manifest.repository,
    bin: manifest.bin,
    files: ["dist"],
    type: "module",
    engines: manifest.engines,
    dependencies,
  };
  writeFileSync(join(stageDir, "package.json"), `${JSON.stringify(packedManifest, null, 2)}\n`);

  mkdirSync(outputDir, { recursive: true });
  const out = execFileSync("npm", ["pack", "--pack-destination", outputDir], {
    cwd: stageDir,
    encoding: "utf8",
  }).trim();
  console.log(`[pack-cli-tarball] wrote ${join(outputDir, out)}`);
} finally {
  rmSync(stageDir, { recursive: true, force: true });
}
