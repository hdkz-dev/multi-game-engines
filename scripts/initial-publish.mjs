#!/usr/bin/env node
/**
 * initial-publish.mjs
 *
 * 初回 npm publish 専用スクリプト。
 * パッケージが npm に存在しない状態での初回登録に使います。
 *
 * 実行後は setup-trusted-publishers.mjs を実行して OIDC に完全移行してください。
 *
 * 使い方:
 *   NPM_TOKEN=npm_xxx node scripts/initial-publish.mjs
 *
 * または:
 *   export NPM_TOKEN=npm_xxx
 *   pnpm npm:initial-publish
 */

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ────────────────────────────────────────────────
// トークン確認
// ────────────────────────────────────────────────
const token = process.env.NPM_TOKEN;
if (!token) {
  console.error("❌ NPM_TOKEN 環境変数が設定されていません。");
  console.error("   例: NPM_TOKEN=npm_xxx node scripts/initial-publish.mjs");
  process.exit(1);
}

console.log("🔍 環境確認中...");

// Node.js バージョン確認（npm v11.5.1+ が必要）
const nodeVersion = process.version;
console.log(`   Node.js: ${nodeVersion}`);

// npm バージョン確認
const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
console.log(`   npm: ${npmVersion}`);

const [major, minor, patch] = npmVersion.split(".").map(Number);
const npmOk = major > 11 || (major === 11 && minor >= 5);
if (!npmOk) {
  console.warn(
    `   ⚠️  npm ${npmVersion} は古い可能性があります。11.5.1 以上を推奨。`,
  );
}

// ────────────────────────────────────────────────
// .npmrc を一時的に設定
// ────────────────────────────────────────────────
const localNpmrc = join(root, ".npmrc");
const hadLocalNpmrc = existsSync(localNpmrc);
const originalContent = hadLocalNpmrc
  ? readFileSync(localNpmrc, "utf8")
  : null;

console.log("\n📝 .npmrc を一時設定中...");
writeFileSync(
  localNpmrc,
  `//registry.npmjs.org/:_authToken=${token}\n`,
  "utf8",
);

// ────────────────────────────────────────────────
// publish 実行
// ────────────────────────────────────────────────
let success = false;
try {
  console.log("\n🚀 changeset publish を実行中...\n");
  execSync("pnpm changeset publish", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_AUTH_TOKEN: token,
    },
  });
  success = true;
} catch (err) {
  console.error("\n❌ publish に失敗しました:", err.message);
} finally {
  // .npmrc を元に戻す
  if (hadLocalNpmrc && originalContent !== null) {
    writeFileSync(localNpmrc, originalContent, "utf8");
    console.log("\n🧹 .npmrc を元の状態に復元しました。");
  } else if (!hadLocalNpmrc && existsSync(localNpmrc)) {
    const { unlinkSync } = await import("node:fs");
    unlinkSync(localNpmrc);
    console.log("\n🧹 一時 .npmrc を削除しました。");
  }
}

if (!success) process.exit(1);

// ────────────────────────────────────────────────
// 成功後のガイド
// ────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
console.log("✅ 初回 publish 完了！");
console.log("\n📋 次のステップ:");
console.log("   1. npm login");
console.log("   2. pnpm npm:setup-oidc   # Trusted Publisher を一括設定");
console.log("   3. npmjs.com で Granular Token を削除（不要になります）");
console.log(
  "   4. 以降の publish は GitHub Actions の release.yml が自動実行",
);
