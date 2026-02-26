/* global console */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_DIR = path.resolve(__dirname, "../packages");
const REPO_URL = "https://github.com/hdkz-dev/multi-game-engines";

const commonMetadata = {
  author: "hdkz-dev",
  license: "MIT",
  repository: {
    type: "git",
    url: "git+https://github.com/hdkz-dev/multi-game-engines.git",
    directory: "",
  },
  bugs: {
    url: `${REPO_URL}/issues`,
  },
  homepage: `${REPO_URL}#readme`,
};

const packages = fs.readdirSync(PACKAGES_DIR);

for (const pkgName of packages) {
  const pkgPath = path.join(PACKAGES_DIR, pkgName, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

      pkg.author = commonMetadata.author;
      pkg.license = commonMetadata.license;
      pkg.repository = {
        ...commonMetadata.repository,
        directory: `packages/${pkgName}`,
      };
      pkg.bugs = commonMetadata.bugs;
      pkg.homepage = commonMetadata.homepage;

      // 2026 Best Practice: package.json のキー順序を固定して可読性を向上。
      // 未定義のフィールド（description, type 等）は JSON.stringify により自動的に除外されます。
      const { name, version, description, type, ...rest } = pkg;
      const ordered = { name, version, description, type, ...rest };

      fs.writeFileSync(pkgPath, JSON.stringify(ordered, null, 2) + "\n");
      console.log(`Polished metadata for ${pkgName}`);
    } catch (err) {
      console.error(`[polish-metadata] Failed to process ${pkgName}:`, err);
    }
  }
}
