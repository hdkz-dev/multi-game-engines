import { describe, it, expect } from "vitest";
import { normalizeAndValidateSources } from "../ConfigValidator.js";
import { IEngineConfig, IEngineSourceConfig } from "../../types.js";

describe("ConfigValidator", () => {
  describe("normalizeAndValidateSources", () => {
    it("should merge registry and config sources", () => {
      const registrySources = {
        main: { url: "reg-main.js", type: "script", sri: "sri1" },
        wasm: { url: "reg-wasm.wasm", type: "wasm", sri: "sri2" },
      } as IEngineConfig["sources"];

      const config: IEngineConfig = {
        sources: {
          main: { url: "cfg-main.js", type: "script", sri: "sri3" },
        },
      };

      const result = normalizeAndValidateSources(
        registrySources,
        config,
        "test",
      );
      expect(result).toEqual({
        main: { url: "cfg-main.js", type: "script", sri: "sri3" },
        wasm: { url: "reg-wasm.wasm", type: "wasm", sri: "sri2" },
      });
    });

    it("should throw error if main source is missing", () => {
      const config = {
        sources: {
          main: undefined as unknown as IEngineSourceConfig,
          other: {
            url: "other.js",
            type: "script",
            sri: "sri",
          } as unknown as IEngineSourceConfig,
        },
      } as unknown as IEngineConfig;

      expect(() =>
        normalizeAndValidateSources(
          {} as IEngineConfig["sources"],
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
        normalizeAndValidateSources(undefined, config, "fallback-id"),
      ).toThrow(
        expect.objectContaining({ i18nKey: "factory.requiresMainSource" }),
      );
    });
  });
});
