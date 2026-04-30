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
 *   - npm login 済み (npm whoami が成功すること)
 *   - 2FA (auth-and-writes) が有効な場合は --otp <code> が必要
 *
 * 使い方:
 *   node scripts/setup-trusted-publishers.mjs --otp <TOTP-code>
 *   node scripts/setup-trusted-publishers.mjs --dry-run
 */

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const REPO = "hdkz-dev/multi-game-engines";
const WORKFLOW_FILE = "release.yml";
const DRY_RUN = process.argv.includes("--dry-run");

// --otp <code> 引数を取得
const otpIdx = process.argv.indexOf("--otp");
let currentOtp = otpIdx !== -1 ? process.argv[otpIdx + 1] : null;

// ── npm バージョン確認 ─────────────────────────────────────
const npmVersionResult = spawnSync("npm", ["--version"], { encoding: "utf8" });
const npmVersion = npmVersionResult.stdout.trim();
const [major, minor] = npmVersion.split(".").map(Number);
if (major < 11 || (major === 11 && minor < 10)) {
  console.error(`❌ npm ${npmVersion} は非対応です。npm 11.10.0 以上が必要です。`);
  process.exit(1);
}
console.log(`✅ npm ${npmVersion}\n`);

// ── npm whoami で認証確認 ──────────────────────────────────
const whoami = spawnSync("npm", ["whoami"], { encoding: "utf8", stdio: "pipe" });
if (whoami.status !== 0) {
  console.error("❌ npm に認証されていません。先に npm login を実行してください。");
  process.exit(1);
}
console.log(`👤 npm ユーザー: ${whoami.stdout.trim()}\n`);

// ── OTP 入力プロンプト ─────────────────────────────────────
const rl = readline.createInterface({ input, output });

async function promptOtp(reason = "") {
  if (DRY_RUN) return "000000";
  if (reason) console.log(`\n⏰ ${reason}`);
  const code = await rl.question("🔑 認証アプリの OTP コードを入力してください: ");
  return code.trim();
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

// ── npm trust github を実行（OTP ローテーション対応）────────
function runTrust(packageName, otp) {
  const args = [
    "trust", "github", packageName,
    "--repo", REPO,
    "--file", WORKFLOW_FILE,
    "--yes",
  ];
  if (otp) args.push("--otp", otp);

  if (DRY_RUN) {
    console.log(`  [dry-run] npm ${args.filter((a) => a !== otp).join(" ")} --otp ***`);
    return { ok: true, needOtp: false };
  }

  const result = spawnSync("npm", args, {
    encoding: "utf8",
    stdio: "pipe",
    cwd: root,
  });

  if (result.status === 0) {
    return { ok: true, needOtp: false };
  }

  const stderr = result.stderr ?? "";
  const isOtpError = stderr.includes("EOTP") || stderr.includes("one-time password");
  return { ok: false, needOtp: isOtpError, error: stderr.trim().split("\n")[0] };
}

function checkAlreadyConfigured(packageName) {
  const args = ["trust", "list", packageName, "--json"];
  if (currentOtp) args.push("--otp", currentOtp);

  const result = spawnSync("npm", args, {
    encoding: "utf8", stdio: "pipe", cwd: root,
  });
  if (result.status !== 0) return false; // 確認できない場合はスキップしない

  try {
    const list = JSON.parse(result.stdout);
    return Array.isArray(list) && list.some(
      (e) => e.type === "github" &&
               e.repository === REPO &&
               e.workflow === WORKFLOW_FILE,
    );
  } catch {
    return false;
  }
}

// ── メイン ───────────────────────────────────────────────
try {
  if (DRY_RUN) console.log("🧪 ドライランモード（実際の変更はありません）\n");

  // OTP が未指定かつ 2FA 有効の場合は最初に取得
  if (!currentOtp && !DRY_RUN) {
    currentOtp = await promptOtp("2FA が有効なため OTP が必要です。");
  }

  const packages = await getPublicPackages();
  console.log(`\n📦 対象パッケージ: ${packages.length} 件`);
  console.log(`🔗 リポジトリ: ${REPO}`);
  console.log(`⚙️  ワークフロー: ${WORKFLOW_FILE}\n`);

  const failed = [];
  const skipped = [];

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${packages.length}] ${pkg} ... `);

    // 既存設定確認（失敗しても続行）
    if (!DRY_RUN && checkAlreadyConfigured(pkg)) {
      console.log("⏭  already configured");
      skipped.push(pkg);
      continue;
    }

    // 最大2回リトライ（OTP 更新のため）
    let attempt = 0;
    let done = false;
    while (attempt < 2 && !done) {
      const { ok, needOtp, error } = runTrust(pkg, currentOtp);
      if (ok) {
        console.log("✅ done");
        done = true;
      } else if (needOtp) {
        // OTP 切れ → 新しいコードを取得して1回リトライ
        console.log("⏰ OTP 切れ");
        currentOtp = await promptOtp("OTP の有効期限が切れました。新しいコードを入力してください。");
        attempt++;
      } else {
        console.log(`❌ ${error}`);
        failed.push(pkg);
        done = true;
      }
    }

    if (!done) {
      console.log("❌ OTP リトライ上限に達しました");
      failed.push(pkg);
    }
  }

  rl.close();
  console.log("\n────────────────────────────────────────");
  const configured = packages.length - failed.length - skipped.length;
  if (skipped.length > 0)  console.log(`⏭  既設定: ${skipped.length} 件`);
  if (configured > 0)      console.log(`✅ 設定完了: ${configured} 件`);
  if (failed.length > 0) {
    console.log(`❌ 失敗: ${failed.length} 件`);
    for (const p of failed) console.log(`   - ${p}`);
    process.exit(1);
  }

  if (!DRY_RUN && failed.length === 0) {
    console.log("\n🎉 全パッケージへの Trusted Publisher 設定が完了しました！");
    console.log("\n📋 次のステップ:");
    console.log("   1. Dependabot PR をマージして Release ワークフローが OIDC で publish できることを確認");
    console.log("   2. 確認後: gh secret delete NPM_TOKEN");
    console.log("   3. npmjs.com 各パッケージ設定で");
    console.log('      "Require 2FA and disallow tokens" を有効化（任意・推奨）');
  }
} catch (err) {
  rl.close();
  console.error("\n❌ 予期しないエラー:", err.message);
  process.exit(1);
}
