import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigSchema, saveConfig, SessionManager } from "@nextclaw/core";
import { createUiRouter } from "./router.js";

const tempDirs: string[] = [];
const originalHome = process.env.NEXTCLAW_HOME;

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createTempConfigPath(): string {
  const dir = createTempDir("nextclaw-ui-session-type-config-");
  return join(dir, "config.json");
}

function useIsolatedHome(): string {
  const homeDir = createTempDir("nextclaw-ui-session-type-home-");
  process.env.NEXTCLAW_HOME = homeDir;
  return homeDir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  if (typeof originalHome === "string") {
    process.env.NEXTCLAW_HOME = originalHome;
  } else {
    delete process.env.NEXTCLAW_HOME;
  }
  vi.restoreAllMocks();
});

describe("chat session type routes - listing", () => {
  it("returns native default when runtime does not provide session types", async () => {
    useIsolatedHome();
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);
    const app = createUiRouter({
      configPath,
      publish: () => {},
      chatRuntime: {
        processTurn: vi.fn(async () => ({
          reply: "ok",
          sessionKey: "agent:main:ui:direct:web-test"
        }))
      }
    });

    const response = await app.request("http://localhost/api/chat/session-types");
    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: boolean;
      data: {
        defaultType: string;
        options: Array<{ value: string; label: string }>;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data.defaultType).toBe("native");
    expect(payload.data.options).toEqual([
      { value: "native", label: "Native" }
    ]);
  });

  it("formats non-native runtime labels generically when the runtime does not provide an explicit label", async () => {
    useIsolatedHome();
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);
    const app = createUiRouter({
      configPath,
      publish: () => {},
      chatRuntime: {
        processTurn: vi.fn(async () => ({
          reply: "ok",
          sessionKey: "agent:main:ui:direct:web-test"
        })),
        listSessionTypes: vi.fn(async () => ({
          defaultType: "native",
          options: [{ value: "workspace-agent", label: "" }]
        }))
      }
    });

    const response = await app.request("http://localhost/api/chat/session-types");
    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: boolean;
      data: {
        defaultType: string;
        options: Array<{ value: string; label: string }>;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data.options).toEqual([
      { value: "native", label: "Native" },
      { value: "workspace-agent", label: "Workspace Agent" }
    ]);
  });

  it("keeps existing typed session unchanged when plugin becomes unavailable", async () => {
    useIsolatedHome();
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);
    const sessionManager = new SessionManager(".");
    const session = sessionManager.getOrCreate("agent:main:ui:direct:web-keep-codex");
    session.metadata.session_type = "codex-sdk";
    session.metadata.preferred_thinking = "high";
    sessionManager.addMessage(session, "user", "hello");
    sessionManager.save(session);

    const app = createUiRouter({
      configPath,
      publish: () => {},
      chatRuntime: {
        processTurn: vi.fn(async () => ({
          reply: "ok",
          sessionKey: session.key
        })),
        listSessionTypes: vi.fn(async () => ({
          defaultType: "native",
          options: [{ value: "native", label: "Native" }]
        }))
      }
    });

    const response = await app.request("http://localhost/api/sessions");
    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: boolean;
      data: {
        sessions: Array<{ key: string; sessionType: string; sessionTypeMutable: boolean; preferredThinking?: string | null }>;
      };
    };
    expect(payload.ok).toBe(true);
    const target = payload.data.sessions.find((item) => item.key === session.key);
    expect(target).toBeTruthy();
    expect(target?.sessionType).toBe("codex-sdk");
    expect(target?.sessionTypeMutable).toBe(false);
    expect(target?.preferredThinking).toBe("high");
  });

});

describe("chat session type routes - mutability", () => {
  it("allows changing session type before first user message", async () => {
    useIsolatedHome();
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);
    const sessionManager = new SessionManager(".");
    const session = sessionManager.getOrCreate("agent:main:ui:direct:web-before-first-message");
    sessionManager.save(session);

    const app = createUiRouter({
      configPath,
      publish: () => {},
      chatRuntime: {
        processTurn: vi.fn(async () => ({
          reply: "ok",
          sessionKey: session.key
        })),
        listSessionTypes: vi.fn(async () => ({
          defaultType: "native",
          options: [
            { value: "native", label: "Native" },
            { value: "codex-sdk", label: "Codex" }
          ]
        }))
      }
    });

    const response = await app.request(`http://localhost/api/sessions/${encodeURIComponent(session.key)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionType: "codex-sdk"
      })
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: boolean;
      data: {
        key: string;
        sessionType: string;
        sessionTypeMutable: boolean;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data.key).toBe(session.key);
    expect(payload.data.sessionType).toBe("codex-sdk");
    expect(payload.data.sessionTypeMutable).toBe(true);
  });

  it("rejects changing session type after first user message", async () => {
    useIsolatedHome();
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);
    const sessionManager = new SessionManager(".");
    const session = sessionManager.getOrCreate("agent:main:ui:direct:web-after-first-message");
    sessionManager.addMessage(session, "user", "hello");
    sessionManager.save(session);

    const app = createUiRouter({
      configPath,
      publish: () => {},
      chatRuntime: {
        processTurn: vi.fn(async () => ({
          reply: "ok",
          sessionKey: session.key
        })),
        listSessionTypes: vi.fn(async () => ({
          defaultType: "native",
          options: [
            { value: "native", label: "Native" },
            { value: "codex-sdk", label: "Codex" }
          ]
        }))
      }
    });

    const response = await app.request(`http://localhost/api/sessions/${encodeURIComponent(session.key)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionType: "codex-sdk"
      })
    });
    expect(response.status).toBe(409);
    const payload = await response.json() as {
      ok: boolean;
      error: {
        code: string;
      };
    };
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("SESSION_TYPE_IMMUTABLE");
  });

  it("persists preferred model and preferred thinking to session metadata", async () => {
    useIsolatedHome();
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);
    const sessionManager = new SessionManager(".");
    const session = sessionManager.getOrCreate("agent:main:ui:direct:web-session-preferences");
    sessionManager.save(session);

    const app = createUiRouter({
      configPath,
      publish: () => {},
      chatRuntime: {
        processTurn: vi.fn(async () => ({
          reply: "ok",
          sessionKey: session.key
        })),
        listSessionTypes: vi.fn(async () => ({
          defaultType: "native",
          options: [{ value: "native", label: "Native" }]
        }))
      }
    });

    const response = await app.request(`http://localhost/api/sessions/${encodeURIComponent(session.key)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        preferredModel: "openai/gpt-5",
        preferredThinking: "high"
      })
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: boolean;
      data: {
        metadata: Record<string, unknown>;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data.metadata.preferred_model).toBe("openai/gpt-5");
    expect(payload.data.metadata.preferred_thinking).toBe("high");
  });
});
