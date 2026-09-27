import console from "node:console";
import process from "node:process";
import { commonLocales } from "./packages/i18n-common/dist/index.js";

console.log("Testing Node.js SSR Compatibility for i18n-common...");
if (commonLocales.en && commonLocales.en.engine) {
  console.log("SUCCESS: JSON imported correctly via ESM in Node.js.");
} else {
  console.error("FAILURE: commonLocales structure is invalid.");
  process.exit(1);
}
