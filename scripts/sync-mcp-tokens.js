const fs = require("fs");
const path = require("path");

/**
 * sync-mcp-tokens.js
 *
 * 1. Sync tokens from environment variables to mcp_config.json.
 * 2. Generate mcp_config.example.json by masking tokens in mcp_config.json.
 */

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "mcp_config.json");
const EXAMPLE_PATH = path.join(ROOT, "mcp_config.example.json");

// Sensitive keys to mask
const SENSITIVE_KEYS = [
  "GITHUB_PERSONAL_ACCESS_TOKEN",
  "VERCEL_TOKEN",
  "BRAVE_API_KEY",
  "GOOGLE_API_KEY",
  "CLOUDFLARE_API_TOKEN",
];

function maskValue(key, value) {
  if (SENSITIVE_KEYS.includes(key)) {
    return `YOUR_${key}`;
  }
  return value;
}

function processObject(obj, action) {
  const newObj = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      newObj[key] = processObject(value, action);
    } else {
      if (action === "mask") {
        newObj[key] = maskValue(key, value);
      } else if (action === "fill") {
        // Fill from process.env if available
        newObj[key] = process.env[key] || value;
      } else {
        newObj[key] = value;
      }
    }
  }
  return newObj;
}

function main() {
  const mode = process.argv[2] || "mask"; // 'mask' or 'fill'

  if (mode === "mask") {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error(
        'mcp_config.json not found. Use "fill" mode to generate it from example first.',
      );
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    const masked = processObject(config, "mask");
    fs.writeFileSync(EXAMPLE_PATH, JSON.stringify(masked, null, 2) + "\n");
    console.log("Generated mcp_config.example.json with masked tokens.");
  }

  if (mode === "fill") {
    if (!fs.existsSync(EXAMPLE_PATH)) {
      console.error("mcp_config.example.json not found.");
      process.exit(1);
    }
    const example = JSON.parse(fs.readFileSync(EXAMPLE_PATH, "utf-8"));
    const filled = processObject(example, "fill");
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(filled, null, 2) + "\n");
    console.log("Synchronized mcp_config.json with environment variables.");
  }
}

main();
