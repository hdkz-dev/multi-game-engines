import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import storybook from "eslint-plugin-storybook";
import lit from "eslint-plugin-lit";
import wc from "eslint-plugin-wc";
import importX from "eslint-plugin-import-x";
import promise from "eslint-plugin-promise";
import unicorn from "eslint-plugin-unicorn";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tsdoc from "eslint-plugin-tsdoc";
import noOnlyTests from "eslint-plugin-no-only-tests";
import vitest from "@vitest/eslint-plugin";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/.next/**",
      "**/*.config.ts",
      "**/*.config.mjs",
      "**/*.config.js",
      "**/next-env.d.ts",
      "fixtures/shared-mocks/**",
      "**/.storybook/**",
      "**/coverage/**",
      "**/scripts/**",
      "**/tsup.config.bundled_*",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  lit.configs["flat/recommended"],
  wc.configs["flat/recommended"],
  // Import-x Configuration
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      "import-x/resolver": {
        typescript: true,
      },
    },
  },
  // Promise Configuration
  {
    ...promise.configs["flat/recommended"],
    rules: {
      ...promise.configs["flat/recommended"].rules,
      "promise/always-return": "off",
    },
  },
  // Unicorn Configuration
  {
    ...unicorn.configs["flat/recommended"],
    rules: {
      ...unicorn.configs["flat/recommended"].rules,
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/prefer-module": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/prefer-add-event-listener": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/prefer-dom-node-dataset": "off",
      "unicorn/prefer-query-selector": "off",
      "unicorn/explicit-length-check": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/prefer-native-coercion-functions": "off",
      "unicorn/catch-error-name": "off",
      "unicorn/prefer-string-slice": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-new-array": "off",
      "unicorn/prefer-spread": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/prefer-node-protocol": "off",
      "unicorn/prefer-number-properties": "off",
      "unicorn/numeric-separators-style": "off",
      "unicorn/prefer-optional-catch-binding": "off",
      "unicorn/prefer-reflect-apply": "off",
      "unicorn/prefer-set-has": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/prefer-type-error": "off",
      "unicorn/prefer-global-this": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/no-object-as-default-parameter": "off",
      "unicorn/prefer-array-find": "off",
      "unicorn/prefer-array-some": "off",
      "unicorn/prefer-at": "off",
      "unicorn/prefer-dom-node-append": "off",
      "unicorn/prefer-dom-node-remove": "off",
      "unicorn/prefer-export-from": "off",
      "unicorn/prefer-includes": "off",
      "unicorn/prefer-json-parse-buffer": "off",
      "unicorn/prefer-logical-operator-over-ternary": "off",
      "unicorn/prefer-modern-dom-apis": "off",
      "unicorn/prefer-modern-math-apis": "off",
      "unicorn/prefer-negative-index": "off",
      "unicorn/prefer-negative-reverse": "off",
      "unicorn/prefer-regexp-test": "off",
      "unicorn/prefer-string-starts-ends-with": "off",
      "unicorn/prefer-string-trim-start-end": "off",
      "unicorn/no-useless-undefined": "off",
      "unicorn/no-zero-fractions": "off",
      "unicorn/prefer-number-is-integer": "off",
      "unicorn/prefer-switch": "off",
      "unicorn/no-await-expression-member": "off",
      "unicorn/prefer-code-point": "off",
      "unicorn/no-array-push-push": "off",
      "unicorn/switch-case-braces": "off",
      "unicorn/import-style": "off",
      "unicorn/no-static-only-class": "off",
      "unicorn/no-unnecessary-await": "off",
      "unicorn/no-useless-fallback-in-spread": "off",
      "unicorn/no-useless-length-check": "off",
      "unicorn/no-useless-promise-resolve-reject": "off",
      "unicorn/no-useless-spread": "off",
      "unicorn/no-useless-switch-case": "off",
      "unicorn/prefer-prototype-methods": "off",
      "unicorn/text-encoding-identifier-case": "off",
      "unicorn/prefer-single-call": "off",
      "unicorn/no-for-loop": "off",
      "unicorn/prefer-blob-reading-methods": "off",
      "unicorn/no-unreadable-iife": "off",
      "unicorn/no-negated-condition": "off",
      "unicorn/escape-case": "off",
      "unicorn/no-hex-escape": "off",
      "unicorn/prefer-string-raw": "off",
      "unicorn/no-new-buffer": "off",
      "unicorn/prefer-dom-node-text-content": "off",
      "unicorn/empty-brace-spaces": "off",
      "unicorn/no-console-spaces": "off",
      "unicorn/no-typeof-undefined": "off",
      "unicorn/no-unnecessary-polyfills": "off",
      "unicorn/relative-url-style": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/no-this-assignment": "off",
      "unicorn/no-empty-file": "off",
    },
  },
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      "jsx-a11y/interactive-supports-focus": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "tsdoc/syntax": "warn",
      "import-x/no-unresolved": "off",
      "import-x/no-cycle": "error",
      "import-x/no-self-import": "error",
      "import-x/default": "off",
      "promise/param-names": "off",
    },
  },
  {
    files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
    plugins: {
      storybook,
    },
    rules: {
      "storybook/no-renderer-packages": "off",
    },
  },
  {
    files: ["**/*.{test,spec}.ts", "**/*.{test,spec}.tsx"],
    plugins: {
      vitest,
      "no-only-tests": noOnlyTests,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "no-only-tests/no-only-tests": "error",
      "vitest/no-conditional-expect": "off",
      "vitest/no-commented-out-tests": "warn",
      "vitest/expect-expect": "off",
    },
  },
];
