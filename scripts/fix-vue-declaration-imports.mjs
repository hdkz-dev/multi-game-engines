import process from "node:process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// vue-tsc emits Component.vue.d.ts. NodeNext resolves Component.vue.js to
// that declaration, whereas Component.vue requires Component.d.vue.ts.
async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewrite(path);
    } else if (entry.name.endsWith(".d.ts")) {
      const source = await readFile(path, "utf8");
      const updated = source
        .replace(
          /((?:from\s+|import\s*\()(["'])(\.{1,2}\/[^"']+\.vue))\2/g,
          "$1.js$2",
        )
        .replace(
          /((?:from\s+|import\s*\()(["']))@vue\/runtime-core\2/g,
          "$1vue$2",
        );
      if (source !== updated) await writeFile(path, updated);
    }
  }
}

const directory = process.argv[2];
if (!directory) throw new Error("Pass the declaration output directory.");
await rewrite(directory);
