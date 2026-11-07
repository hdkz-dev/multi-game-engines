import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import console from "node:console";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { setTimeout, clearTimeout } from "node:timers";
import { fileURLToPath } from "node:url";
import { chessMoves, shogiMoves } from "./legal-moves.mjs";

const root = resolve(import.meta.dirname, "../..");
const requireCore = createRequire(join(root, "packages/core/package.json"));
const { build } = createRequire(requireCore.resolve("tsup"))("esbuild");
const { chromium } = createRequire(
  join(root, "examples/zenith-dashboard-react/package.json"),
)("@playwright/test");
const portlessCli = join(
  dirname(fileURLToPath(import.meta.resolve("portless"))),
  "cli.js",
);
const proxyPort = Number(process.env.FAIRY_SMOKE_PORT ?? 1356);
assert.ok(
  Number.isInteger(proxyPort) && proxyPort > 0 && proxyPort <= 65535,
  "Invalid FAIRY_SMOKE_PORT",
);
const origin = `http://registry.localhost:${proxyPort}`;
const temporary = await mkdtemp(join(tmpdir(), "mge-fairy-smoke-"));
const reportFile = resolve(
  process.env.FAIRY_SMOKE_REPORT ??
    join(root, "artifacts/fairy-browser/report.json"),
);
const environment = {
  ...process.env,
  PORTLESS_STATE_DIR: join(temporary, "portless"),
  PORTLESS_PORT: String(proxyPort),
  PORTLESS_HTTPS: "0",
  PORTLESS_SYNC_HOSTS: "0",
};
const reports = [];
let browser;
let proxy;
let server;
let cleaning;
const cleanup = () =>
  (cleaning ??= (async () => {
    if (browser) await browser.close().catch(() => {});
    if (proxy && proxy.exitCode === null) {
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          proxy.kill("SIGKILL");
          resolve();
        }, 3000);
        proxy.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
        proxy.kill("SIGTERM");
      });
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  })());
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    void cleanup().finally(() => process.exit(signal === "SIGINT" ? 130 : 143));
  });
