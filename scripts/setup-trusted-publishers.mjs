#!/usr/bin/env node
/**
 * setup-trusted-publishers.mjs
 *
 * npm Trusted Publishers (OIDC) を全公開パッケージに一括設定する。
 * npm CLI 11.10.0+ の `npm trust github` コマンドを使用。
 *
 * パスキー / WebAuthn 対応:
 *   EOTP が返ったら認証 URL をブラウザで自動オープンし、
 *   認証完了まで polling → 取得したトークンで全パッケージを処理する。
 *
 * 使い方:
 *   node scripts/setup-trusted-publishers.mjs
 *   node scripts/setup-trusted-publishers.mjs --dry-run
 *   node scripts/setup-trusted-publishers.mjs --otp <code>   # TOTP 利用者向け
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
const otpIdx = process.argv.indexOf("--otp");
let sessionOtp = otpIdx !== -1 ? process.argv[otpIdx + 1] : null;  // 共通 OTP/token

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

// ── ブラウザを開く (macOS / Linux 両対応) ───────────────────
function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "start"
    : "xdg-open";
  spawnSync(cmd, [url], { stdio: "ignore" });
}

// ── doneUrl を polling してトークンを取得 ────────────────────
async function pollForToken(doneUrl, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(doneUrl);
      if (res.status === 200) {
        const body = await res.json();
        if (body?.token) return body.token;
      }
    } catch { /* 接続エラーは無視 */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

// ── EOTP エラーから authUrl / doneUrl を抽出 ─────────────────
function parseEotpUrls(stderr) {
  const auth = stderr.match(/https:\/\/www\.npmjs\.com\/auth\/cli\/[^\s]+/)?.[0];
  const done = stderr.match(/https:\/\/registry\.npmjs\.org\/-\/v1\/done\?authId=[^\s]+/)?.[0];
  return { authUrl: auth ?? null, doneUrl: done ?? null };
}

// ── 一時 .npmrc 管理 ──────────────────────────────────────────
const localNpmrc = join(root, ".npmrc");
const origNpmrc = existsSync(localNpmrc) ? readFileSync(localNpmrc, "utf8") : null;

function setSessionToken(token) {
  writeFileSync(localNpmrc, `//registry.npmjs.org/:_authToken=${token}\n`, "utf8");
}

function restoreNpmrc() {
  if (origNpmrc !== null) writeFileSync(localNpmrc, origNpmrc, "utf8");
  else if (existsSync(localNpmrc)) unlinkSync(localNpmrc);
}

// ── npm trust github を実行 ───────────────────────────────────
async function trustPackage(pkg) {
  const args = ["trust", "github", pkg, "--repo", REPO, "--file", WORKFLOW_FILE, "--yes"];
  if (sessionOtp) args.push("--otp", sessionOtp);

  if (DRY_RUN) {
    console.log(`  [dry-run] npm trust github ${pkg} --repo ${REPO} --file ${WORKFLOW_FILE} --yes`);
    return true;
  }

  const result = spawnSync("npm", args, { encoding: "utf8", stdio: "pipe", cwd: root });

  if (result.status === 0) return true;

  const stderr = result.stderr ?? "";
  if (!stderr.includes("EOTP")) {
    const msg = stderr.split("\n").find((l) => l.startsWith("npm error")) ?? stderr;
    console.log(`  ❌ ${msg}`);
    return false;
  }

  // ── EOTP: ブラウザ認証フロー ─────────────────────────────
  const { authUrl, doneUrl } = parseEotpUrls(stderr);
  if (!authUrl || !doneUrl) {
    console.log("  ❌ 認証 URL を取得できませんでした");
    return false;
  }

  console.log(`  🌐 ブラウザで認証してください: ${authUrl}`);
  openBrowser(authUrl);
  process.stdout.write("  ⏳ 認証完了を待機中 ...");

  const token = await pollForToken(doneUrl);
  console.log();

  if (!token) {
    console.log("  ❌ 認証タイムアウト（120秒）");
    return false;
  }

  console.log("  🔑 認証完了、トークンを取得しました");
  sessionOtp = token;  // 後続パッケージで流用を試みる
  setSessionToken(token);

  // トークンで再試行
  const retry = spawnSync("npm", args.filter((a) => a !== "--otp"), {
    encoding: "utf8",
    stdio: "pipe",
    cwd: root,
  });

  if (retry.status === 0) return true;

  // トークンが --otp として使えない場合は NODE_AUTH_TOKEN で再試行
  const retry2 = spawnSync("npm", args.filter((a) => a !== "--otp" && a !== sessionOtp), {
    encoding: "utf8",
    stdio: "pipe",
    cwd: root,
    env: { ...process.env, NODE_AUTH_TOKEN: token },
  });

  if (retry2.status === 0) return true;

  const errMsg = (retry2.stderr ?? "").split("\n").find((l) => l.startsWith("npm error")) ?? "";
  console.log(`  ❌ 再試行失敗: ${errMsg}`);
  return false;
}

// ── 設定済み確認 ─────────────────────────────────────────────
function isAlreadyConfigured(pkg) {
  const args = ["trust", "list", pkg, "--json"];
  if (sessionOtp) args.push("--otp", sessionOtp);
  const r = spawnSync("npm", args, { encoding: "utf8", stdio: "pipe", cwd: root });
  if (r.status !== 0) return false;
  try {
    const list = JSON.parse(r.stdout);
    return Array.isArray(list) && list.some(
      (e) => e.type === "github" && e.repository === REPO && e.workflow === WORKFLOW_FILE,
    );
  } catch { return false; }
}

// ── パッケージ一覧 ────────────────────────────────────────────
async function getPublicPackages() {
  const dirs = await readdir(join(root, "packages"));
  return dirs
    .map((dir) => {
      const p = join(root, "packages", dir, "package.json");
      if (!existsSync(p)) return null;
      const pkg = JSON.parse(readFileSync(p, "utf8"));
      return (!pkg.private && pkg.name?.startsWith("@multi-game-engines/")) ? pkg.name : null;
    })
    .filter(Boolean).sort();
}

// ── メイン ───────────────────────────────────────────────────
const packages = await getPublicPackages();
console.log(`📦 対象: ${packages.length} 件  |  ${REPO}  /  ${WORKFLOW_FILE}`);
if (DRY_RUN) console.log("🧪 ドライランモード");
else console.log("🔐 パスキー認証: 初回認証のみブラウザが開きます（以降は流用を試みます）");
console.log();

let configured = 0, skipped = 0;
const failed = [];

try {
  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    console.log(`[${String(i + 1).padStart(2)}/${packages.length}] ${pkg}`);

    if (!DRY_RUN && isAlreadyConfigured(pkg)) {
      console.log("  ⏭  already configured\n");
      skipped++;
      continue;
    }

    const ok = await trustPackage(pkg);
    if (ok) { console.log("  ✅ done\n"); configured++; }
    else     { failed.push(pkg); }
  }
} finally {
  restoreNpmrc();
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
  console.log("   1. Dependabot PR をマージし Release が OIDC で publish できることを確認");
  console.log("   2. gh secret delete NPM_TOKEN");
  console.log('   3. npmjs.com 各パッケージ設定で "Require 2FA and disallow tokens" を有効化（推奨）');
}
