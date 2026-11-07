import assert from "node:assert/strict";
import test from "node:test";
import { resolve, dirname, join } from "node:path";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { ESLint, Linter } from "eslint";
import unicorn from "eslint-plugin-unicorn";
import { importX } from "eslint-plugin-import-x";
import { unicornRules } from "../eslint-unicorn-policy.mjs";

// Independent baseline captured from the effective Unicorn 64 project config.
const previousRules = [
  "unicorn/consistent-assert",
  "unicorn/consistent-date-clone",
  "unicorn/consistent-empty-array-spread",
  "unicorn/consistent-existence-index-check",
  "unicorn/consistent-template-literal-escape",
  "unicorn/error-message",
  "unicorn/expiring-todo-comments",
  "unicorn/isolated-functions",
  "unicorn/new-for-builtins",
  "unicorn/no-abusive-eslint-disable",
  "unicorn/no-accessor-recursion",
  "unicorn/no-anonymous-default-export",
  "unicorn/no-array-method-this-argument",
  "unicorn/no-array-reverse",
  "unicorn/no-await-in-promise-methods",
  "unicorn/no-document-cookie",
  "unicorn/no-immediate-mutation",
  "unicorn/no-instanceof-builtins",
  "unicorn/no-invalid-fetch-options",
  "unicorn/no-invalid-remove-event-listener",
  "unicorn/no-lonely-if",
  "unicorn/no-magic-array-flat-depth",
  "unicorn/no-named-default",
  "unicorn/no-negation-in-equality-check",
  "unicorn/no-single-promise-in-promise-methods",
  "unicorn/no-thenable",
  "unicorn/no-unnecessary-array-flat-depth",
  "unicorn/no-unnecessary-array-splice-count",
  "unicorn/no-unnecessary-slice-end",
  "unicorn/no-unreadable-array-destructuring",
  "unicorn/no-useless-collection-argument",
  "unicorn/no-useless-error-capture-stack-trace",
  "unicorn/no-useless-iterator-to-array",
  "unicorn/number-literal-case",
  "unicorn/prefer-array-flat",
  "unicorn/prefer-array-flat-map",
  "unicorn/prefer-array-index-of",
  "unicorn/prefer-bigint-literals",
  "unicorn/prefer-class-fields",
  "unicorn/prefer-classlist-toggle",
  "unicorn/prefer-date-now",
  "unicorn/prefer-default-parameters",
  "unicorn/prefer-event-target",
  "unicorn/prefer-keyboard-event-key",
  "unicorn/prefer-math-min-max",
  "unicorn/prefer-math-trunc",
  "unicorn/prefer-object-from-entries",
  "unicorn/prefer-response-static-json",
  "unicorn/prefer-set-size",
  "unicorn/prefer-simple-condition-first",
  "unicorn/prefer-structured-clone",
  "unicorn/require-array-join-separator",
  "unicorn/require-module-attributes",
  "unicorn/require-module-specifiers",
  "unicorn/require-number-to-fixed-digits-argument",
  "unicorn/switch-case-break-position",
  "unicorn/template-indent",
  "unicorn/throw-new-error",
];

test("Unicorn migration preserves every previously enforced check across package configs", async () => {
  for (const file of [
    "packages/core/src/index.ts",
    "packages/ui-react/src/index.ts",
    "packages/ui-vue-monitor/src/index.ts",
    "examples/zenith-dashboard-react/src/App.tsx",
    ".pnpmfile.cjs",
  ]) {
    const absolute = resolve(file);
    const eslint = new ESLint({ cwd: dirname(absolute) });
    const config = await eslint.calculateConfigForFile(absolute);
    assert.ok(config, file);
    for (const rule of previousRules) {
      assert.equal(config.rules[rule][0], 2, `${file}: ${rule}`);
    }
  }
});

