/* global console, process */
/**
 * doc-sync.js
 * 2026 Zenith Tier: Documentation and Implementation Sync Validator.
 * Currently verifies the existence and basic structure of key technical documents.
 * Future: Integrate with TypeDoc to compare generated API references with Markdown files.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const REQUIRED_DOCS = [
  "docs/ARCHITECTURE.md",
  "docs/TECHNICAL_SPECS.md",
  "docs/ZENITH_STANDARD.md",
];

function checkDocs() {
  console.log("🔍 Checking documentation sync...");
  let hasError = false;

  for (const doc of REQUIRED_DOCS) {
    const fullPath = path.join(ROOT, doc);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing required documentation: ${doc}`);
      hasError = true;
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    if (content.length < 100) {
      console.error(`⚠️ Documentation seems too short or empty: ${doc}`);
      hasError = true;
    } else {
      console.log(`✅ ${doc} is present and has content.`);
    }
  }

  // Version Sync Check (PROGRESS.md vs package.json)
  try {
    const pkgPath = path.join(ROOT, "package.json");
    const progressPath = path.join(ROOT, "docs/PROGRESS.md");
    if (fs.existsSync(pkgPath) && fs.existsSync(progressPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const progress = fs.readFileSync(progressPath, "utf-8");

      // Check ESLint version sync as an example of strict validation
      if (pkg.devDependencies && pkg.devDependencies.eslint) {
        const eslintVer = pkg.devDependencies.eslint.replace(/[\^~]/, "");
        if (!progress.includes(`ESLint ${eslintVer}`)) {
          console.error(
            `❌ Version mismatch: PROGRESS.md should contain "ESLint ${eslintVer}"`,
          );
          hasError = true;
        } else {
          console.log(`✅ Version sync verified: ESLint ${eslintVer}`);
        }
      }
    }
  } catch (e) {
    console.error("❌ Failed to check version sync:", e);
    hasError = true;
  }

  if (hasError) {
    console.error("\n❌ Documentation sync check failed.");
    process.exit(1);
  } else {
    console.log("\n✨ All required documentation is present.");
  }
}

checkDocs();
