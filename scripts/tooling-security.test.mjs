import assert from "node:assert/strict";
import { X509Certificate, createPrivateKey } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { get } from "node:https";
import { spawnSync } from "node:child_process";
import test from "node:test";
import process from "node:process";
import { URL, pathToFileURL } from "node:url";

const vueRequire = createRequire(
  new URL("../examples/zenith-dashboard-vue/package.json", import.meta.url),
);
const nuxtRequire = createRequire(vueRequire.resolve("nuxt/package.json"));
const cliRequire = createRequire(nuxtRequire.resolve("@nuxt/cli"));
const listenerEntry = cliRequire.resolve("listhen");
const listenerRequire = createRequire(listenerEntry);
const certificate = listenerRequire("./shared/secure-certificate.cjs");
const nitroServerRequire = createRequire(
  nuxtRequire.resolve("@nuxt/nitro-server"),
);
const nitroRequire = createRequire(
  nitroServerRequire.resolve("nitropack/package.json"),
);
const globbyRequire = createRequire(nitroRequire.resolve("globby"));
const globRequire = createRequire(globbyRequire.resolve("fast-glob"));
const glob = globRequire("fast-glob");
const patterns = globRequire("./utils/pattern.js");

function request(url, options) {
  return new Promise((resolve, reject) => {
    const req = get(url, options, (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode));
      response.on("error", reject);
    });
    req.on("error", reject);
  });
}

for (const format of ["CommonJS", "ESM"]) {
  test(`patched listener ${format} serves HTTPS with a verifiable certificate chain`, async () => {
    const { listen } =
      format === "CommonJS"
        ? listenerRequire("listhen")
        : await import(
            pathToFileURL(join(dirname(listenerEntry), "index.mjs")).href
          );
    const listener = await listen((_, response) => response.end("ok"), {
      https: true,
      hostname: "127.0.0.1",
      port: 0,
      showURL: false,
      clipboard: false,
    });
    try {
      const chain = listener.https.cert.match(
        /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
      );
      assert.equal(chain.length, 2);
      const leaf = new X509Certificate(chain[0]);
      const ca = new X509Certificate(chain[1]);
      assert.equal(leaf.verify(ca.publicKey), true);
      assert.equal(leaf.checkHost("localhost"), "localhost");
      assert.equal(leaf.checkIP("127.0.0.1"), "127.0.0.1");
      assert.equal(leaf.checkIP("::1"), "::1");
      assert.equal(
        await request(listener.url, { ca: chain[1], servername: "localhost" }),
        200,
      );
    } finally {
      await listener.close();
    }
  });
}

