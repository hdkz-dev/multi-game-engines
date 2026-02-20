/**
 * Cloudflare Worker for Engine Binary CDN
 *
 * Features:
 * - File delivery from R2 bucket
 * - CORS header addition
 * - Cache control
 * - Access logging
 */

// import type { IEngineManifestIndex } from "@multi-game-engines/core";

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
 * Security Headers (2026 Standard)
 * Ensures operation in CORS isolated environments (SharedArrayBuffer)
 */
const SECURITY_HEADERS = {
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const requestId = request.headers.get("cf-ray") || crypto.randomUUID();

    /**
     * Helper to create basic error response (including CORS headers)
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
          ...SECURITY_HEADERS,
        },
      });
    };

    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Allow GET only
    if (request.method !== "GET") {
      return errorResponse("Method Not Allowed", 405);
    }

    // Defense against path traversal and malformed paths
    let normalizedPath: string;
    try {
      // Check with normalized path
      normalizedPath = decodeURIComponent(path).replace(/\/+/g, "/");
    } catch {
      return errorResponse("Bad Request: Malformed URL encoding", 400);
    }

    if (normalizedPath.includes("..") || normalizedPath.includes("./")) {
      return errorResponse("Forbidden: Invalid path patterns detected", 403);
    }

    // Health check
    if (normalizedPath === "/health") {
      return new Response("OK", {
        headers: {
          "Content-Type": "text/plain",
          ...CORS_HEADERS,
          ...SECURITY_HEADERS,
        },
      });
    }

    // Root manifest
    if (normalizedPath === "/" || normalizedPath === "/manifest.json") {
      const object = await env.ENGINE_BUCKET.get("manifest.json");
      if (!object) {
        return errorResponse("Manifest Not Found", 404);
      }
      return new Response(object.body, {
        headers: {
          "Content-Type": "application/json",
          "Content-Length": object.size.toString(),
          ETag: object.httpEtag,
          ...CORS_HEADERS,
          ...SECURITY_HEADERS,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Parse path in format /v1/{engine}/{version}/{file}
    // Enforce v1 prefix
    const match = normalizedPath.match(/^\/v1\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) {
      return errorResponse("Invalid API Version or Path Structure", 400);
    }

    const [, engine, version, file] = match;

    // Validation for individual parameters (allow alphanumeric, hyphen, dot, underscore, slash)
    const safePattern = /^[a-zA-Z0-9.\-_/]+$/;
    if (
      !safePattern.test(engine) ||
      !safePattern.test(version) ||
      !safePattern.test(file)
    ) {
      return errorResponse("Forbidden: Malformed characters in path", 403);
    }

    const objectKey = `${engine}/${version}/${file}`;

    // Get object from R2
    const object = await env.ENGINE_BUCKET.get(objectKey);
    if (!object) {
      return errorResponse("Engine Binary Not Found", 404);
    }

    // Determine Content-Type
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

    // Create response
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
