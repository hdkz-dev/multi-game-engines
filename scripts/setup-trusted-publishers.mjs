#!/usr/bin/env node
/**
 * setup-trusted-publishers.mjs
 *
 * npmjs.com の Trusted Publishing (OIDC) を全公開パッケージに一括設定します。
 * Classic Token / Automation Token が廃止された 2025年12月以降の推奨方式です。
 *
 * 使い方:
 *   npm login  # まず npm にログイン
 *   node scripts/setup-trusted-publishers.mjs
 *
 * または npm token を環境変数で渡す:
 *   NPM_TOKEN=npm_xxx node scripts/setup-trusted-publishers.mjs
 *
 * 設定される内容:
 *   - repository owner : hdkz-dev
 *   - repository name  : multi-game-engines
 *   - workflow file    : release.yml
 *   - environment      : (なし)
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ────────────────────────────────────────────────
// 設定値
// ────────────────────────────────────────────────
const GITHUB_OWNER = "hdkz-dev";
const GITHUB_REPO = "multi-game-engines";
const WORKFLOW_FILE = "release.yml";
const NPM_REGISTRY = "https://registry.npmjs.org";

// ────────────────────────────────────────────────
// 公開パッケージの列挙
// ────────────────────────────────────────────────
function getPublicPackages() {
  const { workspaces } = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  );

  const packages = [];
  for (const pattern of workspaces) {
    if (pattern.includes("examples") || pattern.includes("infrastructure"))
      continue;

    const glob = pattern.replace(/\/\*$/, "");
    try {
      const dirs = execSync(`ls -d ${join(root, glob)}/*/`, {
        encoding: "utf8",
      })
        .trim()
        .split("\n");

      for (const dir of dirs) {
        const pkgPath = join(dir.trim(), "package.json");
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
          if (!pkg.private && pkg.name?.startsWith("@multi-game-engines/")) {
            packages.push(pkg.name);
          }
        } catch {
          // package.json がない場合はスキップ
        }
      }
    } catch {
      // glob が展開できない場合はスキップ
    }
  }
  return packages.sort();
}

// ────────────────────────────────────────────────
// npm registry token の取得
// ────────────────────────────────────────────────
function getNpmToken() {
  if (process.env.NPM_TOKEN) return process.env.NPM_TOKEN;

  try {
    // npm login 済みの場合 ~/.npmrc から取得
    const npmrc = execSync("npm config get //registry.npmjs.org/:_authToken", {
      encoding: "utf8",
    }).trim();
    if (npmrc && npmrc !== "undefined" && npmrc !== "null") return npmrc;
  } catch {
    // 取得失敗
  }
  return null;
}

// ────────────────────────────────────────────────
// Trusted Publisher を 1 パッケージに設定
// ────────────────────────────────────────────────
async function setTrustedPublisher(packageName, token) {
  // npm registry の Trusted Publisher API endpoint
  const encodedName = packageName.replace("/", "%2F");
  const url = `${NPM_REGISTRY}/-/package/${encodedName}/oidc-publishers`;

  const body = {
    providerName: "github-actions",
    config: {
      owner: GITHUB_OWNER,
      repository: GITHUB_REPO,
      workflow: WORKFLOW_FILE,
      environment: "",
    },
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true };

  const text = await res.text().catch(() => res.statusText);
  return { ok: false, status: res.status, error: text };
}

// ────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────
async function main() {
  console.log("🔍 公開パッケージを検索中...\n");
  const packages = getPublicPackages();
  console.log(`📦 対象: ${packages.length} パッケージ`);
  packages.forEach((p) => console.log(`   ${p}`));
  console.log();

  const token = getNpmToken();
  if (!token) {
    console.log("⚠️  npm token が見つかりません。");
    console.log(
      "   以下のいずれかで実行してください:\n",
    );
    console.log("   1) npm login を先に実行する");
    console.log(
      "   2) NPM_TOKEN=npm_xxx node scripts/setup-trusted-publishers.mjs\n",
    );
    console.log("─".repeat(60));
    console.log("📋 手動設定が必要な場合は以下の URL を順番に開いてください:");
    console.log(
      `   設定内容: owner=${GITHUB_OWNER}, repo=${GITHUB_REPO}, workflow=${WORKFLOW_FILE}\n`,
    );
    packages.forEach((p) => {
      const encoded = p.replace("@", "").replace("/", "%2F");
      console.log(
        `   https://www.npmjs.com/package/${p}/settings`,
      );
    });
    process.exit(1);
  }

  console.log("🚀 Trusted Publisher を設定中...\n");
  const results = { ok: [], failed: [] };

  for (const pkg of packages) {
    process.stdout.write(`   ${pkg} ... `);
    const result = await setTrustedPublisher(pkg, token);
    if (result.ok) {
      console.log("✅");
      results.ok.push(pkg);
    } else {
      // 409 = すでに設定済み（冪等）
      if (result.status === 409) {
        console.log("⏭️  設定済み");
        results.ok.push(pkg);
      } else {
        console.log(`❌ (${result.status}: ${result.error?.slice(0, 80)})`);
        results.failed.push({ pkg, ...result });
      }
    }
  }

  console.log("\n─".repeat(60));
  console.log(`✅ 成功: ${results.ok.length} パッケージ`);
  if (results.failed.length > 0) {
    console.log(`❌ 失敗: ${results.failed.length} パッケージ`);
    results.failed.forEach(({ pkg, status, error }) => {
      console.log(`   ${pkg}: ${status} — ${error?.slice(0, 120)}`);
    });
    process.exit(1);
  }

  console.log("\n🎉 完了！");
  console.log("   次のステップ: npmjs.com でパッケージごとに");
  console.log(
    '   "Publishing access" を "Require 2FA and disallow tokens" に変更することを推奨します。',
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
