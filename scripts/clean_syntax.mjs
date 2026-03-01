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

    // Fix empty import list `{,`
    if (/\{\s*,/.test(content)) {
      content = content.replace(/\{\s*,/g, '{');
      modified = true;
    }
    
    // Fix double comma `, ,`
    if (/,\s*,/.test(content)) {
      content = content.replace(/,\s*,/g, ',');
      modified = true;
    }

    // Fix trailing comma before brace
    // Actually trailing comma is valid in TS, but just in case:
    if (/\{\s*,\s*createI18nKey/.test(content)) {
      content = content.replace(/\{\s*,\s*createI18nKey/g, '{ createI18nKey');
      modified = true;
    }

    if (modified) {
      await fs.writeFile(file, content, 'utf-8');
      console.log(`Cleaned syntax in ${file}`);
    }
  }
}
main().catch(console.error);