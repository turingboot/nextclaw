import { describe, expect, it, vi } from "vitest";
import type { SubagentManager } from "../subagent.js";
import { SpawnTool } from "./spawn.js";

describe("SpawnTool", () => {
  it("forwards explicit model override and session model context", async () => {
    const spawn = vi.fn(async () => "ok");
    const tool = new SpawnTool({ spawn } as unknown as SubagentManager);
    tool.setContext("discord", "room-1", "openai/gpt-5");

    await tool.execute({
      task: "draft release notes",
      label: "release-notes",
      model: "anthropic/claude-sonnet-4-5"
    });

    expect(spawn).toHaveBeenCalledWith({
      task: "draft release notes",
      label: "release-notes",
      model: "anthropic/claude-sonnet-4-5",
      sessionModel: "openai/gpt-5",
      originChannel: "discord",
      originChatId: "room-1"
    });
  });

  it("ignores blank model and keeps session model fallback", async () => {
    const spawn = vi.fn(async () => "ok");
    const tool = new SpawnTool({ spawn } as unknown as SubagentManager);
    tool.setContext("telegram", "chat-2", "openai/gpt-5");

    await tool.execute({
      task: "collect bug reports",
      model: "   "
    });

    expect(spawn).toHaveBeenCalledWith({
      task: "collect bug reports",
      label: undefined,
      model: undefined,
      sessionModel: "openai/gpt-5",
      originChannel: "telegram",
      originChatId: "chat-2"
    });
  });
});
