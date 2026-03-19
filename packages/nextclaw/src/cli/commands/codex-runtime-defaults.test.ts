import { describe, expect, it, vi } from "vitest";
import { CodexSdkNcpAgentRuntime } from "../../../../extensions/nextclaw-ncp-runtime-codex-sdk/src/index.js";

describe("CodexSdkNcpAgentRuntime", () => {
  it("defaults skipGitRepoCheck to true when building thread options", async () => {
    const startThread = vi.fn(() => ({}) as any);
    const runtime = new CodexSdkNcpAgentRuntime({
      sessionId: "session-1",
      apiKey: "test-key",
    }) as any;

    runtime.getCodex = async () => ({
      startThread,
      resumeThread: vi.fn(),
    });

    await runtime.resolveThread();

    expect(startThread).toHaveBeenCalledWith(
      expect.objectContaining({
        skipGitRepoCheck: true,
      }),
    );
  });

  it("preserves an explicit model while still enabling skipGitRepoCheck", async () => {
    const startThread = vi.fn(() => ({}) as any);
    const runtime = new CodexSdkNcpAgentRuntime({
      sessionId: "session-2",
      apiKey: "test-key",
      model: "gpt-5-codex",
      threadOptions: {
        skipGitRepoCheck: false,
      },
    }) as any;

    runtime.getCodex = async () => ({
      startThread,
      resumeThread: vi.fn(),
    });

    await runtime.resolveThread();

    expect(startThread).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-codex",
        skipGitRepoCheck: false,
      }),
    );
  });
});
