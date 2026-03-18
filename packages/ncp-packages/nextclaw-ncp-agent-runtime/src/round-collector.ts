import type { OpenAIChatChunk } from "@nextclaw/ncp";
import { applyToolDelta, getToolCallIndex, type DeltaLike, type ToolCallBuffer } from "./stream-encoder.utils.js";

export type CollectedToolCall = {
  toolCallId: string;
  toolName: string;
  args: string;
};

export class DefaultNcpRoundCollector {
  private text = "";
  private reasoning = "";
  private readonly toolCallBuffers = new Map<number, ToolCallBuffer>();

  clear(): void {
    this.text = "";
    this.reasoning = "";
    this.toolCallBuffers.clear();
  }

  consumeChunk(chunk: OpenAIChatChunk): void {
    const choice = chunk.choices?.[0];
    if (!choice) {
      return;
    }

    const delta = choice.delta as DeltaLike | undefined;
    if (!delta) {
      return;
    }

    if (typeof delta.content === "string" && delta.content.length > 0) {
      this.text += delta.content;
    }

    const reasoning = delta.reasoning_content ?? delta.reasoning;
    if (typeof reasoning === "string" && reasoning.length > 0) {
      this.reasoning += reasoning;
    }

    const toolDeltas = delta.tool_calls;
    if (!Array.isArray(toolDeltas)) {
      return;
    }

    for (const toolDelta of toolDeltas) {
      const index = getToolCallIndex(toolDelta, this.toolCallBuffers.size);
      const previous = this.toolCallBuffers.get(index) ?? { argumentsText: "" };
      const current = applyToolDelta(previous, toolDelta);
      this.toolCallBuffers.set(index, current);
    }
  }

  getText(): string {
    return this.text;
  }

  getReasoning(): string {
    return this.reasoning;
  }

  getToolCalls(): CollectedToolCall[] {
    const orderedEntries = Array.from(this.toolCallBuffers.entries()).sort(([left], [right]) => left - right);
    const toolCalls: CollectedToolCall[] = [];

    for (const [, buffer] of orderedEntries) {
      if (!buffer.id || !buffer.name) {
        continue;
      }
      toolCalls.push({
        toolCallId: buffer.id,
        toolName: buffer.name,
        args: buffer.argumentsText,
      });
    }

    return toolCalls;
  }
}
