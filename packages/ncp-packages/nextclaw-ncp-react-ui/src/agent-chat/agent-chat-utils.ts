import type { NcpMessage, NcpMessageRole } from "@nextclaw/ncp";
import type { AgentChatLabels } from "./agent-chat-types.js";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const TOOL_DETAIL_FIELDS = ["cmd", "command", "query", "q", "path", "url", "to", "channel", "agentId", "sessionKey"];

export function cx(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(" ");
}

export function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return "";
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseArgsObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function summarizeToolArgs(args: unknown): string | undefined {
  const parsed = parseArgsObject(args);
  if (!parsed) {
    const text = stringifyUnknown(args).trim();
    return text ? text.slice(0, 140) : undefined;
  }

  const items: string[] = [];
  for (const field of TOOL_DETAIL_FIELDS) {
    const value = parsed[field];
    if (typeof value === "string" && value.trim()) {
      items.push(`${field}: ${value.trim()}`);
    } else if (typeof value === "number" || typeof value === "boolean") {
      items.push(`${field}: ${String(value)}`);
    }
    if (items.length >= 2) {
      break;
    }
  }

  if (items.length > 0) {
    return items.join(" · ");
  }
  return stringifyUnknown(parsed).slice(0, 180);
}

export function resolveSafeHref(href?: string): string | null {
  if (!href) {
    return null;
  }
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return href;
  }
  try {
    const url = new URL(href);
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? href : null;
  } catch {
    return null;
  }
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function formatTimestamp(message: NcpMessage): string {
  const timestamp = message.timestamp;
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return timestamp;
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(parsed));
}

export function roleLabel(role: NcpMessageRole, labels: AgentChatLabels): string {
  if (role === "assistant") {
    return labels.assistantRole;
  }
  if (role === "user") {
    return labels.userRole;
  }
  if (role === "tool") {
    return labels.toolRole;
  }
  if (role === "system") {
    return labels.systemRole;
  }
  if (role === "service") {
    return labels.serviceRole;
  }
  return labels.messageRole;
}
