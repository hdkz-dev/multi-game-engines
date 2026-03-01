import fs from 'fs/promises';

async function main() {
  const file = 'packages/registry/src/__tests__/engines-json-schema.test.ts';
  let content = await fs.readFile(file, 'utf-8');

  // Add beforeEach/afterEach
  content = content.replace('describe("engines.json schema validation", () => {', 
    'describe("engines.json schema validation", () => {\n  let warnSpy: ReturnType<typeof vi.spyOn>;\n\n  beforeEach(() => {\n    vi.spyOn(performance, "now").mockReturnValue(1234.56);\n    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);\n  });\n\n  afterEach(() => {\n    vi.restoreAllMocks();\n  });\n');

  // Remove local warnSpy definitions
  content = content.replace(/const warnSpy = vi\n?\s*\.spyOn\(console, "warn"\)\n?\s*\.mockImplementation\(\(\) => undefined\);/g, '');

  // Remove mockRestore calls
  content = content.replace(/warnSpy\.mockRestore\(\);/g, '');

  await fs.writeFile(file, content, 'utf-8');
}
main().catch(console.error);
