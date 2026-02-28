import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { ConfigSchema, saveConfig } from "@nextclaw/core";
import { createUiRouter } from "./router.js";

const tempDirs: string[] = [];

function createTempConfigPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "nextclaw-ui-provider-test-"));
  tempDirs.push(dir);
  return join(dir, "config.json");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("provider connection test route", () => {
  it("returns 404 for unknown provider", async () => {
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);

    const app = createUiRouter({
      configPath,
      publish: () => {}
    });

    const response = await app.request("http://localhost/api/config/providers/not-exists/test", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(404);
    const payload = await response.json() as {
      ok: false;
      error: {
        code: string;
      };
    };
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("NOT_FOUND");
  });

  it("returns a failed result when api key is explicitly empty", async () => {
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);

    const app = createUiRouter({
      configPath,
      publish: () => {}
    });

    const response = await app.request("http://localhost/api/config/providers/openai/test", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        apiKey: ""
      })
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: true;
      data: {
        success: boolean;
        message: string;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data.success).toBe(false);
    expect(payload.data.message).toContain("API key is required");
  });
});
