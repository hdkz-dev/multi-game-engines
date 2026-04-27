import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registryPath = path.resolve(__dirname, "../packages/registry/data/engines.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

async function calculateSRI(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  ⚠️ Warning: Failed to fetch ${url} (HTTP ${response.status}). Skipping update.`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    // 2026 standard: sha384 is preferred for public assets
    const hash = crypto.createHash("sha384").update(Buffer.from(buffer)).digest("base64");
    return `sha384-${hash}`;
  } catch (err) {
    console.warn(`  ⚠️ Warning: Network error fetching ${url}. Skipping update.`);
    return null;
  }
}

/**
 * SRI を持たないアセット (sri なし、または __unsafeNoSRI: true) を更新する。
 * __unsafeNoSRI のアセットはフェッチ成功時のみ sri に昇格させる。
 * フェッチ失敗（未デプロイ等）の場合は __unsafeNoSRI をそのまま保持する。
 *
 * ライセンス注意: engines.json はバイナリを含まない URL/メタデータのみ。
 * GPL バイナリの URL を記録することは MIT ライセンス違反に当たらない (ADR-014)。
 */
async function tryUpgradeSRI(assetConfig, label) {
  if (!assetConfig.url) return false;
  // すでに有効な SRI がある → スキップ
  if (assetConfig.sri) return false;

  const sri = await calculateSRI(assetConfig.url);
  if (!sri) return false; // フェッチ失敗 → __unsafeNoSRI を維持

  console.log(`    ✅ SRI 昇格: ${label}`);
  assetConfig.sri = sri;
  delete assetConfig.__unsafeNoSRI;
  return true;
}

async function refresh() {
  let updated = false;
  console.log(`Refreshing SRI hashes in ${registryPath}...`);

  if (!registry.engines) {
    throw new Error("Invalid registry format: registry.engines not found");
  }

  for (const [engineId, engineData] of Object.entries(registry.engines)) {
    console.log(`Processing engine: ${engineId}`);

    if (!engineData.versions) continue;

    for (const [version, versionData] of Object.entries(engineData.versions)) {
      console.log(`  Version: ${version}`);

      const assets = versionData.assets;
      if (!assets) continue;

      // Regular assets
      for (const [assetKey, assetConfig] of Object.entries(assets)) {
        if (assetKey === "variants") continue; // Handle separately

        const label = `${engineId}@${version} / ${assetKey}`;
        if (assetConfig.url && !assetConfig.__unsafeNoSRI) {
          // 既存 SRI の更新チェック
          const sri = await calculateSRI(assetConfig.url);
          if (sri && assetConfig.sri !== sri) {
            console.log(`    ✅ Updated SRI for ${assetKey} in ${engineId}@${version}`);
            assetConfig.sri = sri;
            updated = true;
          }
        } else if (assetConfig.__unsafeNoSRI) {
          // __unsafeNoSRI → フェッチ成功なら sri に昇格
          if (await tryUpgradeSRI(assetConfig, label)) updated = true;
        }
      }

      // Variants
      if (assets.variants) {
        for (const [variantId, variantData] of Object.entries(assets.variants)) {
          for (const [assetKey, assetConfig] of Object.entries(variantData)) {
            const label = `${engineId}@${version} / variants.${variantId}.${assetKey}`;
            if (assetConfig.url && !assetConfig.__unsafeNoSRI) {
              const sri = await calculateSRI(assetConfig.url);
              if (sri && assetConfig.sri !== sri) {
                console.log(`    ✅ Updated SRI for variant ${variantId} asset ${assetKey} in ${engineId}@${version}`);
                assetConfig.sri = sri;
                updated = true;
              }
            } else if (assetConfig.__unsafeNoSRI) {
              if (await tryUpgradeSRI(assetConfig, label)) updated = true;
            }
          }
        }
      }
    }
  }

  if (updated) {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n");
    console.log("Successfully updated registry with new SRI hashes.");
  } else {
    console.log("No SRI updates required.");
  }
}

// Trap errors to continue build process if SRI refresh fails (e.g. offline)
refresh().catch(err => {
  console.error("SRI Refresh failed but continuing build:", err);
  process.exit(0); 
});
