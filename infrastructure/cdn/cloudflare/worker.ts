/**
 * Cloudflare Worker for Engine Binary CDN
 *
 * 機能:
 * - R2 バケットからのファイル配信
 * - CORS ヘッダー追加
 * - キャッシュ制御
 * - アクセスログ
 */

export interface Env {
  ENGINE_BUCKET: R2Bucket;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, Accept",
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

    // CORS プリフライト
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS_HEADERS,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // GET のみ許可
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // ヘルスチェック
    if (path === "/health") {
      return new Response("OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // ルートマニフェスト
    if (path === "/" || path === "/manifest.json") {
      const object = await env.ENGINE_BUCKET.get("manifest.json");
      if (!object) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(object.body, {
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // /v1/{engine}/{version}/{file} 形式のパスをパース
    const match = path.match(/^\/v1\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    const [, engine, version, file] = match;
    const objectKey = `${engine}/${version}/${file}`;

    // R2 からオブジェクト取得
    const object = await env.ENGINE_BUCKET.get(objectKey);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    // Content-Type 決定
    let contentType = "application/octet-stream";
    if (file.endsWith(".wasm")) {
      contentType = "application/wasm";
    } else if (file.endsWith(".js")) {
      contentType = "application/javascript";
    } else if (file.endsWith(".json")) {
      contentType = "application/json";
    }

    // レスポンス
    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": object.size.toString(),
        ETag: object.httpEtag,
        ...CORS_HEADERS,
        ...CACHE_HEADERS,
      },
    });
  },
};
