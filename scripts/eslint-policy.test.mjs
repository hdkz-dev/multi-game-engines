import assert from "node:assert/strict";
import test from "node:test";
import { resolve, dirname } from "node:path";
import { ESLint, Linter } from "eslint";
import unicorn from "eslint-plugin-unicorn";
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