test("certificate loader supports encrypted PEM and PFX and rejects invalid input", async () => {
  const pem = await certificate.resolveCertificate({
    domains: ["localhost"],
    passphrase: "test-only-passphrase",
  });
  assert.ok(createPrivateKey({ key: pem.key, passphrase: pem.passphrase }));
  assert.deepEqual(await certificate.resolveCertificate(pem), pem);
  const dir = await mkdtemp(join(tmpdir(), "mge-cert-"));
  try {
    await writeFile(
      join(dir, "key.pem"),
      createPrivateKey({ key: pem.key, passphrase: pem.passphrase }).export({
        type: "pkcs8",
        format: "pem",
      }),
    );
    await writeFile(join(dir, "cert.pem"), pem.cert);
    const result = spawnSync(
      "openssl",
      [
        "pkcs12",
        "-export",
        "-inkey",
        "key.pem",
        "-in",
        "cert.pem",
        "-out",
        "cert.pfx",
        "-passin",
        "pass:test-only-passphrase",
        "-passout",
        "pass:test-only-pfx",
      ],
      { cwd: dir, encoding: "utf8" },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const loaded = await certificate.resolveCertificate({
      pfx: join(dir, "cert.pfx"),
      passphrase: "test-only-pfx",
    });
    assert.deepEqual(loaded.pfx, await readFile(join(dir, "cert.pfx")));
    await assert.rejects(
      certificate.resolveCertificate({
        pfx: join(dir, "cert.pfx"),
        passphrase: "wrong",
      }),
    );
    await assert.rejects(
      certificate.resolveCertificate({ key: pem.key }),
      /both be present/,
    );
    await assert.rejects(
      certificate.resolveCertificate({ validityDays: 0 }),
      /positive/,
    );
    await assert.rejects(
      certificate.resolveCertificate({ domains: [] }),
      /nonempty/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("glob replacement preserves ranges, nested alternatives, escaping, and rejects excessive expansion", () => {
  assert.deepEqual(patterns.expandBraceExpansion("file{01..03}.js"), [
    "file01.js",
    "file02.js",
    "file03.js",
  ]);
  assert.deepEqual(patterns.expandBraceExpansion("{a,{b,c}}.js"), [
    "a.js",
    "b.js",
    "c.js",
  ]);
  assert.deepEqual(patterns.expandBraceExpansion(String.raw`file\{a,b\}.js`), [
    String.raw`file\{a,b\}.js`,
  ]);
  assert.throws(
    () =>
      patterns.expandBraceExpansion("{".repeat(65) + "a,b" + "}".repeat(65)),
    /nesting/,
  );
  assert.throws(
    () => patterns.expandBraceExpansion("{1..100000}"),
    /10000 patterns/,
  );
});

test("numeric brace limits reject oversized ranges before allocation", () => {
  assert.throws(
    () => patterns.expandBraceExpansion("{a}".repeat(257)),
    /groups/,
  );
  assert.deepEqual(patterns.expandBraceExpansion("{-2..2..2}"), [
    "0",
    "2",
    "-2",
  ]);
  assert.throws(
    () => patterns.expandBraceExpansion("{0..100000000000000000000}"),
    /10000 patterns/,
  );
  assert.throws(
    () => patterns.expandBraceExpansion("{9007199254740992..9007199254740993}"),
    /safe integer/,
  );
});

test("patched globs and Next root discovery find directory alternatives and respect ignores", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mge-glob-"));
  try {
    for (const name of ["a", "b", "ignored"]) {
      await mkdir(join(dir, name));
      await writeFile(join(dir, name, "file.js"), "export {};\n");
    }
    await mkdir(join(dir, "a", "nested"));
    assert.deepEqual(glob.sync("{a,b}/**/*.js", { cwd: dir }).sort(), [
      "a/file.js",
      "b/file.js",
    ]);
    const { globby } = await import(
      pathToFileURL(nitroRequire.resolve("globby")).href
    );
    assert.deepEqual(
      (await globby("**/*.js", { cwd: dir, ignore: ["ignored/**"] })).sort(),
      ["a/file.js", "b/file.js"],
    );
    const reactRequire = createRequire(
      new URL(
        "../examples/zenith-dashboard-react/package.json",
        import.meta.url,
      ),
    );
    const pluginRequire = createRequire(
      reactRequire.resolve("@next/eslint-plugin-next"),
    );
    const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");
    assert.deepEqual(getRootDirs({ cwd: dir, settings: {} }), [dir]);
    const relativeDir = relative(process.cwd(), dir).replaceAll("\\", "/");
    assert.deepEqual(
      getRootDirs({
        cwd: dir,
        settings: { next: { rootDir: `${relativeDir}/{a,b}` } },
      }).sort(),
      [`${relativeDir}/a`, `${relativeDir}/b`],
    );
    assert.deepEqual(
      getRootDirs({
        cwd: dir,
        settings: { next: { rootDir: [join(dir, "a"), join(dir, "b")] } },
      }).sort(),
      [join(dir, "a"), join(dir, "b")],
    );
    assert.deepEqual(
      getRootDirs({
        cwd: dir,
        settings: { next: { rootDir: `${dir}/{a,b}` } },
      }).sort(),
      [join(dir, "a"), join(dir, "b")],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("patched watcher preserves ignore glob compilation", async () => {
  const tailwindRequire = createRequire(
    new URL("../packages/ui-react/package.json", import.meta.url),
  );
  const cli = createRequire(
    tailwindRequire.resolve("@tailwindcss/cli/package.json"),
  );
  const watcherRequire = createRequire(cli.resolve("@parcel/watcher"));
  const { createWrapper } = watcherRequire("./wrapper.js");
  let normalized;
  const wrapper = createWrapper({
    async subscribe(_dir, _callback, options) {
      normalized = options;
    },
    async unsubscribe() {},
  });
  const subscription = await wrapper.subscribe(".", () => {}, {
    ignore: ["**/{dist,coverage}/**"],
  });
  const regex = new RegExp(normalized.ignoreGlobs[0]);
  assert.equal(regex.test("packages/core/dist/index.js"), true);
  assert.equal(regex.test("packages/core/coverage/index.html"), true);
  assert.equal(regex.test("packages/core/src/index.ts"), false);
  await subscription.unsubscribe();
});

test("lockfile excludes vulnerable cryptography and brace dependencies", async () => {
  const lock = await readFile(
    new URL("../pnpm-lock.yaml", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(lock, /(?:node-forge|braces|micromatch)@/);
});
