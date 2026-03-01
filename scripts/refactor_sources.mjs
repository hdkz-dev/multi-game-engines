import fs from 'fs/promises';
import path from 'path';

async function main() {
  const adaptersDir = 'packages';
  const dirs = await fs.readdir(adaptersDir);
  
  for (const dir of dirs) {
    if (!dir.startsWith('adapter-')) continue;
    const indexPath = path.join(adaptersDir, dir, 'src', 'index.ts');
    try {
      let content = await fs.readFile(indexPath, 'utf-8');
      
      const regex = /const registrySources =([\s\S]*?)OfficialRegistry\.resolve\(([^,]+),\s*config\.version\)\s*\|\|\s*\{\};[\s\S]*?const mergedConfig:\s*IEngineConfig\s*=\s*\{[\s\S]*?\.\.\.config,[\s\S]*?sources:\s*sources[\s\S]*?\};/m;
      
      const match = content.match(regex);
      if (match) {
        const idExpr = match[2]; // e.g., '"katago"' or 'config.id || "katago"'
        // Extract default engine ID from idExpr
        let defaultId = '"unknown"';
        const idMatch = idExpr.match(/"([^"]+)"/);
        if (idMatch) {
            defaultId = `"${idMatch[1]}"`;
        }

        const replacement = `const registrySources =
    OfficialRegistry.resolve(${idExpr}, config.version);
  
  const mergedConfig: IEngineConfig = {
    ...config,
    sources: normalizeAndValidateSources(registrySources as Record<string, IEngineSourceConfig>, config, ${defaultId}),
  };`;

        content = content.replace(regex, replacement);

        // Add import for normalizeAndValidateSources
        if (!content.includes('normalizeAndValidateSources')) {
          content = content.replace(/import type \{([\s\S]*?)\} from "@multi-game-engines\/core";/, (m, p1) => {
            if (!content.includes('import { normalizeAndValidateSources } from "@multi-game-engines/core";')) {
              // We'll just add it to normal imports instead of type imports if we can,
              // or find existing value imports from core.
              return m; 
            }
            return m;
          });
          
          const coreImport = /import \{([\s\S]*?)\} from "@multi-game-engines\/core";/;
          if (coreImport.test(content)) {
            content = content.replace(coreImport, (m, p1) => {
                return `import {${p1}, normalizeAndValidateSources } from "@multi-game-engines/core";`;
            });
          } else {
            content = `import { normalizeAndValidateSources } from "@multi-game-engines/core";
` + content;
          }
        }
        
        await fs.writeFile(indexPath, content, 'utf-8');
        console.log(`Refactored sources validation in ${indexPath}`);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(e);
    }
  }
}
main().catch(console.error);