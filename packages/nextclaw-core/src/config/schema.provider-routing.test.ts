import { describe, expect, it } from "vitest";
import { ConfigSchema, getApiBase } from "./schema.js";

describe("provider apiBase routing", () => {
  it("uses provider default api base for non-gateway providers when apiBase is unset", () => {
    const config = ConfigSchema.parse({
      providers: {
        deepseek: {
          apiKey: "sk-deepseek"
        }
      }
    });

    expect(getApiBase(config, "deepseek-chat")).toBe("https://api.deepseek.com");
  });

  it("prefers explicit provider apiBase over provider default", () => {
    const config = ConfigSchema.parse({
      providers: {
        deepseek: {
          apiKey: "sk-deepseek",
          apiBase: "https://custom.deepseek.example/v1"
        }
      }
    });

    expect(getApiBase(config, "deepseek-chat")).toBe("https://custom.deepseek.example/v1");
  });
});
