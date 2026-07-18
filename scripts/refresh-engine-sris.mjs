import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registryPath = path.resolve(__dirname, "../packages/registry/data/engines.json");
const sriHashesDir = path.resolve(__dirname, "../packages/registry/data/sri-hashes");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

// Strict mode (SRI_STRICT=1): fetch failures for assets that already have an
// SRI are treated as errors (non-zero exit). Used by refresh-sri.yml so that
// missing production assets (404) fail the workflow instead of passing
// silently. Local `pnpm build` stays lenient to allow offline builds.
const strictMode = process.env.SRI_STRICT === "1" || process.env.SRI_STRICT === "true";

// Assets with an existing SRI whose fetch failed: { label, url }.
// __unsafeNoSRI assets (not yet deployed) are excluded — a failed fetch is
// expected there and keeps __unsafeNoSRI as-is.
const fetchFailures = [];

// refresh-sri.yml runs right after docs.yml deploys, when GitHub Pages can
// still be swapping content and briefly answers 5xx. Retrying those keeps a
// transient blip from being reported as a missing production asset.
// 4xx is NOT retried: a 404 means the asset is genuinely gone, which is
// exactly what strict mode exists to catch. 429 is the one exception —
// rate limiting is transient, and this script fetches every asset back to
// back, so it is the 4xx we are most likely to hit.
const FETCH_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const isTransientStatus = status => status >= 500 || status === 429;

async function calculateSRI(url) {
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    const isLastAttempt = attempt === FETCH_ATTEMPTS;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        // 2026 standard: sha384 is preferred for public assets
        const hash = crypto.createHash("sha384").update(Buffer.from(buffer)).digest("base64");
        return `sha384-${hash}`;
      }
      if (!isTransientStatus(response.status) || isLastAttempt) {
        console.warn(`  ⚠️ Warning: Failed to fetch ${url} (HTTP ${response.status}). Skipping update.`);
        return null;
      }
      console.warn(`  ⏳ Transient HTTP ${response.status} for ${url} — retrying (${attempt}/${FETCH_ATTEMPTS - 1})...`);
    } catch (err) {
      if (isLastAttempt) {
        console.warn(`  ⚠️ Warning: Network error fetching ${url}. Skipping update.`);
        return null;
      }
      console.warn(`  ⏳ Network error for ${url} — retrying (${attempt}/${FETCH_ATTEMPTS - 1})...`);
    }
    await sleep(RETRY_DELAY_MS);
  }
  return null;
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

/**
 * Read SRI hashes from the sri-hashes/ directory.
 * Local helper scripts (e.g. download-katago-onnx.sh) write hashes here after
 * computing them from locally-obtained assets, so they can be applied before
 * the assets are reachable on GitHub Pages. CI does not write here — once the
 * assets are deployed, the URL fetch below is the source of truth.
 * File naming convention:
 *   {engineId}-{version}.txt          → applies to the "main" asset
 *   {engineId}-{version}-{assetKey}.txt → applies to a specific asset key
 */
function loadLocalSRIHashes() {
  const hashes = {};
  if (!fs.existsSync(sriHashesDir)) return hashes;
  for (const filename of fs.readdirSync(sriHashesDir)) {
    if (!filename.endsWith(".txt")) continue;
    const content = fs.readFileSync(path.join(sriHashesDir, filename), "utf8").trim();
    if (!content.startsWith("sha384-")) continue;
    // Parse: {engineId}-{version}.txt or {engineId}-{version}-{assetKey}.txt
    const base = filename.slice(0, -4); // remove .txt
    // Version is always numeric-dotted (e.g. "1.14", "7.5"), engineId has no digits at end
    // Strategy: split on last occurrence of a segment that looks like a version
    const parts = base.split("-");
    // Find version index: first segment that is purely digits/dots
    let versionIdx = -1;
    for (let i = 1; i < parts.length; i++) {
      if (/^\d+(\.\d+)*$/.test(parts[i])) {
        versionIdx = i;
        break;
      }
    }
    if (versionIdx === -1) continue;
    const engineId = parts.slice(0, versionIdx).join("-");
    const version = parts[versionIdx];
    const assetKey = parts.slice(versionIdx + 1).join("-") || "main";
    hashes[`${engineId}@${version}/${assetKey}`] = content;
  }
  return hashes;
}

async function refresh() {
  let updated = false;
  console.log(`Refreshing SRI hashes in ${registryPath}...`);

  // Apply any locally-computed SRI hashes from the sri-hashes/ directory.
  // These come from local helper scripts run before assets reach GitHub Pages.
  const localHashes = loadLocalSRIHashes();
  const localHashCount = Object.keys(localHashes).length;
  if (localHashCount > 0) {
    console.log(`\nApplying ${localHashCount} local SRI hash(es) from ${sriHashesDir}...`);
    for (const [key, sri] of Object.entries(localHashes)) {
      const [engineVersion, assetKey] = key.split("/");
      const [engineId, version] = engineVersion.split("@");
      const asset = registry.engines?.[engineId]?.versions?.[version]?.assets?.[assetKey];
      if (!asset) {
        console.warn(`  ⚠️ No asset found for ${key} — skipping.`);
        continue;
      }
      if (asset.sri === sri) continue; // already up-to-date
      console.log(`  ✅ Applied local SRI for ${key}`);
      asset.sri = sri;
      delete asset.__unsafeNoSRI;
      updated = true;
    }
  }

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
          if (!sri) {
            fetchFailures.push({ label, url: assetConfig.url });
          } else if (assetConfig.sri !== sri) {
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
              if (!sri) {
                fetchFailures.push({ label, url: assetConfig.url });
              } else if (assetConfig.sri !== sri) {
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

  if (fetchFailures.length > 0) {
    console.error(`\n❌ Failed to fetch ${fetchFailures.length} asset(s) with existing SRI:`);
    for (const { label, url } of fetchFailures) {
      console.error(`  - ${label}: ${url}`);
    }
    if (strictMode) {
      process.exitCode = 1;
    } else {
      console.warn("SRI_STRICT is not set — treating fetch failures as warnings.");
    }
  }
}

// Lenient mode (default, e.g. `pnpm build` offline): errors are logged but the
// process exits 0 so the build can continue. Strict mode (CI): exit non-zero.
refresh().catch(err => {
  console.error("SRI Refresh failed:", err);
  process.exit(strictMode ? 1 : 0);
});
