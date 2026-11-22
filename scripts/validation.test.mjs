import process from "node:process";
import { URL, fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  buildTrustArgs,
  isNpmVersionSupported,
  isTrustEntryConfigured,
  parseCliArgs,
} from "./setup-trusted-publishers.mjs";

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

test("all public packages declare OIDC-compatible repository metadata and MIT license", async () => {
  const packagesDir = join(root, "packages");
  const entries = (await readdir(packagesDir)).toSorted();
  const publicPackages = [];

  for (const dir of entries) {
    const manifestPath = join(packagesDir, dir, "package.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.private) continue;
    publicPackages.push({ dir, manifest });
  }

  assert.equal(publicPackages.length, 53);

  for (const { dir, manifest } of publicPackages) {
    assert.equal(manifest.license, "MIT", `${dir}: license must be MIT`);
    assert.deepEqual(
      manifest.repository,
      {
        type: "git",
        url: "git+https://github.com/hdkz-dev/multi-game-engines.git",
        directory: `packages/${dir}`,
      },
      `${dir}: repository metadata must match GitHub OIDC provenance contract`,
    );
  }
});

test("all public packages remain safe under npm v12 install-time security defaults", async () => {
  const packagesDir = join(root, "packages");
  const entries = (await readdir(packagesDir)).toSorted();
  const forbiddenScripts = ["preinstall", "install", "postinstall", "prepare"];
  const forbiddenSchemes = ["git+", "http://", "https://", "github:"];

  for (const dir of entries) {
    const pkgDir = join(packagesDir, dir);
    const manifestPath = join(pkgDir, "package.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.private) continue;

    assert.equal(
      existsSync(join(pkgDir, "binding.gyp")),
      false,
      `${dir}: public package must not require implicit node-gyp rebuild`,
    );

    const scripts = manifest.scripts ?? {};
    for (const scriptName of forbiddenScripts) {
      assert.equal(
        Object.hasOwn(scripts, scriptName),
        false,
        `${dir}: public package must not declare lifecycle script "${scriptName}"`,
      );
    }

    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      const deps = manifest[field] ?? {};
      for (const [dep, spec] of Object.entries(deps)) {
        for (const scheme of forbiddenSchemes) {
          assert.equal(
            String(spec).startsWith(scheme),
            false,
            `${dir}: ${field}.${dep} must not use "${scheme}" (${spec})`,
          );
        }
      }
    }
  }
});

test("setup-trusted-publishers CLI and helpers enforce npm 11.15.0+ and permission flags", () => {
  assert.equal(isNpmVersionSupported("11.14.9"), false);
  assert.equal(isNpmVersionSupported("11.15.0"), true);
  assert.equal(isNpmVersionSupported("12.0.0"), true);

  assert.deepEqual(parseCliArgs(["--dry-run"]), {
    mode: "direct",
    dryRun: true,
    sleepMs: 0,
    filter: null,
    otp: null,
  });
  assert.throws(() => parseCliArgs(["--mode=invalid"]), /不正な --mode/);

  assert.ok(
    buildTrustArgs({
      pkg: "@multi-game-engines/core",
      mode: "direct",
    }).includes("--allow-publish"),
  );
  assert.ok(
    buildTrustArgs({ pkg: "@multi-game-engines/core", mode: "stage" }).includes(
      "--allow-stage-publish",
    ),
  );

  assert.equal(
    isTrustEntryConfigured(
      [
        {
          type: "github",
          repository: "hdkz-dev/multi-game-engines",
          workflow: "release.yml",
          allowPublish: false,
        },
      ],
      { mode: "direct" },
    ),
    false,
  );
  assert.equal(
    isTrustEntryConfigured(
      [
        {
          type: "github",
          repository: "hdkz-dev/multi-game-engines",
          workflow: "release.yml",
          allowPublish: true,
        },
      ],
      { mode: "direct" },
    ),
    true,
  );

  const dryDirect = spawnSync(
    process.execPath,
    ["scripts/setup-trusted-publishers.mjs", "--dry-run"],
    { cwd: root, encoding: "utf8" },
  );
  assert.ifError(dryDirect.error);
  assert.equal(dryDirect.status, 0, dryDirect.stderr);
  const directLines = dryDirect.stdout
    .split("\n")
    .filter((line) => line.includes("[dry-run] npm trust github "));
  assert.equal(directLines.length, 53);
  for (const line of directLines) {
    assert.match(line, /--allow-publish/);
  }

  const dryStage = spawnSync(
    process.execPath,
    [
      "scripts/setup-trusted-publishers.mjs",
      "--mode=stage",
      "--dry-run",
      "--filter=@multi-game-engines/core",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.ifError(dryStage.error);
  assert.equal(dryStage.status, 0, dryStage.stderr);
  assert.match(dryStage.stdout, /--allow-stage-publish/);

  const dryBoth = spawnSync(
    process.execPath,
    [
      "scripts/setup-trusted-publishers.mjs",
      "--mode=both",
      "--dry-run",
      "--filter=@multi-game-engines/core",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.ifError(dryBoth.error);
  assert.equal(dryBoth.status, 0, dryBoth.stderr);
  assert.match(dryBoth.stdout, /--allow-publish --allow-stage-publish/);

  const dryInvalid = spawnSync(
    process.execPath,
    ["scripts/setup-trusted-publishers.mjs", "--mode=invalid", "--dry-run"],
    { cwd: root, encoding: "utf8" },
  );
  assert.ifError(dryInvalid.error);
  assert.equal(dryInvalid.status, 1);
});
