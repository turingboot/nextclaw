import type { SessionEventView, SessionMessageView } from '@/api/types';

export type ChatRole = 'user' | 'assistant' | 'tool' | 'system' | 'other';

export type ToolCard = {
  kind: 'call' | 'result';
  name: string;
  detail?: string;
  text?: string;
  callId?: string;
  hasResult?: boolean;
};

export type ChatTimelineMessageItem = {
  kind: 'message';
  key: string;
  role: ChatRole;
  timestamp: string;
  message: SessionMessageView;
};

export type ChatTimelineAssistantTurnSegment =
  | {
      kind: 'assistant_message';
      key: string;
      text: string;
      reasoning: string;
    }
  | {
      kind: 'tool_card';
      key: string;
      card: ToolCard;
    };

export type ChatTimelineAssistantTurnItem = {
  kind: 'assistant_turn';
  key: string;
  role: 'assistant';
  timestamp: string;
  segments: ChatTimelineAssistantTurnSegment[];
};

export type ChatTimelineItem = ChatTimelineMessageItem | ChatTimelineAssistantTurnItem;

const TOOL_DETAIL_FIELDS = ['cmd', 'command', 'query', 'q', 'path', 'url', 'to', 'channel', 'agentId', 'sessionKey'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncateText(value: string, maxChars = 2400): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars)}\n…`;
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value == null) {
    return '';
  }
  try {
    return truncateText(JSON.stringify(value, null, 2));
  } catch {
    return String(value);
  }
}

function parseArgsObject(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function summarizeToolArgs(args: unknown): string | undefined {
  const parsed = parseArgsObject(args);
  if (!parsed) {
    const text = stringifyUnknown(args).trim();
    return text ? truncateText(text, 120) : undefined;
  }

  const items: string[] = [];
  for (const field of TOOL_DETAIL_FIELDS) {
    const value = parsed[field];
    if (typeof value === 'string' && value.trim()) {
      items.push(`${field}: ${value.trim()}`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      items.push(`${field}: ${String(value)}`);
    }
    if (items.length >= 2) {
      break;
    }
  }
  if (items.length > 0) {
    return items.join(' · ');
  }
  return truncateText(stringifyUnknown(parsed), 140);
}

function toToolName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return 'tool';
  }
  return value.trim();
}

function hasToolCalls(message: SessionMessageView): boolean {
  return Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
}

export function normalizeChatRole(message: Pick<SessionMessageView, 'role' | 'name' | 'tool_call_id' | 'tool_calls'>): ChatRole {
  const role = message.role.toLowerCase().trim();
  if (role === 'user') {
    return 'user';
  }
  if (role === 'assistant') {
    return 'assistant';
  }
  if (role === 'system') {
    return 'system';
  }
  if (role === 'tool' || role === 'tool_result' || role === 'toolresult' || role === 'function') {
    return 'tool';
  }
  if (typeof message.tool_call_id === 'string' || Array.isArray(message.tool_calls) || typeof message.name === 'string') {
    return 'tool';
  }
  return 'other';
}

export function extractMessageText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const item of content) {
      if (typeof item === 'string') {
        parts.push(item);
        continue;
      }
      if (!isRecord(item)) {
        continue;
      }
      if (typeof item.text === 'string') {
        parts.push(item.text);
        continue;
      }
      if (typeof item.content === 'string') {
        parts.push(item.content);
      }
    }
    if (parts.length > 0) {
      return parts.join('\n');
    }
  }
  return stringifyUnknown(content);
}

function buildToolCallCards(message: SessionMessageView): ToolCard[] {
  const cards: ToolCard[] = [];
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  for (const call of toolCalls) {
    if (!isRecord(call)) {
      continue;
    }
    const fn = isRecord(call.function) ? call.function : null;
    const name = toToolName(fn?.name ?? call.name);
    const args = fn?.arguments ?? call.arguments;
    cards.push({
      kind: 'call',
      name,
      detail: summarizeToolArgs(args),
      callId: typeof call.id === 'string' && call.id.trim() ? call.id : undefined,
      hasResult: false
    });
  }
  return cards;
}

export function extractToolCards(message: SessionMessageView): ToolCard[] {
  const cards = buildToolCallCards(message);
  const role = normalizeChatRole(message);
  if (role === 'tool' || typeof message.tool_call_id === 'string') {
    cards.push({
      kind: 'result',
      name: toToolName(message.name ?? cards[0]?.name),
      text: extractMessageText(message.content).trim(),
      callId: typeof message.tool_call_id === 'string' ? message.tool_call_id : undefined,
      hasResult: true
    });
  }
  return cards;
}

function normalizeEvent(event: SessionEventView, index: number): SessionEventView & { _idx: number; _seq: number } {
  const seq = Number.isFinite(event.seq) && event.seq > 0 ? Math.trunc(event.seq) : index + 1;
  const timestamp =
    typeof event.timestamp === 'string' && event.timestamp
      ? event.timestamp
      : event.message?.timestamp ?? new Date().toISOString();
  return {
    ...event,
    timestamp,
    _idx: index,
    _seq: seq
  };
}

function inferEventTypeFromMessage(message: SessionMessageView): string {
  const role = normalizeChatRole(message);
  if (role === 'assistant' && hasToolCalls(message)) {
    return 'assistant.tool_call';
  }
  if (role === 'tool') {
    return 'tool.result';
  }
  return `message.${role}`;
}

export function buildFallbackEventsFromMessages(messages: SessionMessageView[]): SessionEventView[] {
  return messages.map((message, index) => ({
    seq: index + 1,
    type: inferEventTypeFromMessage(message),
    timestamp: message.timestamp,
    message
  }));
}

function appendText(base: string, next: string): string {
  if (!next) {
    return base;
  }
  if (!base) {
    return next;
  }
  return `${base}\n\n${next}`;
}

export function buildChatTimeline(events: SessionEventView[]): ChatTimelineItem[] {
  const normalized = events
    .map((event, index) => normalizeEvent(event, index))
    .sort((left, right) => {
      if (left._seq !== right._seq) {
        return left._seq - right._seq;
      }
      const leftTs = Date.parse(left.timestamp);
      const rightTs = Date.parse(right.timestamp);
      if (Number.isFinite(leftTs) && Number.isFinite(rightTs) && leftTs !== rightTs) {
        return leftTs - rightTs;
      }
      return left._idx - right._idx;
    });

  const timeline: ChatTimelineItem[] = [];
  let activeTurn:
    | {
        item: ChatTimelineAssistantTurnItem;
        cardByCallId: Map<string, ToolCard>;
      }
    | null = null;

  const closeActiveTurn = () => {
    activeTurn = null;
  };

  const ensureActiveTurn = (eventKey: string, timestamp: string) => {
    if (activeTurn) {
      activeTurn.item.timestamp = timestamp;
      return activeTurn;
    }
    const item: ChatTimelineAssistantTurnItem = {
      kind: 'assistant_turn',
      key: `turn-${eventKey}`,
      role: 'assistant',
      timestamp,
      segments: []
    };
    timeline.push(item);
    activeTurn = {
      item,
      cardByCallId: new Map<string, ToolCard>()
    };
    return activeTurn;
  };

  const pushAssistantMessageSegment = (
    target: { item: ChatTimelineAssistantTurnItem },
    eventKey: string,
    message: SessionMessageView
  ) => {
    const text = extractMessageText(message.content).trim();
    const reasoning =
      typeof message.reasoning_content === 'string' ? message.reasoning_content.trim() : '';
    if (!text && !reasoning) {
      return;
    }
    target.item.segments.push({
      kind: 'assistant_message',
      key: `assistant-${eventKey}-${target.item.segments.length}`,
      text,
      reasoning
    });
  };

  for (const event of normalized) {
    const message = event.message;
    if (!message) {
      continue;
    }

    const role = normalizeChatRole(message);
    const timestamp =
      typeof message.timestamp === 'string' && message.timestamp
        ? message.timestamp
        : event.timestamp;
    const eventKey = `${event._seq}-${event._idx}`;

    if (role === 'assistant') {
      const turn = ensureActiveTurn(eventKey, timestamp);
      pushAssistantMessageSegment(turn, eventKey, message);
      if (!hasToolCalls(message)) {
        continue;
      }

      const toolCards = buildToolCallCards(message);
      for (const card of toolCards) {
        turn.item.segments.push({
          kind: 'tool_card',
          key: `tool-call-${eventKey}-${turn.item.segments.length}`,
          card
        });
        if (typeof card.callId === 'string' && card.callId.trim()) {
          turn.cardByCallId.set(card.callId, card);
        }
      }
      continue;
    }

    if (role === 'tool') {
      const turn = ensureActiveTurn(eventKey, timestamp);
      const callId =
        typeof message.tool_call_id === 'string' && message.tool_call_id.trim()
          ? message.tool_call_id.trim()
          : undefined;
      if (callId && turn.cardByCallId.has(callId)) {
        const card = turn.cardByCallId.get(callId)!;
        const resultText = extractMessageText(message.content).trim();
        card.text = appendText(card.text ?? '', resultText);
        card.hasResult = true;
        if (typeof message.name === 'string' && message.name.trim()) {
          card.name = message.name.trim();
        }
        turn.item.timestamp = timestamp;
        continue;
      }

      turn.item.segments.push({
        kind: 'tool_card',
        key: `tool-result-${eventKey}-${turn.item.segments.length}`,
        card: {
          kind: 'result',
          name: toToolName(message.name),
          text: extractMessageText(message.content).trim(),
          callId,
          hasResult: true
        }
      });
      continue;
    }

    timeline.push({
      kind: 'message',
      key: `message-${event._seq}-${event._idx}`,
      role,
      timestamp,
      message
    });
    closeActiveTurn();
  }

  return timeline;
}
