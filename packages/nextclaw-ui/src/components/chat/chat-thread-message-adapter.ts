import { type UiMessage, type UiMessagePart } from '@nextclaw/agent-chat';
import { type NcpMessage, type NcpMessagePart, type NcpMessageRole, type NcpToolInvocationPart } from '@nextclaw/ncp';

const FALLBACK_SESSION_ID = 'nextclaw-ui';

function toMessageRole(role: UiMessage['role']): NcpMessageRole {
  if (role === 'data') {
    return 'service';
  }
  if (role === 'tool') {
    return 'tool';
  }
  return role;
}

function toTimestamp(message: UiMessage): string {
  return message.meta?.timestamp || new Date().toISOString();
}

function toReasoningText(part: Extract<UiMessagePart, { type: 'reasoning' }>): string {
  const primary = part.reasoning.trim();
  if (primary) {
    return primary;
  }

  return part.details
    .filter((detail): detail is Extract<typeof detail, { type: 'text' }> => detail.type === 'text')
    .map((detail) => detail.text.trim())
    .filter(Boolean)
    .join('\n');
}

function toToolInvocationState(status: string): NcpToolInvocationPart['state'] {
  if (status === 'result' || status === 'error' || status === 'cancelled') {
    return 'result';
  }
  if (status === 'partial-call') {
    return 'partial-call';
  }
  return 'call';
}

function toToolInvocationResult(part: Extract<UiMessagePart, { type: 'tool-invocation' }>): unknown {
  if (part.toolInvocation.status === 'error') {
    return part.toolInvocation.error || part.toolInvocation.result || 'Tool execution failed.';
  }
  if (part.toolInvocation.status === 'cancelled') {
    return part.toolInvocation.result || { cancelled: true };
  }
  return part.toolInvocation.result;
}

function toMessagePart(part: UiMessagePart): NcpMessagePart | null {
  if (part.type === 'text') {
    const text = part.text.trim();
    return text ? { type: 'text', text } : null;
  }

  if (part.type === 'reasoning') {
    const text = toReasoningText(part);
    return text ? { type: 'reasoning', text } : null;
  }

  if (part.type === 'tool-invocation') {
    return {
      type: 'tool-invocation',
      toolName: part.toolInvocation.toolName,
      toolCallId: part.toolInvocation.toolCallId,
      state: toToolInvocationState(part.toolInvocation.status),
      args: part.toolInvocation.parsedArgs ?? part.toolInvocation.args,
      result: toToolInvocationResult(part),
    };
  }

  if (part.type === 'source') {
    return {
      type: 'source',
      title: part.source.title,
      url: part.source.url,
    };
  }

  if (part.type === 'file') {
    return {
      type: 'file',
      mimeType: part.mimeType,
      contentBase64: part.data,
    };
  }

  if (part.type === 'step-start') {
    return {
      type: 'step-start',
      title: 'Step',
    };
  }

  return null;
}

function toMessageParts(message: UiMessage): NcpMessagePart[] {
  return message.parts
    .map((part) => toMessagePart(part))
    .filter((part): part is NcpMessagePart => part !== null);
}

export function toNcpMessages(uiMessages: readonly UiMessage[]): NcpMessage[] {
  return uiMessages
    .map((message) => {
      const parts = toMessageParts(message);
      return {
        id: message.id,
        sessionId: message.meta?.sessionKey || FALLBACK_SESSION_ID,
        role: toMessageRole(message.role),
        status: message.meta?.status || 'final',
        parts,
        timestamp: toTimestamp(message),
        metadata: {
          runId: message.meta?.runId,
          source: message.meta?.source,
          seq: message.meta?.seq,
          isDraft: message.meta?.isDraft,
        },
      } satisfies NcpMessage;
    })
    .filter((message) => message.parts.length > 0);
}
