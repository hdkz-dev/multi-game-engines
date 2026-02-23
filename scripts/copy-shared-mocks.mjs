/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, '../fixtures/shared-mocks/mock-stockfish.js');
const destDir = path.resolve(process.cwd(), 'public');
const dest = path.join(destDir, 'mock-stockfish.js');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log(`Copied mock-stockfish.js to ${dest}`);
