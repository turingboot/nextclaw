import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigSchema, SessionManager, type Config, type AgentEngine } from "@nextclaw/core";
import { GatewayAgentRuntimePool } from "./agent-runtime-pool.js";

const tempWorkspaces: string[] = [];

function createWorkspace(): string {
  const workspace = mkdtempSync(join(tmpdir(), "nextclaw-runtime-pool-command-test-"));
  tempWorkspaces.push(workspace);
  return workspace;
}

afterEach(() => {
  while (tempWorkspaces.length > 0) {
    const workspace = tempWorkspaces.pop();
    if (!workspace) {
      continue;
    }
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createConfig(workspace: string): Config {
  return ConfigSchema.parse({
    agents: {
      defaults: {
        workspace,
        engine: "mock",
        model: "openai/gpt-5"
      }
    }
  });
}

function createRuntimePool(params: { workspace: string; engine: AgentEngine }) {
  const config = createConfig(params.workspace);
  const sessionManager = new SessionManager(params.workspace);
  const providerManager = {
    setConfig: () => {},
    get: () => ({
      getDefaultModel: () => "openai/gpt-5"
    })
  };
  const bus = {
    consumeInbound: vi.fn(async () => {
      throw new Error("not implemented in unit test");
    }),
    publishOutbound: vi.fn(async () => undefined)
  };

  const runtimePool = new GatewayAgentRuntimePool({
    bus: bus as never,
    providerManager: providerManager as never,
    sessionManager,
    config,
    restrictToWorkspace: true,
    execConfig: config.tools.exec,
    contextConfig: config.agents.context,
    extensionRegistry: {
      engines: [
        {
          extensionId: "test.mock",
          source: "workspace",
          kind: "mock",
          factory: () => params.engine
        }
      ],
      channels: [],
      tools: [],
      diagnostics: []
    }
  });

  return {
    runtimePool,
    sessionManager
  };
}

describe("GatewayAgentRuntimePool slash commands", () => {
  it("executes slash command before engine processDirect", async () => {
    const workspace = createWorkspace();
    const processDirect = vi.fn(async () => "engine-reply");
    const engine: AgentEngine = {
      kind: "mock",
      handleInbound: vi.fn(async () => null),
      processDirect,
      applyRuntimeConfig: vi.fn()
    };
    const { runtimePool } = createRuntimePool({ workspace, engine });

    const result = await runtimePool.processDirect({
      content: "/status",
      sessionKey: "agent:main:ui:direct:web-ui",
      channel: "ui",
      chatId: "web-ui"
    });

    expect(result).toContain("Session: agent:main:ui:direct:web-ui");
    expect(processDirect).not.toHaveBeenCalled();
  });

  it("falls back to engine processing for normal messages", async () => {
    const workspace = createWorkspace();
    const processDirect = vi.fn(async () => "engine-reply");
    const engine: AgentEngine = {
      kind: "mock",
      handleInbound: vi.fn(async () => null),
      processDirect,
      applyRuntimeConfig: vi.fn()
    };
    const { runtimePool } = createRuntimePool({ workspace, engine });

    const result = await runtimePool.processDirect({
      content: "hello",
      sessionKey: "agent:main:ui:direct:web-ui",
      channel: "ui",
      chatId: "web-ui"
    });

    expect(result).toBe("engine-reply");
    expect(processDirect).toHaveBeenCalledTimes(1);
  });
});
