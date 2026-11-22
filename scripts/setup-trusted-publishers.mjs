#!/usr/bin/env node
/**
 * setup-trusted-publishers.mjs
 *
 * npm Trusted Publishers (OIDC) を全公開パッケージに一括設定する。
 * npm CLI 11.15.0+ の `npm trust github` コマンドを使用
 * （`--allow-publish` / `--allow-stage-publish` 必須化および Staged Publishing 要件に対応）。
 *
 * 2026-10-02 以降の npm 仕様に関する重要事項:
 *   - 新規作成した Trusted Publishing 設定は 48 時間（2 日）以内に初回公開が完了しないと自動失効する。
 *   - バルク実行時の初回 Web 2FA で「Skip 2FA for 5 minutes」を有効化し、
 *     呼び出し間隔 2 秒（53 件 ≒ 約 106 秒）で一括登録することを推奨する。
 *
 * 使い方:
 *   node scripts/setup-trusted-publishers.mjs [options]
 *
 * オプション:
 *   --mode=direct|stage|both   許可する公開アクション（既定: direct -> --allow-publish）
 *   --sleep-ms=<ms>            リクエスト間の待機ミリ秒（既定: 2000、--dry-run 時は 0）
 *   --filter=<substring>       パッケージ名の部分一致フィルタ
 *   --otp <code>               TOTP 利用者向けワンタイムパスワード
 *   --dry-run                  ログイン不要で実行予定コマンドを表示して終了
 */

import console from "node:console";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const REPO = "hdkz-dev/multi-game-engines";
const WORKFLOW_FILE = "release.yml";
const MIN_NPM_VERSION = [11, 15, 0];
const DEFAULT_SLEEP_MS = 2000;

const MODE_FLAGS = {
  direct: ["--allow-publish"],
  stage: ["--allow-stage-publish"],
  both: ["--allow-publish", "--allow-stage-publish"],
};

/**
 * Checks whether the given npm semver satisfies the minimum version (11.15.0).
 * @param {string} version
 * @returns {boolean}
 */
export function isNpmVersionSupported(version = "") {
  const cleaned = String(version).trim().replace(/^v/i, "");
  const parts = cleaned.split(/[.-]/).slice(0, 3).map(Number);
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [major, minor, patch] = parts;
  const [reqMajor, reqMinor, reqPatch] = MIN_NPM_VERSION;
  if (major !== reqMajor) return major > reqMajor;
  if (minor !== reqMinor) return minor > reqMinor;
  return patch >= reqPatch;
}

/**
 * Parses CLI flags into validated options.
 * @param {string[]} argv
 * @returns {{ mode: "direct" | "stage" | "both", dryRun: boolean, sleepMs: number, filter: string | null, otp: string | null }}
 */
export function parseCliArgs(argv) {
  let mode = "direct";
  let dryRun = false;
  let sleepMs = DEFAULT_SLEEP_MS;
  let sleepExplicit = false;
  let filter = null;
  let otp = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--mode" && argv[i + 1]) {
      mode = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length);
    } else if (arg === "--sleep-ms" && argv[i + 1]) {
      sleepMs = Number(argv[i + 1]);
      sleepExplicit = true;
      i += 1;
    } else if (arg.startsWith("--sleep-ms=")) {
      sleepMs = Number(arg.slice("--sleep-ms=".length));
      sleepExplicit = true;
    } else if (arg === "--filter" && argv[i + 1]) {
      filter = arg[i + 1];
      i += 1;
    } else if (arg.startsWith("--filter=")) {
      filter = arg.slice("--filter=".length);
    } else if (arg === "--otp" && argv[i + 1]) {
      otp = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--otp=")) {
      otp = arg.slice("--otp=".length);
    } else {
      throw new Error(`未対応のオプションです: ${arg}`);
    }
  }

  if (!Object.hasOwn(MODE_FLAGS, mode)) {
    throw new Error(
      `不正な --mode 指定 "${mode}" です（direct | stage | both のいずれかを指定してください）`,
    );
  }
  if (!Number.isFinite(sleepMs) || sleepMs < 0) {
    throw new Error(`不正な --sleep-ms 指定です: ${sleepMs}`);
  }
  if (dryRun && !sleepExplicit) {
    sleepMs = 0;
  }

  return { mode, dryRun, sleepMs, filter, otp };
}

