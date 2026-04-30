#!/usr/bin/env node
/**
 * setup-trusted-publishers.mjs
 *
 * npm Trusted Publishers (OIDC) を全公開パッケージに一括設定する。
 * npm CLI 11.10.0+ の `npm trust github` コマンドを使用。
 *
 * 2FA 方式:
 *   - TOTP: --otp <code> を指定
 *   - パスキー / WebAuthn: 引数不要。ブラウザ認証 URL が自動表示されます
 *
 * 実行後は NPM_TOKEN を GitHub Secrets から削除できる。
 *
 * 使い方:
 *   node scripts/setup-trusted-publishers.mjs          # パスキー (ブラウザ認証)
 *   node scripts/setup-trusted-publishers.mjs --otp <6桁コード>   # TOTP
 *   node scripts/setup-trusted-publishers.mjs --dry-run
 *
 * OTP が途中で切れた場合は新しいコードで再実行（設定済みはスキップされます）:
 *   node scripts/setup-trusted-publishers.mjs --otp <新コード>
 */

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const REPO = "hdkz-dev/multi-game-engines";
const WORKFLOW_FILE = "release.yml";
const DRY_RUN = process.argv.includes("--dry-run");

const otpIdx = process.argv.indexOf("--otp");
const otp = otpIdx !== -1 ? process.argv[otpIdx + 1] : null;

// ── npm バージョン確認 ─────────────────────────────────────
const npmVersion = spawnSync("npm", ["--version"], { encoding: "utf8" }).stdout.trim();
const [major, minor] = npmVersion.split(".").map(Number);
if (major < 11 || (major === 11 && minor < 10)) {
  console.error(`❌ npm ${npmVersion} — npm 11.10.0 以上が必要です`); process.exit(1);
}
console.log(`✅ npm ${npmVersion}`);

// ── npm whoami ─────────────────────────────────────────────
const whoami = spawnSync("npm", ["whoami"], { encoding: "utf8", stdio: "pipe" });
if (whoami.status !== 0) {
  console.error("❌ 未認証。先に npm login を実行してください。"); process.exit(1);
}
console.log(`👤 npm ユーザー: ${whoami.stdout.trim()}\n`);

// ── パッケージ一覧 ────────────────────────────────────────
async function getPublicPackages() {
  const packagesDir = join(root, "packages");
  const dirs = await readdir(packagesDir);
  return dirs
    .map((dir) => {
      const p = join(packagesDir, dir, "package.json");
      if (!existsSync(p)) return null;
      const pkg = JSON.parse(readFileSync(p, "utf8"));
      return (!pkg.private && pkg.name?.startsWith("@multi-game-engines/")) ? pkg.name : null;
    })
    .filter(Boolean).sort();
}

// ── 設定済み確認（pipe モードで静かに確認）─────────────────
function isAlreadyConfigured(pkg) {
  const args = ["trust", "list", pkg, "--json"];
  if (otp) args.push("--otp", otp);
  const r = spawnSync("npm", args, { encoding: "utf8", stdio: "pipe", cwd: root });
  if (r.status !== 0) return false;
  try {
    const list = JSON.parse(r.stdout);
    return Array.isArray(list) && list.some(
      (e) => e.type === "github" && e.repository === REPO && e.workflow === WORKFLOW_FILE,
    );
  } catch { return false; }
}

// ── npm trust github 実行 ─────────────────────────────────
// パスキーの場合: stdio: "inherit" で認証 URL をターミナルに表示し、
// ブラウザで認証完了するまで npm CLI が自動待機する。
function trustPackage(pkg) {
  const args = ["trust", "github", pkg, "--repo", REPO, "--file", WORKFLOW_FILE, "--yes"];
  if (otp) args.push("--otp", otp);

  if (DRY_RUN) {
    console.log(`  [dry-run] npm ${args.map((a) => (a === otp ? "***" : a)).join(" ")}`);
    return { ok: true };
  }

  // inherit: ブラウザ認証 URL がターミナルに表示され、認証完了まで待機
  const result = spawnSync("npm", args, { stdio: "inherit", cwd: root });
  return { ok: result.status === 0, status: result.status };
}

// ── メイン ───────────────────────────────────────────────
const packages = await getPublicPackages();

console.log(`📦 対象: ${packages.length} 件`);
console.log(`🔗 ${REPO}  /  ⚙️  ${WORKFLOW_FILE}`);
if (!otp && !DRY_RUN) {
  console.log("\n🔐 パスキー認証モード");
  console.log("   各パッケージで認証 URL が表示されます。");
  console.log("   ブラウザで URL を開いてパスキーで認証してください。\n");
}
if (DRY_RUN) console.log("🧪 ドライランモード\n");
else console.log();

let configured = 0, skipped = 0;
const failed = [];

for (let i = 0; i < packages.length; i++) {
  const pkg = packages[i];
  console.log(`[${String(i + 1).padStart(2)}/${packages.length}] ${pkg}`);

  if (!DRY_RUN && isAlreadyConfigured(pkg)) {
    console.log("  ⏭  already configured\n");
    skipped++;
    continue;
  }

  const { ok } = trustPackage(pkg);
  if (ok) {
    console.log("  ✅ done\n");
    configured++;
  } else {
    console.log("  ❌ failed\n");
    failed.push(pkg);
  }
}

console.log("────────────────────────────────────────");
if (skipped > 0)    console.log(`⏭  既設定スキップ: ${skipped} 件`);
if (configured > 0) console.log(`✅ 設定完了: ${configured} 件`);
if (failed.length)  {
  console.log(`❌ 失敗: ${failed.length} 件`);
  for (const p of failed) console.log(`   - ${p}`);
  process.exit(1);
}

if (!DRY_RUN && configured + skipped === packages.length) {
  console.log("\n🎉 全パッケージへの Trusted Publisher 設定が完了しました！");
  console.log("\n📋 次のステップ:");
  console.log("   1. Dependabot PR をマージし Release ワークフローが OIDC で publish できることを確認");
  console.log("   2. gh secret delete NPM_TOKEN");
  console.log('   3. npmjs.com 各パッケージ設定で "Require 2FA and disallow tokens" を有効化（推奨）');
}
