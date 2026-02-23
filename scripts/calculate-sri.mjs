import crypto from "node:crypto";
import fs from "node:fs";

const ALGORITHM = "sha384";

async function calculateSRI(input) {
  let buffer;
  if (input.startsWith("http://") || input.startsWith("https://")) {
    console.log(`Fetching ${input}...`);
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${input}: ${response.statusText}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    console.log(`Reading ${input}...`);
    buffer = fs.readFileSync(input);
  }

  const hash = crypto.createHash(ALGORITHM).update(buffer).digest("base64");
  return `${ALGORITHM}-${hash}`;
}

const input = process.argv[2];
if (!input) {
  console.log("Usage: node scripts/calculate-sri.mjs <url-or-path>");
  process.exit(1);
}

calculateSRI(input)
  .then((sri) => {
    console.log("\nCalculated SRI:");
    console.log(sri);
    console.log("\nJSON Format:");
    console.log(`"sri": "${sri}"`);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
