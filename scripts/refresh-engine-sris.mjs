import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ENGINES_JSON_PATH = path.resolve("packages/registry/data/engines.json");
const ALGORITHM = "sha384";

async function calculateSRI(url) {
  console.log(`  Fetching ${url}...`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = crypto.createHash(ALGORITHM).update(buffer).digest("base64");
    return `${ALGORITHM}-${hash}`;
  } catch (err) {
    console.error(`  Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`Refreshing SRI hashes in ${ENGINES_JSON_PATH}...`);

  const data = JSON.parse(fs.readFileSync(ENGINES_JSON_PATH, "utf-8"));
  let updatedCount = 0;
  let errorCount = 0;

  for (const [engineId, engine] of Object.entries(data.engines)) {
    console.log(`Processing engine: ${engineId}`);
    for (const [version, versionData] of Object.entries(engine.versions)) {
      console.log(`  Version: ${version}`);
      for (const [assetId, asset] of Object.entries(versionData.assets)) {
        const sri = await calculateSRI(asset.url);
        if (sri) {
          if (asset.sri !== sri || asset.__unsafeNoSRI) {
            asset.sri = sri;
            delete asset.__unsafeNoSRI;
            updatedCount++;
            console.log(`    ✅ Updated ${assetId}`);
          } else {
            console.log(`    ℹ️ No change for ${assetId}`);
          }
        } else {
          errorCount++;
        }
      }
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(
      ENGINES_JSON_PATH,
      JSON.stringify(data, null, 2) + "\n",
      "utf-8",
    );
    console.log(`\nSuccess: Updated ${updatedCount} assets.`);
  } else {
    console.log("\nNo updates needed.");
  }

  if (errorCount > 0) {
    console.warn(`\nWarning: Encountered ${errorCount} errors during update.`);
    // 完全に失敗した場合は終了コード 1 を返す
    // ただし、一部成功している場合は警告のみにとどめる運用も可能
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
