#!/usr/bin/env node
/**
 * sequential-publish.mjs
 *
 * E429 レートリミット対策のため、未 publish パッケージを1件ずつ順番に publish する。
 *
 * 使い方:
 *   NPM_TOKEN=npm_xxx node scripts/sequential-publish.mjs
 */

import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, existsSync, unlinkSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── トークン確認 ──────────────────────────────────────────
// NPM_TOKEN または NODE_AUTH_TOKEN のいずれかを受け付ける
const token = process.env.NPM_TOKEN ?? process.env.NODE_AUTH_TOKEN;
if (!token) {
  console.error("❌ NPM_TOKEN または NODE_AUTH_TOKEN 環境変数が設定されていません。");
  process.exit(1);
}

// ── .npmrc を一時作成（NODE_AUTH_TOKEN が既にセットされている場合はスキップ）──
// GitHub Actions の setup-node が既に .npmrc を設定している場合は上書きしない
const localNpmrc = join(root, ".npmrc");
const hadLocalNpmrc = existsSync(localNpmrc);
const originalContent = hadLocalNpmrc ? readFileSync(localNpmrc, "utf8") : null;
const needsNpmrc = !hadLocalNpmrc || !originalContent?.includes("_authToken");

if (needsNpmrc) {
  writeFileSync(localNpmrc, `//registry.npmjs.org/:_authToken=${token}\n`, "utf8");
  console.log("📝 .npmrc を一時設定しました。\n");
} else {
  console.log("📝 .npmrc は既に認証設定済みです（上書きしません）。\n");
}

function cleanup() {
  if (!needsNpmrc) return; // 上書きしなかった場合は何もしない
  if (hadLocalNpmrc && originalContent !== null) {
    writeFileSync(localNpmrc, originalContent, "utf8");
    console.log("🧹 .npmrc を元の状態に復元しました。");
  } else if (!hadLocalNpmrc && existsSync(localNpmrc)) {
    unlinkSync(localNpmrc);
    console.log("🧹 一時 .npmrc を削除しました。");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── 未 publish パッケージを調査 ──────────────────────────
async function getUnpublishedPackages() {
  const packagesDir = join(root, "packages");
  const dirs = await readdir(packagesDir);
  const unpublished = [];

  for (const dir of dirs) {
    const pkgJsonPath = join(packagesDir, dir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    const name = pkgJson.name;
    const version = pkgJson.version;

    if (pkgJson.private || !name || !version) continue;

    // npm view で存在確認
    const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
      encoding: "utf8",
      env: { ...process.env, NODE_AUTH_TOKEN: token },
    });

    if (result.status !== 0) {
      unpublished.push({ name, version, dir: join(packagesDir, dir) });
    } else {
      console.log(`  ✅ already published: ${name}@${version}`);
    }
  }

  return unpublished;
}

// ── 1件ずつ publish ──────────────────────────────────────
async function publishOne(pkg) {
  console.log(`\n📦 Publishing ${pkg.name}@${pkg.version} ...`);

  const result = spawnSync(
    "npm",
    ["publish", "--access", "public"],
    {
      cwd: pkg.dir,
      encoding: "utf8",
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_AUTH_TOKEN: token,
      },
    }
  );

  if (result.status === 0) {
    console.log(`  ✅ Published: ${pkg.name}@${pkg.version}`);
    return true;
  } else {
    console.error(`  ❌ Failed: ${pkg.name}@${pkg.version} (exit code: ${result.status})`);
    return false;
  }
}

// ── メイン ───────────────────────────────────────────────
try {
  console.log("🔍 未 publish パッケージを調査中...\n");
  const unpublished = await getUnpublishedPackages();

  if (unpublished.length === 0) {
    console.log("\n🎉 全パッケージが既に publish 済みです！");
    cleanup();
    process.exit(0);
  }

  console.log(`\n📋 未 publish パッケージ: ${unpublished.length} 件`);
  for (const pkg of unpublished) {
    console.log(`  - ${pkg.name}@${pkg.version}`);
  }

  console.log("\n🚀 順番に publish を開始します（各パッケージ間に 60 秒の待機を挟みます）...\n");

  const DELAY_MS = 60000; // 60秒（レートリミット対策）
  const MAX_RETRIES = 3;
  const failed = [];

  for (let i = 0; i < unpublished.length; i++) {
    const pkg = unpublished[i];
    console.log(`[${i + 1}/${unpublished.length}] ${pkg.name}`);

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 1) {
        const retryDelay = attempt * 60000; // リトライは60秒・120秒と増加
        console.log(`  ⏳ リトライ ${attempt}/${MAX_RETRIES} — ${retryDelay / 1000}秒後...`);
        await sleep(retryDelay);
      }
      success = await publishOne(pkg);
      if (success) break;
    }

    if (!success) {
      failed.push(pkg);
    }

    // 最後の1件以外はウェイト
    if (i < unpublished.length - 1) {
      console.log(`  ⏳ ${DELAY_MS / 1000}秒待機中...`);
      await sleep(DELAY_MS);
    }
  }

  cleanup();

  if (failed.length === 0) {
    console.log("\n🎉 全パッケージの publish が完了しました！");
    console.log("\n📋 次のステップ:");
    console.log("   npm login");
    console.log("   pnpm npm:setup-oidc   # Trusted Publisher を一括設定");
    console.log("   npmjs.com で Granular Token を削除");
  } else {
    console.log(`\n⚠️  ${failed.length} 件が失敗しました:`);
    for (const pkg of failed) {
      console.log(`  - ${pkg.name}@${pkg.version}`);
    }
    process.exit(1);
  }
} catch (err) {
  console.error("❌ 予期しないエラー:", err.message);
  cleanup();
  process.exit(1);
}
