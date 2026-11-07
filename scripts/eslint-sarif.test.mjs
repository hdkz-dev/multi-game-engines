import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import {
  combineLintReports,
  createPartitions,
  runESLintSarif,
} from "./eslint-sarif.mjs";

async function fixture(workspaces = []) {
  const cwd = await mkdtemp(join(tmpdir(), "mge-sarif-test-"));
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify({ private: true, workspaces }),
  );
  await writeFile(
    join(cwd, "eslint.config.mjs"),
    'export default [{ ignores: ["ignored/**", "ignored.js"] }, { files: ["**/*.js"], rules: { "no-debugger": "error", "no-unused-vars": "warn" } }];\n',
  );
  return cwd;
}

async function file(cwd, name, content) {
  await mkdir(dirname(join(cwd, name)), { recursive: true });
  await writeFile(join(cwd, name), content);
}

function lintReport(filePath, ruleId, severity = 2) {
  return {
    results: [
      {
        filePath,
        messages: [{ ruleId, severity, message: ruleId, line: 1, column: 1 }],
        errorCount: severity === 2 ? 1 : 0,
        warningCount: severity === 1 ? 1 : 0,
        fatalErrorCount: 0,
      },
    ],
    metadata: {
      rulesMeta: {
        [ruleId]: {
          docs: {
            description: ruleId,
            url: `https://eslint.org/docs/latest/rules/${ruleId}`,
          },
        },
      },
    },
  };
}

test("SARIF partitions retain root, other directories, nested workspaces, and configured ignores", async () => {
  const cwd = await fixture(["packages/*", "packages/a/nested"]);
  try {
    for (const name of [
      "packages/a/package.json",
      "packages/b/package.json",
      "packages/a/nested/package.json",
    ])
      await file(cwd, name, "{}");
    const sources = [
      "root.js",
      "misc/extra.js",
      "packages/a/index.js",
      "packages/b/index.js",
      "packages/a/nested/index.js",
    ];
    for (const name of [...sources, "ignored.js", "ignored/skip.js"])
      await file(cwd, name, "debugger;\n");
    const partitions = await createPartitions(cwd);
    assert.deepEqual(
      partitions.map((partition) => partition.target),
      [".", "packages/a", "packages/a/nested", "packages/b"],
    );
    assert.ok(partitions[1].ignores.includes("packages/a/nested/**"));
    assert.equal(await runESLintSarif({ cwd }), 1);
    const sarif = JSON.parse(
      await readFile(join(cwd, "eslint-results.sarif"), "utf8"),
    );
    assert.equal(sarif.runs.length, 1);
    assert.equal(sarif.runs[0].tool.driver.version, ESLint.version);
    assert.equal(sarif.runs[0].results.length, sources.length);
    const baseline = await new ESLint({ cwd }).lintFiles(".");
    const actualPaths = await Promise.all(
      sarif.runs[0].artifacts.map((artifact) =>
        realpath(fileURLToPath(artifact.location.uri)),
      ),
    );
    const expectedPaths = await Promise.all(
      baseline.map((result) => realpath(result.filePath)),
    );
    assert.deepEqual(actualPaths.sort(), expectedPaths.sort());
    const uris = sarif.runs[0].results.map(
      (result) => result.locations[0].physicalLocation.artifactLocation.uri,
    );
    for (const name of sources)
      assert.ok(
        uris.some((uri) => uri.endsWith(`/${name}`)),
        name,
      );
    assert.ok(uris.every((uri) => !uri.includes("/ignored")));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("warning-only analysis fails with a complete single-run SARIF", async () => {
  const cwd = await fixture();
  try {
    await file(cwd, "warning.js", "const unused = 1;\n");
    assert.equal(await runESLintSarif({ cwd }), 1);
    const sarif = JSON.parse(
      await readFile(join(cwd, "eslint-results.sarif"), "utf8"),
    );
    assert.equal(sarif.runs[0].results[0].level, "warning");
    assert.equal(sarif.runs[0].results[0].ruleId, "no-unused-vars");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("empty workspaces do not fail an otherwise successful scan", async () => {
  const cwd = await fixture(["packages/*"]);
  try {
    await file(cwd, "packages/empty/package.json", "{}");
    await file(cwd, "root.js", "export const value = 1;\n");
    assert.equal(await runESLintSarif({ cwd }), 0);
    const sarif = JSON.parse(
      await readFile(join(cwd, "eslint-results.sarif"), "utf8"),
    );
    assert.deepEqual(sarif.runs[0].results, []);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("fatal parse errors remain failures and appear in SARIF notifications", async () => {
  const cwd = await fixture();
  try {
    await file(cwd, "invalid.js", "const = ;\n");
    assert.equal(await runESLintSarif({ cwd }), 1);
    const sarif = JSON.parse(
      await readFile(join(cwd, "eslint-results.sarif"), "utf8"),
    );
    const invocation = sarif.runs[0].invocations[0];
    assert.equal(invocation.executionSuccessful, false);
    assert.ok(invocation.toolConfigurationNotifications.length > 0);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("combining results rebuilds rule and artifact indices and rejects metadata conflicts", async () => {
  const cwd = await fixture();
  try {
    const left = lintReport(join(cwd, "left.js"), "no-debugger");
    const right = lintReport(join(cwd, "right.js"), "no-alert");
    const run = JSON.parse(combineLintReports([left, right])).runs[0];
    assert.equal(run.results.length, 2);
    for (const result of run.results) {
      assert.equal(run.tool.driver.rules[result.ruleIndex].id, result.ruleId);
      const location = result.locations[0].physicalLocation.artifactLocation;
      assert.equal(run.artifacts[location.index].location.uri, location.uri);
    }
    const conflict = lintReport(join(cwd, "different.js"), "no-debugger");
    conflict.metadata.rulesMeta["no-debugger"].docs.description =
      "conflicting metadata";
    assert.throws(
      () => combineLintReports([left, conflict]),
      /Conflicting ESLint rule metadata/,
    );
    assert.throws(
      () => combineLintReports([left, left]),
      /duplicate ESLint file/,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("child crashes and missing reports fail closed and remove stale SARIF", async () => {
  for (const child of [
    { status: 2 },
    { status: null, signal: "SIGKILL" },
    { status: 0 },
  ]) {
    const cwd = await fixture();
    try {
      const output = join(cwd, "eslint-results.sarif");
      await writeFile(output, "stale");
      assert.equal(await runESLintSarif({ cwd, execute: () => child }), 2);
      await assert.rejects(readFile(output), { code: "ENOENT" });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }
});

test("all partitions still run after violations and receive zero-warning arguments", async () => {
  const cwd = await fixture(["packages/*"]);
  try {
    await file(cwd, "packages/a/package.json", "{}");
    let calls = 0;
    const status = await runESLintSarif({
      cwd,
      execute: (_command, args) => {
        assert.equal(args[args.indexOf("--max-warnings") + 1], "0");
        const reportFile = args[args.indexOf("--output-file") + 1];
        writeFileSync(
          reportFile,
          JSON.stringify(lintReport(join(cwd, `${calls++}.js`), "no-debugger")),
        );
        return { status: 1 };
      },
    });
    assert.equal(status, 1);
    assert.equal(calls, 2);
    assert.equal(
      JSON.parse(await readFile(join(cwd, "eslint-results.sarif"), "utf8"))
        .runs[0].results.length,
      2,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