/**
 * Builds the `npm trust github` arguments for a package.
 * @param {{ pkg: string, repo?: string, workflow?: string, mode?: "direct" | "stage" | "both", otp?: string | null }} params
 * @returns {string[]}
 */
export function buildTrustArgs({
  pkg,
  repo = REPO,
  workflow = WORKFLOW_FILE,
  mode = "direct",
  otp = null,
}) {
  const permissionFlags = MODE_FLAGS[mode];
  if (!permissionFlags) {
    throw new Error(`不正な mode です: ${mode}`);
  }
  const base = [
    "trust",
    "github",
    pkg,
    "--repo",
    repo,
    "--file",
    workflow,
    ...permissionFlags,
    "--yes",
  ];
  return otp ? [...base, "--otp", otp] : base;
}

/**
 * Verifies whether an `npm trust list --json` payload matches repo, workflow, active status, and requested permissions.
 * @param {unknown} list
 * @param {{ repo?: string, workflow?: string, mode?: "direct" | "stage" | "both" }} options
 * @returns {boolean}
 */
export function isTrustEntryConfigured(
  list,
  { repo = REPO, workflow = WORKFLOW_FILE, mode = "direct" } = {},
) {
  if (!Array.isArray(list)) return false;

  return list.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const rec = entry;
    const typeOk = rec.type === "github" || rec.provider === "github";
    const repoOk = rec.repository === repo || rec.repo === repo;
    const workflowOk =
      rec.workflow === workflow ||
      rec.file === workflow ||
      rec.claims?.workflow_ref?.includes(`/${workflow}`);
    if (!typeOk || !repoOk || !workflowOk) return false;
    if (rec.expired === true || rec.status === "expired") return false;

    const actions = Array.isArray(rec.allowedActions)
      ? rec.allowedActions
      : Array.isArray(rec.actions)
        ? rec.actions
        : null;
    if (actions) {
      const needsPublish = mode === "direct" || mode === "both";
      const needsStage = mode === "stage" || mode === "both";
      const hasPublish =
        actions.includes("publish") || actions.includes("npm publish");
      const hasStage =
        actions.includes("stage") ||
        actions.includes("stage-publish") ||
        actions.includes("npm stage publish");
      if (needsPublish && !hasPublish) return false;
      if (needsStage && !hasStage) return false;
    }

    if (
      typeof rec.allowPublish === "boolean" &&
      (mode === "direct" || mode === "both") &&
      !rec.allowPublish
    ) {
      return false;
    }
    if (
      typeof rec.allowStagePublish === "boolean" &&
      (mode === "stage" || mode === "both") &&
      !rec.allowStagePublish
    ) {
      return false;
    }

    return true;
  });
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawnSync(cmd, args, { stdio: "ignore" });
}

async function pollForToken(doneUrl, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await globalThis.fetch(doneUrl);
      if (res.status === 200) {
        const body = await res.json();
        if (body?.token) return body.token;
      }
    } catch {
      // Transient network poll error can be retried until deadline.
    }
    await delay(2000);
  }
  return null;
}

function parseEotpUrls(stderr) {
  const auth = stderr.match(
    /https:\/\/www\.npmjs\.com\/auth\/cli\/[^\s]+/,
  )?.[0];
  const done = stderr.match(
    /https:\/\/registry\.npmjs\.org\/-\/v1\/done\?authId=[^\s]+/,
  )?.[0];
  return { authUrl: auth ?? null, doneUrl: done ?? null };
}

async function getPublicPackages(filter) {
  const dirs = await readdir(join(root, "packages"));
  return dirs
    .map((dir) => {
      const p = join(root, "packages", dir, "package.json");
      if (!existsSync(p)) return null;
      const pkg = JSON.parse(readFileSync(p, "utf8"));
      return !pkg.private && pkg.name?.startsWith("@multi-game-engines/")
        ? pkg.name
        : null;
    })
    .filter((name) => Boolean(name) && (!filter || name.includes(filter)))
    .toSorted();
}