test("Unicorn policy rejects unsafe constructs and accepts safe equivalents", () => {
  const linter = new Linter();
  const config = { plugins: { unicorn }, rules: unicornRules };
  const fixtures = [
    [
      "unicorn/throw-new-error",
      "throw Error('failed');",
      "throw new Error('failed');",
    ],
    [
      "unicorn/error-message",
      "throw new Error();",
      "throw new Error('failed');",
    ],
    [
      "unicorn/no-chained-comparison",
      "const valid = 0 < value < 10;",
      "const valid = 0 < value && value < 10;",
    ],
    [
      "unicorn/no-async-iterator-callback",
      "Iterator.from(items).forEach(async () => {});",
      "for (const item of items) { await handle(item); }",
    ],
  ];
  for (const [rule, invalid, valid] of fixtures) {
    assert.ok(
      linter.verify(invalid, config).some((message) => message.ruleId === rule),
      rule,
    );
    assert.equal(
      linter.verify(valid, config).filter((message) => message.ruleId === rule)
        .length,
      0,
      rule,
    );
  }
});

test("internal import restrictions retain allow and forbid glob behavior with minimatch 11", () => {
  const linter = new Linter();
  function check(source, options) {
    return linter.verify(
      source,
      {
        plugins: { "import-x": importX },
        rules: { "import-x/no-internal-modules": ["error", options] },
      },
      { filename: resolve("import-contract.mjs") },
    );
  }
  assert.equal(
    check('import helper from "./scripts/validation.test.mjs";', {
      allow: ["**/validation.test.mjs"],
    }).length,
    0,
  );
  assert.equal(
    check('import helper from "./scripts/doc-sync.js";', {
      allow: ["**/validation.test.mjs"],
    }).length,
    1,
  );
  assert.equal(
    check('import helper from "./scripts/doc-sync.js";', {
      forbid: ["**/doc-sync.js"],
    }).length,
    1,
  );
  assert.equal(
    check('import helper from "./scripts/validation.test.mjs";', {
      forbid: ["**/doc-sync.js"],
    }).length,
    0,
  );
});

test("internal import restrictions do not loosen for hidden files or negated globs", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mge-import-boundary-"));
  try {
    for (const folder of ["private", "other"]) {
      await mkdir(join(dir, folder));
      for (const file of ["public.js", ".secret.js"]) {
        await writeFile(join(dir, folder, file), "export default 1;\n");
      }
    }
    await writeFile(join(dir, "other/private"), "export default 1;\n");
    const linter = new Linter({ cwd: dir });
    const cases = [
      ["other/private", { forbid: ["**/private/**"] }, 1],
      ["other/private", { allow: ["!**/private/**"] }, 1],
      ["private/public.js", { forbid: ["**/private/**"] }, 1],
      ["private/.secret.js", { forbid: ["**/private/**"] }, 1],
      ["private/public.js", { allow: ["**/private/**"] }, 0],
      ["private/.secret.js", { allow: ["**/private/**"] }, 1],
      ["private/.secret.js", { allow: ["**/private/.*"] }, 0],
      ["private/.secret.js", { allow: ["!**/private/**"] }, 1],
      ["private/public.js", { forbid: ["!**/private/**"] }, 0],
      ["private/.secret.js", { forbid: ["!**/private/**"] }, 1],
      ["private/.secret.js", { forbid: ["!**/private/*"] }, 1],
      ["other/public.js", { forbid: ["!**/private/**"] }, 1],
    ];
    for (const [path, options, violations] of cases) {
      const messages = linter.verify(
        `import value from "./${path}";`,
        {
          plugins: { "import-x": importX },
          rules: { "import-x/no-internal-modules": ["error", options] },
        },
        { filename: join(dir, "entry.mjs") },
      );
      assert.equal(
        messages.length,
        violations,
        JSON.stringify({ path, options, messages }),
      );
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("locked SARIF formatter reports the invoking ESLint and real violations", () => {
  const require = createRequire(import.meta.url);
  const cli = join(
    dirname(require.resolve("eslint/package.json")),
    "bin/eslint.js",
  );
  const result = spawnSync(
    process.execPath,
    [
      cli,
      "--no-config-lookup",
      "--no-ignore",
      "--rule",
      "no-debugger:error",
      "--stdin",
      "--stdin-filename",
      "sarif-contract.js",
      "--format",
      "@microsoft/eslint-formatter-sarif",
    ],
    { input: "debugger;\n", encoding: "utf8" },
  );
  assert.equal(result.status, 1, result.stderr);
  const sarif = JSON.parse(result.stdout);
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].tool.driver.name, "ESLint");
  assert.equal(sarif.runs[0].tool.driver.version, ESLint.version);
  assert.equal(sarif.runs[0].results[0].ruleId, "no-debugger");
});
