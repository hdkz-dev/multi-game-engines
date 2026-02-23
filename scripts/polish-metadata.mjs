/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_DIR = path.resolve(__dirname, '../packages');
const REPO_URL = "https://github.com/hdkz-dev/multi-game-engines";

const commonMetadata = {
  author: "hdkz-dev",
  license: "MIT",
  repository: {
    type: "git",
    url: "git+https://github.com/hdkz-dev/multi-game-engines.git",
    directory: ""
  },
  bugs: {
    url: `${REPO_URL}/issues`
  },
  homepage: `${REPO_URL}#readme`
};

const packages = fs.readdirSync(PACKAGES_DIR);

for (const pkgName of packages) {
  const pkgPath = path.join(PACKAGES_DIR, pkgName, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    pkg.author = commonMetadata.author;
    pkg.license = commonMetadata.license;
    pkg.repository = { ...commonMetadata.repository, directory: `packages/${pkgName}` };
    pkg.bugs = commonMetadata.bugs;
    pkg.homepage = commonMetadata.homepage;

    // ソート順
    const { name, version, description, type, ...rest } = pkg;
    const ordered = { name, version, description, type, ...rest };

    fs.writeFileSync(pkgPath, JSON.stringify(ordered, null, 2) + '\n');
    console.log(`Polished metadata for ${pkgName}`);
  }
}
