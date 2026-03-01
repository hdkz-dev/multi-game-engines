import { describe, it, expect } from "vitest";
import { normalizeAndValidateSources } from "../ConfigValidator.js";
import { IEngineConfig, IEngineSourceConfig } from "../../types.js";

describe("ConfigValidator", () => {
  describe("normalizeAndValidateSources", () => {
    it("should merge registry and config sources", () => {
      const registrySources: {
        main: IEngineSourceConfig;
        wasm: IEngineSourceConfig;
      } = {
        main: { url: "reg-main.js", type: "script", sri: "sri1" },
        wasm: { url: "reg-wasm.wasm", type: "wasm", sri: "sri2" },
      };
      const config: IEngineConfig = {
        sources: {
          main: { url: "cfg-main.js", type: "script", sri: "sri3" },
        },
      };

      const result = normalizeAndValidateSources(
        registrySources as unknown as { main: IEngineSourceConfig },
        config,
        "test",
      );
      expect(result).toEqual({
        main: { url: "cfg-main.js", type: "script", sri: "sri3" },
        wasm: { url: "reg-wasm.wasm", type: "wasm", sri: "sri2" },
      });
    });

    it("should throw error if main source is missing", () => {
      const config: IEngineConfig = {
        sources: {
          main: undefined as unknown as IEngineSourceConfig,
          other: {
            url: "other.js",
            type: "script",
            sri: "sri",
          } as unknown as IEngineSourceConfig,
        },
      };

      expect(() =>
        normalizeAndValidateSources(
          {} as unknown as { main: IEngineSourceConfig },
          config,
          "test",
        ),
      ).toThrow(
        expect.objectContaining({ i18nKey: "factory.requiresMainSource" }),
      );
    });

    it("should use defaultEngineId in error message if config.id is missing", () => {
      const config: IEngineConfig = {};
      expect(() =>
        normalizeAndValidateSources(
          undefined as unknown as { main: IEngineSourceConfig },
          config,
          "fallback-id",
        ),
      ).toThrow(/Engine "fallback-id" requires a "main" source/);
    });
  });
});
