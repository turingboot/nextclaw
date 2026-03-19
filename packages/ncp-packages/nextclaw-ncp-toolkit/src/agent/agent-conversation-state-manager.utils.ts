import type { NcpError, NcpMessage, NcpRunErrorPayload } from "@nextclaw/ncp";

export function buildRuntimeError(payload: NcpRunErrorPayload): NcpError {
  const message = payload.error?.trim();
  return {
    code: "runtime-error",
    message: message && message.length > 0 ? message : "Agent run failed.",
    details: {
      sessionId: payload.sessionId,
      messageId: payload.messageId,
      threadId: payload.threadId,
      runId: payload.runId,
    },
  };
}

export function shouldPromoteStreamingMessageId(
  message: NcpMessage,
  nextMessageId: string,
): boolean {
  if (!nextMessageId.trim()) {
    return false;
  }
  if (message.id.startsWith("tool-")) {
    return true;
  }
  return message.parts.some((part) => part.type === "tool-invocation");
}

export function remapTrackedToolCallsToMessageId(
  toolCallMessageIdByCallId: Map<string, string>,
  fromMessageId: string,
  toMessageId: string,
): void {
  for (const [toolCallId, trackedMessageId] of toolCallMessageIdByCallId) {
    if (trackedMessageId !== fromMessageId) {
      continue;
    }
    toolCallMessageIdByCallId.set(toolCallId, toMessageId);
  }
}

export function clearToolCallTrackingByMessageId(
  toolCallMessageIdByCallId: Map<string, string>,
  toolCallArgsRawByCallId: Map<string, string>,
  messageId: string,
): void {
  for (const [toolCallId, trackedMessageId] of toolCallMessageIdByCallId) {
    if (trackedMessageId !== messageId) {
      continue;
    }
    toolCallMessageIdByCallId.delete(toolCallId);
    toolCallArgsRawByCallId.delete(toolCallId);
  }
}

export function findToolInvocationPart(
  parts: NcpMessage["parts"],
  toolCallId: string,
): Extract<NcpMessage["parts"][number], { type: "tool-invocation" }> | null {
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (part.type === "tool-invocation" && part.toolCallId === toolCallId) {
      return part;
    }
  }
  return null;
}

export function findToolNameByCallId(
  parts: NcpMessage["parts"],
  toolCallId: string,
): string | null {
  const part = findToolInvocationPart(parts, toolCallId);
  return part?.toolName ?? null;
}

export function upsertToolInvocationPart(
  parts: NcpMessage["parts"],
  toolPart: Extract<NcpMessage["parts"][number], { type: "tool-invocation" }>,
): NcpMessage["parts"] {
  const nextParts = [...parts];
  for (let index = nextParts.length - 1; index >= 0; index -= 1) {
    const part = nextParts[index];
    if (part.type === "tool-invocation" && part.toolCallId === toolPart.toolCallId) {
      nextParts[index] = {
        ...part,
        ...toolPart,
      };
      return nextParts;
    }
  }
  nextParts.push(toolPart);
  return nextParts;
}
