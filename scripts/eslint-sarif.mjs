import { spawnSync } from "node:child_process";
import console from "node:console";
import {
  glob,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { gzipSync } from "node:zlib";
import { ESLint } from "eslint";

const require = createRequire(import.meta.url);
const eslintCli = join(
  dirname(require.resolve("eslint/package.json")),
  "bin/eslint.js",
);
const formatter = require("@microsoft/eslint-formatter-sarif");

function escapePattern(path) {
  return path.replaceAll(/([!#()*?{}[\]\\])/g, "\\$1");
}

export async function createPartitions(cwd) {
  const manifest = JSON.parse(
    await readFile(join(cwd, "package.json"), "utf8"),
  );
  const patterns = manifest.workspaces ?? [];
  if (
    !Array.isArray(patterns) ||
    patterns.some((pattern) => typeof pattern !== "string")
  ) {
    throw new TypeError("Expected a package.json workspaces array");
  }
  const workspaceRoots = new Set();
  for await (const file of glob(
    patterns.map((pattern) => `${pattern}/package.json`),
    { cwd },
  )) {
    const root = relative(cwd, resolve(cwd, dirname(file)));
    if (!root || root === ".." || root.startsWith(`..${sep}`)) {
      throw new Error(`Workspace is not a child of the repository: ${file}`);
    }
    workspaceRoots.add(root.split(sep).join("/"));
  }
  const roots = [...workspaceRoots].sort();
  return [".", ...roots].map((target) => ({
    target,
    ignores: roots
      .filter(
        (root) =>
          root !== target && (target === "." || root.startsWith(`${target}/`)),
      )
      .map((root) => `${escapePattern(root)}/**`),
  }));
}

export function combineLintReports(reports) {
  const results = [];
  const rulesMeta = Object.create(null);
  const files = new Set();
  for (const report of reports) {
    if (!Array.isArray(report.results) || !report.metadata?.rulesMeta) {
      throw new TypeError(
        "ESLint did not return JSON results and rules metadata",
      );
    }
    for (const result of report.results) {
      if (typeof result.filePath !== "string" || files.has(result.filePath)) {
        throw new Error(`Missing or duplicate ESLint file: ${result.filePath}`);
      }
      files.add(result.filePath);
      results.push(result);
    }
    for (const [id, meta] of Object.entries(report.metadata.rulesMeta)) {
      if (
        Object.hasOwn(rulesMeta, id) &&
        !isDeepStrictEqual(rulesMeta[id], meta)
      ) {
        throw new Error(`Conflicting ESLint rule metadata: ${id}`);
      }
      rulesMeta[id] = meta;
    }
  }
  const sarif = JSON.parse(formatter(results, { rulesMeta }));
  if (sarif.runs.length !== 1)
    throw new Error("Expected exactly one SARIF run");
  sarif.runs[0].tool.driver.version = ESLint.version;
  if (
    sarif.runs[0].results.length > 25_000 ||
    sarif.runs[0].tool.driver.rules.length > 25_000
  ) {
    throw new Error("SARIF exceeds GitHub's per-run result or rule limit");
  }
  const output = `${JSON.stringify(sarif)}\n`;
  if (gzipSync(output).length > 10_000_000)
    throw new Error("SARIF exceeds GitHub's compressed size limit");
  return output;
}

export async function runESLintSarif({
  cwd = process.cwd(),
  outputFile = "eslint-results.sarif",
  execute = spawnSync,
} = {}) {
  cwd = resolve(cwd);
  outputFile = resolve(cwd, outputFile);
  await rm(outputFile, { force: true });
  const partitions = await createPartitions(cwd);
  const temporary = await mkdtemp(join(tmpdir(), "mge-eslint-sarif-"));
  const reports = [];
  let status = 0;
  try {
    for (const [index, { target, ignores }] of partitions.entries()) {
      const reportFile = join(temporary, `${index}.json`);
      const args = [
        eslintCli,
        target,
        "--max-warnings",
        "0",
        "--no-error-on-unmatched-pattern",
        "--format",
        "json-with-metadata",
        "--output-file",
        reportFile,
      ];
      for (const pattern of ignores) args.push("--ignore-pattern", pattern);
      console.log(
        `ESLint partition ${index + 1}/${partitions.length}: ${target}`,
      );
      const child = execute(process.execPath, args, {
        cwd,
        env: process.env,
        stdio: "inherit",
      });
      if (
        child.error ||
        child.signal ||
        (child.status !== 0 && child.status !== 1)
      ) {
        console.error(
          `ESLint failed to analyze ${target}: ${child.error?.message ?? child.signal ?? child.status}`,
        );
        status = 2;
        continue;
      }
      status = Math.max(status, child.status);
      try {
        reports.push(JSON.parse(await readFile(reportFile, "utf8")));
      } catch (error) {
        console.error(`Invalid ESLint report for ${target}: ${error.message}`);
        status = 2;
      }
    }
    if (status !== 2) {
      const output = combineLintReports(reports);
      await mkdir(dirname(outputFile), { recursive: true });
      await writeFile(outputFile, output);
    }
    return status;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== "--output-file")) {
      throw new Error(
        "Usage: node scripts/eslint-sarif.mjs [--output-file path]",
      );
    }
    process.exitCode = await runESLintSarif({ outputFile: args[1] });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
