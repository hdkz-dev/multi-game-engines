import process from "node:process";
import { URL, fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));

function runWithPreload(script, preload) {
  return spawnSync(
    process.execPath,
    ["--import", `data:text/javascript,${encodeURIComponent(preload)}`, script],
    { cwd: root, encoding: "utf8", timeout: 30_000 },
  );
}

test("published SRI fetch failures fail without an opt-in environment flag", () => {
  const result = runWithPreload(
    "scripts/refresh-engine-sris.mjs",
    `delete process.env.SRI_STRICT;
     globalThis.fetch = async () => new Response(null, { status: 404 });`,
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /asset\(s\) with existing SRI/);
});

test("unreadable version metadata fails document validation", () => {
  const result = runWithPreload(
    "scripts/doc-sync.js",
    `import fs from "node:fs";
     import { basename } from "node:path";
     const read = fs.readFileSync;
     fs.readFileSync = function(path, ...args) {
       if (basename(String(path)) === "package.json") return "invalid JSON";
       return read.call(this, path, ...args);
     };`,
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /Failed to check version sync/);
});

test("Vue declarations use resolvable local paths and the public Vue peer", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mge-declarations-"));
  try {
    await mkdir(join(directory, "components"));
    const declaration = join(directory, "components", "index.d.ts");
    await writeFile(
      declaration,
      `export { default } from "./Board.vue";\n` +
        `type Board = import("../Board.vue").default;\n` +
        `type Component = import("@vue/runtime-core").Component;\n` +
        `export type { VNode } from "@vue/runtime-core";\n` +
        `type PackageName = "@vue/runtime-core";\n` +
        `export * from "../hooks.js";\n`,
    );
    const result = spawnSync(
      process.execPath,
      ["scripts/fix-vue-declaration-imports.mjs", directory],
      { cwd: root, encoding: "utf8" },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      await readFile(declaration, "utf8"),
      `export { default } from "./Board.vue.js";\n` +
        `type Board = import("../Board.vue.js").default;\n` +
        `type Component = import("vue").Component;\n` +
        `export type { VNode } from "vue";\n` +
        `type PackageName = "@vue/runtime-core";\n` +
        `export * from "../hooks.js";\n`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Nitro's patched Azure preset generates a ZIP with Archiver 8", async () => {
  const requireVue = createRequire(
    join(root, "examples/zenith-dashboard-vue/package.json"),
  );
  const requireNuxt = createRequire(requireVue.resolve("nuxt/package.json"));
  const nitroRoot = dirname(requireNuxt.resolve("nitropack/package.json"));
  const { writeFunctionsRoutes } = await import(
    pathToFileURL(join(nitroRoot, "dist/presets/azure/utils.mjs")).href
  );
  const directory = await mkdtemp(join(tmpdir(), "mge-nitro-archive-"));
  try {
    const serverDir = join(directory, "server");
    await mkdir(serverDir);
    await writeFile(
      join(serverDir, "index.mjs"),
      'export const handle = () => "ok";',
    );
    await writeFunctionsRoutes({
      options: { output: { dir: directory, serverDir } },
    });
    const archive = await readFile(join(directory, "deploy.zip"));
    assert.equal(archive.readUInt32LE(0), 67324752);
    assert.equal(archive.readUInt32LE(archive.length - 22), 101010256);
    assert.ok(archive.includes("server/index.mjs"));
    assert.ok(archive.includes("server/function.json"));
    assert.ok(archive.includes("host.json"));
    const definition = JSON.parse(
      await readFile(join(serverDir, "function.json"), "utf8"),
    );
    assert.equal(definition.entryPoint, "handle");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
