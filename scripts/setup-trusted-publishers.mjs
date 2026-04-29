#!/usr/bin/env node
/**
 * setup-trusted-publishers.mjs
 *
 * npm には PyPI のような「Trusted Publishers API」は存在しません。
 * npm の OIDC は「プロベナンス（署名）」用であり、認証には Granular Token が必要です。
 *
 * このスクリプトは各パッケージの設定ページへのリンクを表示します。
 * 実際の公開は release.yml の NODE_AUTH_TOKEN (NPM_TOKEN secret) で行われます。
 *
 * 使い方:
 *   node scripts/setup-trusted-publishers.mjs
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

async function main() {
  console.log("📋 npm パッケージ設定ページ一覧\n");
  console.log("npm には Trusted Publishers API（PyPI のような OIDC 認証委譲）は存在しません。");
  console.log("認証は GitHub Secrets の NPM_TOKEN (Granular Token) で行われます。\n");
  console.log("各パッケージの設定を確認する場合は以下の URL を参照してください:\n");

  const packages = getPublicPackages();
  for (const pkg of packages) {
    console.log(`  https://www.npmjs.com/package/${pkg}/settings`);
  }

  console.log(`\n📦 合計: ${packages.length} パッケージ`);
  console.log("\n✅ release.yml は NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} で認証済みです。");
  console.log("   GitHub Secrets に NPM_TOKEN (Granular Token, Bypass 2FA 有効) が設定されていれば");
  console.log("   main ブランチへの push 時に自動 publish されます。");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