async function main() {
  let options;
  try {
    options = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `❌ ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  const npmVersion = spawnSync("npm", ["--version"], {
    encoding: "utf8",
  }).stdout.trim();
  const npmSupported = isNpmVersionSupported(npmVersion);
  if (!npmSupported && !options.dryRun) {
    console.error(
      `❌ npm ${npmVersion || "(unknown)"} — npm 11.15.0 以上が必要です`,
    );
    process.exit(1);
  }
  console.log(
    npmSupported
      ? `✅ npm ${npmVersion}`
      : `⚠️  npm ${npmVersion || "(unknown)"}（実実行時は npm 11.15.0+ が必須です）`,
  );

  let sessionOtp = options.otp;
  if (!options.dryRun) {
    const whoami = spawnSync("npm", ["whoami"], {
      encoding: "utf8",
      stdio: "pipe",
    });
    if (whoami.status !== 0) {
      console.error("❌ 未認証。先に npm login を実行してください。");
      process.exit(1);
    }
    console.log(`👤 npm ユーザー: ${whoami.stdout.trim()}\n`);
  }

  const packages = await getPublicPackages(options.filter);
  if (packages.length === 0) {
    console.error("❌ 対象パッケージが見つかりませんでした。");
    process.exit(1);
  }

  console.log(
    `📦 対象: ${packages.length} 件 | mode: ${options.mode} (${MODE_FLAGS[options.mode].join(" ")}) | ${REPO} / ${WORKFLOW_FILE}`,
  );
  if (options.dryRun) {
    console.log(
      "🧪 ドライランモード（実際の登録・ログイン確認は行いません）\n",
    );
  } else {
    console.log(
      "🔐 推奨手順: 初回ブラウザ 2FA で「Skip 2FA for 5 minutes」を有効化してください",
    );
    console.log(
      `⏱️  レート制限回避のため各パッケージ間に ${options.sleepMs}ms 待機します（完了予定 ≒ ${Math.ceil((packages.length * options.sleepMs) / 1000)} 秒）\n`,
    );
  }

  const localNpmrc = join(root, ".npmrc");
  const origNpmrc = existsSync(localNpmrc)
    ? readFileSync(localNpmrc, "utf8")
    : null;
  const setSessionToken = (token) => {
    writeFileSync(
      localNpmrc,
      `//registry.npmjs.org/:_authToken=${token}\n`,
      "utf8",
    );
  };
  const restoreNpmrc = () => {
    if (origNpmrc !== null) writeFileSync(localNpmrc, origNpmrc, "utf8");
    else if (existsSync(localNpmrc)) unlinkSync(localNpmrc);
  };

  const isAlreadyConfigured = (pkg) => {
    const listArgs = ["trust", "list", pkg, "--json"];
    const args = sessionOtp ? [...listArgs, "--otp", sessionOtp] : listArgs;
    const result = spawnSync("npm", args, {
      encoding: "utf8",
      stdio: "pipe",
      cwd: root,
    });
    if (result.status !== 0) return false;
    try {
      return isTrustEntryConfigured(JSON.parse(result.stdout), {
        repo: REPO,
        workflow: WORKFLOW_FILE,
        mode: options.mode,
      });
    } catch {
      return false;
    }
  };

  const trustPackage = async (pkg) => {
    const args = buildTrustArgs({
      pkg,
      repo: REPO,
      workflow: WORKFLOW_FILE,
      mode: options.mode,
      otp: sessionOtp,
    });

    if (options.dryRun) {
      console.log(`  [dry-run] npm ${args.join(" ")}`);
      return true;
    }

    const result = spawnSync("npm", args, {
      encoding: "utf8",
      stdio: "pipe",
      cwd: root,
    });
    if (result.status === 0) return true;

    const stderr = result.stderr ?? "";
    if (!stderr.includes("EOTP")) {
      const msg =
        stderr.split("\n").find((line) => line.startsWith("npm error")) ??
        stderr;
      console.log(`  ❌ ${msg}`);
      return false;
    }

    const { authUrl, doneUrl } = parseEotpUrls(stderr);
    if (!authUrl || !doneUrl) {
      console.log("  ❌ 認証 URL を取得できませんでした");
      return false;
    }

    console.log(`  🌐 ブラウザで認証してください: ${authUrl}`);
    openBrowser(authUrl);
    process.stdout.write("  ⏳ 認証完了を待機中 ...");

    const token = await pollForToken(doneUrl);
    console.log();

    if (!token) {
      console.log("  ❌ 認証タイムアウト（120 秒）");
      return false;
    }

    console.log("  🔑 認証完了、トークンを取得しました");
    sessionOtp = token;
    setSessionToken(token);

    const retry = spawnSync(
      "npm",
      buildTrustArgs({
        pkg,
        repo: REPO,
        workflow: WORKFLOW_FILE,
        mode: options.mode,
      }),
      { encoding: "utf8", stdio: "pipe", cwd: root },
    );
    if (retry.status === 0) return true;

    const retryEnv = spawnSync(
      "npm",
      buildTrustArgs({
        pkg,
        repo: REPO,
        workflow: WORKFLOW_FILE,
        mode: options.mode,
      }),
      {
        encoding: "utf8",
        stdio: "pipe",
        cwd: root,
        env: { ...process.env, NODE_AUTH_TOKEN: token },
      },
    );
    if (retryEnv.status === 0) return true;

    const errMsg =
      (retryEnv.stderr ?? "")
        .split("\n")
        .find((line) => line.startsWith("npm error")) ?? "";
    console.log(`  ❌ 再試行失敗: ${errMsg}`);
    return false;
  };

  let configured = 0;
  let skipped = 0;
  const failed = [];

  try {
    for (let i = 0; i < packages.length; i += 1) {
      const pkg = packages[i];
      console.log(
        `[${String(i + 1).padStart(2, "0")}/${packages.length}] ${pkg}`,
      );

      if (!options.dryRun && isAlreadyConfigured(pkg)) {
        console.log("  ⏭  already configured\n");
        skipped += 1;
        continue;
      }

      const ok = await trustPackage(pkg);
      if (ok) {
        console.log("  ✅ done\n");
        configured += 1;
      } else {
        failed.push(pkg);
      }

      if (!options.dryRun && options.sleepMs > 0 && i < packages.length - 1) {
        await delay(options.sleepMs);
      }
    }
  } finally {
    if (!options.dryRun) {
      restoreNpmrc();
    }
  }

  console.log("────────────────────────────────────────");
  if (skipped > 0) console.log(`⏭  既設定スキップ: ${skipped} 件`);
  if (configured > 0) console.log(`✅ 設定完了: ${configured} 件`);
  if (failed.length > 0) {
    console.log(`❌ 失敗: ${failed.length} 件`);
    for (const p of failed) console.log(`   - ${p}`);
    process.exit(1);
  }

  if (!options.dryRun && configured + skipped === packages.length) {
    console.log(
      "\n🎉 全対象パッケージへの Trusted Publisher 設定が完了しました！",
    );
    console.log("\n⚠️  重要（48 時間自動失効ルール）:");
    console.log(
      "   未検証の Trusted Publisher 設定は 48 時間（2 日）以内に初回 OIDC 公開しないと自動失効します。",
    );
    console.log(
      "   設定した全パッケージを含むリリース PR を 48 時間以内に実行・公開して設定を恒久化してください。",
    );
    console.log("\n📋 Phase 1 → Phase 2 の次ステップ:");
    console.log(
      "   1. release.yml の OIDC 公開で全 53 パッケージを公開・Provenance を確認",
    );
    console.log(
      '   2. npmjs.com 各パッケージ設定で "Require two-factor authentication and disallow tokens" を有効化',
    );
    console.log(
      "   3. gh secret delete NPM_TOKEN --repo hdkz-dev/multi-game-engines（および npm 上の GAT Revoke）",
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