try {
  const bundle = join(temporary, "bundle.js");
  await build({
    entryPoints: [join(import.meta.dirname, "browser-entry.mjs")],
    outfile: bundle,
    bundle: true,
    format: "esm",
    platform: "browser",
    plugins: [
      {
        name: "workspace-dist",
        setup(builder) {
          builder.onResolve({ filter: /^@multi-game-engines\// }, (args) => {
            if (args.path.endsWith("/node"))
              return { path: args.path, external: true };
            return {
              path: join(
                root,
                "packages",
                args.path.slice("@multi-game-engines/".length),
                "dist/index.js",
              ),
            };
          });
        },
      },
    ],
  });
  const body = await readFile(bundle);
  server = createServer((request, response) => {
    if (request.url !== "/unisolated") {
      response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    }
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' blob: https://cdn.jsdelivr.net; base-uri 'none'; frame-ancestors 'none'",
    );
    if (request.url === "/" || request.url === "/unisolated") {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<!doctype html><title>Fairy browser smoke</title><script type="module" src="/bundle.js"></script>',
      );
    } else if (request.url === "/bundle.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(body);
    } else response.writeHead(404).end();
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  proxy = spawn(
    process.execPath,
    [
      portlessCli,
      "proxy",
      "start",
      "--no-tls",
      "--foreground",
      "-p",
      String(proxyPort),
    ],
    { env: environment, stdio: ["ignore", "pipe", "pipe"] },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Portless proxy readiness timeout")),
      10000,
    );
    const failure = (error) => {
      clearTimeout(timer);
      reject(error);
    };
    proxy.once("error", failure);
    proxy.once("exit", (code) =>
      failure(new Error(`Portless exited before readiness: ${code}`)),
    );
    const output = (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      if (text.includes("HTTP proxy listening")) {
        clearTimeout(timer);
        resolve();
      }
    };
    proxy.stdout.on("data", output);
    proxy.stderr.on("data", output);
  });
  execFileSync(
    process.execPath,
    [portlessCli, "alias", "registry", String(address.port)],
    { env: environment, stdio: "inherit" },
  );
  browser = await chromium.launch({ headless: true });
  for (const { protocol, isolated } of [
    { protocol: "uci", isolated: true },
    { protocol: "usi", isolated: true },
    { protocol: "uci", isolated: false },
  ]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const errors = [],
        network = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) =>
        network.push({
          url: request.url(),
          error: request.failure()?.errorText,
        }),
      );
      await page.goto(isolated ? origin : `${origin}/unisolated`);
      await page.waitForFunction(
        () => typeof globalThis.runFairySmoke === "function",
      );
      const report = await page.evaluate(
        (value) =>
          Promise.race([
            globalThis.runFairySmoke(value),
            new Promise((resolve) =>
              globalThis.setTimeout(
                () =>
                  resolve({
                    ok: false,
                    protocol: value,
                    phase: "timeout",
                    audit: globalThis.getFairySmokeAudit(),
                  }),
                45000,
              ),
            ),
          ]),
        protocol,
      );
      report.case = `${protocol}-${isolated ? "isolated" : "unisolated"}`;
      report.errors = errors;
      report.network = network;
      reports.push(report);
      await mkdir(dirname(reportFile), { recursive: true });
      await writeFile(reportFile, `${JSON.stringify(reports, null, 2)}\n`);
      if (!isolated) {
        assert.equal(
          report.ok,
          false,
          "An unisolated page must not start this threaded engine",
        );
        assert.equal(report.phase, "load");
        assert.match(
          report.error.message,
          /crossOriginIsolated.*SharedArrayBuffer/,
        );
        assert.equal(report.environment.crossOriginIsolated, false);
        assert.equal(report.disposalAtReturn.created, 4);
        assert.equal(report.disposalAtReturn.revoked, 4);
        assert.equal(report.disposalAtReturn.workers, 0);
        assert.equal(report.disposalAtReturn.allBlobsRevoked, true);
        assert.deepEqual(report.audit.sent, []);
        assert.deepEqual(report.audit.received, []);
        assert.deepEqual(report.audit.workerErrors, []);
        assert.deepEqual(errors, []);
        assert.deepEqual(network, []);
        report.intentionalCapabilityRejection = true;
        await writeFile(reportFile, `${JSON.stringify(reports, null, 2)}\n`);
        console.log(
          `${protocol}: expected capability rejection without isolation, all 4 blobs revoked, no Worker/fallback`,
        );
        continue;
      }
      assert.equal(report.ok, true, JSON.stringify(report));
      assert.equal(report.environment.crossOriginIsolated, true);
      assert.ok(report.disposalAtReturn.created > 0);
      assert.ok(report.disposalAtReturn.workers > 0);
      assert.equal(
        report.disposalAtReturn.revoked,
        report.disposalAtReturn.created,
      );
      assert.equal(
        report.disposalAtReturn.terminated,
        report.disposalAtReturn.workers,
      );
      assert.equal(report.disposalAtReturn.allBlobsRevoked, true);
      assert.equal(report.disposalAtReturn.allWorkersTerminated, true);
      assert.ok(
        (protocol === "uci" ? chessMoves : shogiMoves).has(
          report.result.bestMove,
        ),
        JSON.stringify(report.result),
      );
      assert.ok(report.audit.sent.includes(protocol));
      assert.ok(report.audit.received.includes(`${protocol}ok`));
      assert.ok(
        report.audit.received.some((line) => line.startsWith("bestmove ")),
      );
      assert.ok(report.audit.workers.every((worker) => worker.terminated));
      assert.ok(
        report.audit.created.every((url) => report.audit.revoked.includes(url)),
      );
      assert.deepEqual(report.audit.workerErrors, []);
      assert.deepEqual(errors, []);
      assert.deepEqual(network, []);
      console.log(
        `${protocol}: real handshake, legal bestmove ${report.result.bestMove}, all ${report.audit.created.length} blobs revoked`,
      );
    } finally {
      await context.close();
    }
  }
  console.log(`Browser smoke report: ${reportFile}`);
} finally {
  await cleanup();
}
