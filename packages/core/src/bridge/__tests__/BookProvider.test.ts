import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookProvider } from "../BookProvider.js";
import { IEngineLoader, IBookAsset } from "../../types.js";

describe("BookProvider", () => {
  let mockLoader: { loadResource: ReturnType<typeof vi.fn> };
  let provider: BookProvider;

  beforeEach(() => {
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:book"),
    };
    provider = new BookProvider(mockLoader as unknown as IEngineLoader);
  });

  it("should load a book asset via the loader", async () => {
    const asset: IBookAsset = {
      id: "opening-book",
      url: "https://test.com/book.bin",
      type: "bin",
      sri: "sha384-placeholder",
    };

    const url = await provider.loadBook(asset);

    expect(url).toBe("blob:book");
    expect(mockLoader.loadResource).toHaveBeenCalledWith(
      "common-books",
      expect.objectContaining({
        url: asset.url,
        type: "asset",
        sri: asset.sri,
      }),
      undefined,
    );
  });

  it("should handle books without SRI using __unsafeNoSRI", async () => {
    const asset: IBookAsset = {
      id: "no-sri-book",
      url: "https://test.com/no-sri.bin",
      type: "bin",
      __unsafeNoSRI: true,
    };

    await provider.loadBook(asset);

    expect(mockLoader.loadResource).toHaveBeenCalledWith(
      "common-books",
      expect.objectContaining({ __unsafeNoSRI: true }),
      undefined,
    );
  });

  it("should include size in config if provided", async () => {
    const asset: IBookAsset = {
      id: "large-book",
      url: "u",
      type: "bin",
      size: 1024,
      sri: "sha384-s",
    };
    await provider.loadBook(asset);
    expect(mockLoader.loadResource).toHaveBeenCalledWith(
      "common-books",
      expect.objectContaining({ size: 1024 }),
      undefined,
    );
  });

  it("should list cached books", async () => {
    await expect(provider.listCachedBooks()).resolves.toEqual([]);
  });

  it("should delete a book", async () => {
    await expect(provider.deleteBook("b1")).resolves.toBeUndefined();
  });
});
