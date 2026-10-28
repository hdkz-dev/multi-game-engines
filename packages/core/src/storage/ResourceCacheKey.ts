/** Fixed-length identity of the complete URL and integrity metadata. */
export async function resourceCacheKey(
  url: string,
  sri: string,
): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify([url, sri]));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
