/**
 * エンジンバイナリ CDN 用の Cloudflare Worker
 *
 * 機能:
 * - R2 バケットからのファイル配信
 * - CORS ヘッダー追加
 * - キャッシュ制御
 * - アクセスログ
 */

import type { IEngineManifestIndex } from "@multi-game-engines/core";

export interface Env {
  ENGINE_BUCKET: R2Bucket;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

/**
 * セキュリティヘッダー (2026年標準)
 * CORS隔離環境 (SharedArrayBuffer) での動作を保証
 */
const SECURITY_HEADERS = {
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-Content-Type-Options": "nosniff",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const requestId = request.headers.get("cf-ray") || crypto.randomUUID();

    /**
     * 基本的なエラーレスポンス作成ヘルパー (CORSヘッダーを含む)
     */
    const errorResponse = (msg: string, status: number, details?: string) => {
      console.error(
        `[${requestId}] Error ${status}: ${msg} ${details ? `(${details})` : ""}`,
      );
      return new Response(msg, {
        status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Request-Id": requestId,
          ...CORS_HEADERS,
        },
      });
    };

    // CORS プリフライト
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // GET のみ許可
    if (request.method !== "GET") {
      return errorResponse("Method Not Allowed", 405);
    }

    // パス・トラバーサルおよび不正なパスの防御
    let normalizedPath: string;
    try {
      // 正規化されたパスでチェック
      normalizedPath = decodeURIComponent(path).replace(/\/+/g, "/");
    } catch (e) {
      return errorResponse("Bad Request: Malformed URL encoding", 400);
    }

    if (normalizedPath.includes("..") || normalizedPath.includes("./")) {
      return errorResponse("Forbidden: Invalid path patterns detected", 403);
    }

    // ヘルスチェック
    if (normalizedPath === "/health") {
      return new Response("OK", {
        headers: {
          "Content-Type": "text/plain",
          ...SECURITY_HEADERS,
        },
      });
    }

    // ルートマニフェスト
    if (normalizedPath === "/" || normalizedPath === "/manifest.json") {
      const object = await env.ENGINE_BUCKET.get("manifest.json");
      if (!object) {
        return errorResponse("Manifest Not Found", 404);
      }
      return new Response(object.body, {
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
          ...SECURITY_HEADERS,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // /v1/{engine}/{version}/{file} 形式のパスをパース
    // v1 プレフィックスの強制
    const match = normalizedPath.match(/^\/v1\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) {
      return errorResponse("Invalid API Version or Path Structure", 400);
    }

    const [, engine, version, file] = match;

    // 個別のパラメータに対するバリデーション (英数字、ハイフン、ドット、アンダースコア、スラッシュを許可)
    const safePattern = /^[a-zA-Z0-9.\-_/]+$/;
    if (
      !safePattern.test(engine) ||
      !safePattern.test(version) ||
      !safePattern.test(file)
    ) {
      return errorResponse("Forbidden: Malformed characters in path", 403);
    }

    const objectKey = `${engine}/${version}/${file}`;

    // R2 からオブジェクト取得
    const object = await env.ENGINE_BUCKET.get(objectKey);
    if (!object) {
      return errorResponse("Engine Binary Not Found", 404);
    }

    // Content-Type 決定
    let contentType = "application/octet-stream";
    if (file.endsWith(".wasm")) {
      contentType = "application/wasm";
    } else if (file.endsWith(".js")) {
      contentType = "application/javascript";
    } else if (file.endsWith(".mjs")) {
      contentType = "text/javascript";
    } else if (file.endsWith(".json")) {
      contentType = "application/json";
    }

    // レスポンス作成
    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": object.size.toString(),
        ETag: object.httpEtag,
        ...CORS_HEADERS,
        ...SECURITY_HEADERS,
        ...CACHE_HEADERS,
      },
    });
  },
};
