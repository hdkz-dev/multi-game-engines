#!/usr/bin/env node
/**
 * setup-trusted-publishers.mjs
 *
 * npm Trusted Publishers (OIDC) を全公開パッケージに一括設定する。
 * npm CLI 11.10.0+ の `npm trust github` コマンドを使用。
 *
 * 実行後は NPM_TOKEN (Granular Token) を GitHub Secrets から削除できる。
 *
 * 前提条件:
 *   - npm CLI 11.10.0 以上 (Node 22.14.0+ に同梱)
 *   - 全パッケージが npm に publish 済み
 *   - NPM_TOKEN または NODE_AUTH_TOKEN 環境変数が設定済み
 *
 * 使い方:
 *   NPM_TOKEN=npm_xxx node scripts/setup-trusted-publishers.mjs
 *   NPM_TOKEN=npm_xxx node scripts/setup-trusted-publishers.mjs --dry-run
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const REPO = "hdkz-dev/multi-game-engines";
const WORKFLOW_FILE = "release.yml";
const DRY_RUN = process.argv.includes("--dry-run");

// ── トークン確認 ──────────────────────────────────────────
const token = process.env.NPM_TOKEN ?? process.env.NODE_AUTH_TOKEN;
if (!token) {
  console.error("❌ NPM_TOKEN または NODE_AUTH_TOKEN 環境変数を設定してください。");
  console.error("   例: NPM_TOKEN=npm_xxx node scripts/setup-trusted-publishers.mjs");
  process.exit(1);
}

// ── npm バージョン確認 ─────────────────────────────────────
const npmVersionResult = spawnSync("npm", ["--version"], { encoding: "utf8" });
const npmVersion = npmVersionResult.stdout.trim();
const [major, minor] = npmVersion.split(".").map(Number);
if (major < 11 || (major === 11 && minor < 10)) {
  console.error(`❌ npm ${npmVersion} は非対応です。npm 11.10.0 以上が必要です。`);
  console.error("   Node 22.14.0 以上をインストールしてください。");
  process.exit(1);
}
console.log(`✅ npm ${npmVersion} — npm trust コマンドを使用します。\n`);

// ── 一時 .npmrc を設定（認証用）──────────────────────────
const localNpmrc = join(root, ".npmrc");
const hadLocalNpmrc = existsSync(localNpmrc);
const originalContent = hadLocalNpmrc ? readFileSync(localNpmrc, "utf8") : null;
const needsNpmrc = !hadLocalNpmrc || !originalContent?.includes("_authToken");

if (needsNpmrc) {
  writeFileSync(localNpmrc, `//registry.npmjs.org/:_authToken=${token}\n`, "utf8");
}

function cleanup() {
  if (!needsNpmrc) return;
  if (hadLocalNpmrc && originalContent !== null) {
    writeFileSync(localNpmrc, originalContent, "utf8");
  } else if (!hadLocalNpmrc && existsSync(localNpmrc)) {
    unlinkSync(localNpmrc);
  }
}

// ── 公開パッケージ一覧を取得 ─────────────────────────────
async function getPublicPackages() {
  const packagesDir = join(root, "packages");
  const dirs = await readdir(packagesDir);
  const packages = [];

  for (const dir of dirs) {
    const pkgJsonPath = join(packagesDir, dir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    if (!pkg.private && pkg.name?.startsWith("@multi-game-engines/")) {
      packages.push(pkg.name);
    }
  }
  return packages.sort();
}

// ── npm trust github を実行 ───────────────────────────────
function trustPackage(packageName) {
  const args = [
    "trust", "github", packageName,
    "--repo", REPO,
    "--file", WORKFLOW_FILE,
    "--yes",
  ];

  if (DRY_RUN) {
    console.log(`  [dry-run] npm ${args.join(" ")}`);
    return true;
  }

  const result = spawnSync("npm", args, {
    encoding: "utf8",
    stdio: "pipe",
    cwd: root,
    env: { ...process.env, NODE_AUTH_TOKEN: token },
  });

  if (result.status === 0) {
    return true;
  } else {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    console.error(`  ❌ 失敗: ${stderr || stdout || `exit code ${result.status}`}`);
    return false;
  }
}

// ── メイン ───────────────────────────────────────────────
try {
  if (DRY_RUN) {
    console.log("🧪 ドライランモード（実際の変更はありません）\n");
  }

  const packages = await getPublicPackages();
  console.log(`📦 対象パッケージ: ${packages.length} 件`);
  console.log(`🔗 リポジトリ: ${REPO}`);
  console.log(`⚙️  ワークフロー: ${WORKFLOW_FILE}\n`);

  const failed = [];
  const skipped = [];

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${packages.length}] ${pkg} ... `);

    // 既存の設定を確認
    const listResult = spawnSync("npm", ["trust", "list", pkg, "--json"], {
      encoding: "utf8",
      stdio: "pipe",
      cwd: root,
      env: { ...process.env, NODE_AUTH_TOKEN: token },
    });

    if (listResult.status === 0) {
      try {
        const existing = JSON.parse(listResult.stdout);
        const alreadySet = Array.isArray(existing) && existing.some(
          (e) => e.type === "github" &&
                 e.repository === REPO &&
                 e.workflow === WORKFLOW_FILE,
        );
        if (alreadySet && !DRY_RUN) {
          console.log("⏭  already configured");
          skipped.push(pkg);
          continue;
        }
      } catch {
        // JSON parse 失敗は無視して続行
      }
    }

    const ok = trustPackage(pkg);
    if (ok) {
      console.log("✅ done");
    } else {
      failed.push(pkg);
    }
  }

  cleanup();

  console.log("\n────────────────────────────────────────");
  const configured = packages.length - failed.length - skipped.length;
  if (skipped.length > 0) console.log(`⏭  既設定: ${skipped.length} 件`);
  if (configured > 0)  console.log(`✅ 設定完了: ${configured} 件`);
  if (failed.length > 0) {
    console.log(`❌ 失敗: ${failed.length} 件`);
    for (const p of failed) console.log(`   - ${p}`);
    console.log("\n失敗したパッケージは以下を確認してください:");
    console.log("  1. npmjs.com でパッケージが公開済みか確認");
    console.log("  2. NPM_TOKEN に十分な権限があるか確認");
    process.exit(1);
  }

  if (!DRY_RUN) {
    console.log("\n🎉 全パッケージへの Trusted Publisher 設定が完了しました！");
    console.log("\n📋 次のステップ:");
    console.log("   1. release.yml の変更を確認して main にマージ");
    console.log("   2. Release ワークフローが OIDC で正常に publish できることを確認");
    console.log("   3. 確認後: GitHub Secrets から NPM_TOKEN を削除");
    console.log("      gh secret delete NPM_TOKEN");
    console.log("   4. npmjs.com の各パッケージ設定で");
    console.log('      "Require 2FA and disallow tokens" を有効化（任意・推奨）');
  }
} catch (err) {
  console.error("❌ 予期しないエラー:", err.message);
  cleanup();
  process.exit(1);
}
