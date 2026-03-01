import fs from 'fs/promises';
import path from 'path';

async function walk(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (let file of list) {
    file = path.resolve(dir, file);
    const stat = await fs.stat(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        results = results.concat(await walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  }
  return results;
}

async function main() {
  const files = await walk('packages');
  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    let modified = false;

    // Replace `"..." as I18nKey`
    const regex1 = /"([^"]+)"\s+as\s+I18nKey/g;
    if (regex1.test(content)) {
      content = content.replace(regex1, 'createI18nKey("$1")');
      modified = true;
    }

    // Replace `... as unknown as I18nKey`
    const regex2 = /([\w.]+)\s+as\s+unknown\s+as\s+I18nKey/g;
    if (regex2.test(content)) {
      content = content.replace(regex2, 'createI18nKey($1)');
      modified = true;
    }

    if (modified) {
      const coreImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@multi-game-engines\/core['"]/;
      if (coreImportRegex.test(content)) {
        if (!content.includes('createI18nKey')) {
          content = content.replace(coreImportRegex, (match, p1) => {
            return `import {${p1}, createI18nKey } from "@multi-game-engines/core"`;
          });
        }
      } else {
        if (!content.includes('createI18nKey')) {
          const importStatement = `import { createI18nKey } from "@multi-game-engines/core";\n`;
          content = importStatement + content;
        }
      }

      await fs.writeFile(file, content, 'utf-8');
      console.log(`Refactored ${file}`);
    }
  }
}
main().catch(console.error);