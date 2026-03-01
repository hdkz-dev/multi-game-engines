import { describe, it, expect } from "vitest";
import { createEdaxEngine } from "../index.js";

describe("createEdaxEngine", () => {
  it("should throw when sources.main is missing from both registry and config", () => {
    // EdaxはレジストリにURLが登録されているため、通常は解決される。
    // しかし、存在しないバージョンを指定すると registrySources が空になり、
    // config.sources も未指定の場合に sources.main が欠落する。
    expect(() =>
      createEdaxEngine({
        version: "99.99.99-nonexistent",
        sources: undefined,
      }),
    ).toThrow('requires a "main" source');
  });

  it("should not throw when sources.main is provided via config", () => {
    // ファクトリ関数自体はエラーを投げないが、
    // Worker の生成でエラーになるためここではファクトリの戻り値のみ確認
    expect(() =>
      createEdaxEngine({
        version: "99.99.99-nonexistent",
        sources: {
          main: {
            url: "http://localhost/edax.js",
            sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            type: "worker-js",
          },
        },
      }),
    ).not.toThrow();
  });
});
