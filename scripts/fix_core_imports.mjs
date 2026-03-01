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
  const files = await walk('packages/core/src');
  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    let modified = false;

    if (content.includes('createI18nKey') && !content.includes('export function createI18nKey')) {
      if (!content.includes('createI18nKey} from') && !content.includes('createI18nKey } from')) {
        const dirname = path.dirname(file);
        const protocolDir = path.resolve('packages/core/src/protocol');
        let relPath = path.relative(dirname, path.join(protocolDir, 'ProtocolValidator.js'));
        if (!relPath.startsWith('.')) relPath = './' + relPath;
        
        relPath = relPath.replace(/\\/g, '/');

        const pvRegex = /import\s+\{([^}]+)\}\s+from\s+['"](?:\.\/|\.\.\/)+protocol\/ProtocolValidator(?:\.js)?['"]/;
        if (pvRegex.test(content)) {
          content = content.replace(pvRegex, (match, p1) => {
            return match.replace(p1, p1 + ', createI18nKey');
          });
        } else {
          content = `import { createI18nKey } from "${relPath}";\n` + content;
        }
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(file, content, 'utf-8');
      console.log(`Fixed imports in ${file}`);
    }
  }
}
main().catch(console.error);