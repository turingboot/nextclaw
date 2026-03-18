import { describe, expect, it } from "vitest";
import { DefaultNcpStreamEncoder } from "@nextclaw/ncp-agent-runtime";
import { NcpEventType, type OpenAIChatChunk } from "@nextclaw/ncp";

async function collectEventTypes(chunks: OpenAIChatChunk[]): Promise<NcpEventType[]> {
  const encoder = new DefaultNcpStreamEncoder();
  const events: NcpEventType[] = [];

  async function* toStream(): AsyncGenerator<OpenAIChatChunk> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  for await (const event of encoder.encode(toStream(), {
    sessionId: "session-1",
    messageId: "message-1",
    runId: "run-1",
  })) {
    events.push(event.type);
  }

  return events;
}

describe("DefaultNcpStreamEncoder", () => {
  it("emits reasoning before text when a chunk carries both", async () => {
    const eventTypes = await collectEventTypes([
      {
        choices: [
          {
            delta: {
              reasoning_content: "think first",
              content: "answer after thinking",
            },
            finish_reason: "stop",
          },
        ],
      },
    ]);

    expect(eventTypes).toEqual([
      NcpEventType.MessageReasoningDelta,
      NcpEventType.MessageTextStart,
      NcpEventType.MessageTextDelta,
      NcpEventType.MessageTextEnd,
    ]);
  });
});
