import type { NcpMessage, NcpMessagePart } from "@nextclaw/ncp";
import type { AgentChatLabels } from "../agent-chat-types.js";
import { AgentChatMarkdown } from "../markdown/agent-chat-markdown.js";
import { stringifyUnknown } from "../agent-chat-utils.js";
import { AgentChatFileCard } from "./agent-chat-file-card.js";
import { AgentChatReasoningBlock } from "./agent-chat-reasoning-block.js";
import { AgentChatSourceCard } from "./agent-chat-source-card.js";
import { AgentChatStepBadge } from "./agent-chat-step-badge.js";
import { AgentChatToolCard } from "./agent-chat-tool-card.js";

type AgentChatMessagePartProps = {
  part: NcpMessagePart;
  message: NcpMessage;
  labels: AgentChatLabels;
};

export function AgentChatMessagePart({
  part,
  message,
  labels,
}: AgentChatMessagePartProps) {
  const isUser = message.role === "user";

  if (part.type === "text") {
    const text = part.text.trim();
    if (!text) {
      return null;
    }
    return <AgentChatMarkdown isUser={isUser} labels={labels} text={text} />;
  }

  if (part.type === "rich-text") {
    if (part.format === "markdown") {
      return <AgentChatMarkdown isUser={isUser} labels={labels} text={part.text} />;
    }
    return <p className="agent-chat-plain-text">{part.text}</p>;
  }

  if (part.type === "reasoning") {
    const text = part.text.trim();
    return text ? <AgentChatReasoningBlock labels={labels} text={text} /> : null;
  }

  if (part.type === "tool-invocation") {
    return <AgentChatToolCard labels={labels} part={part} />;
  }

  if (part.type === "source") {
    return <AgentChatSourceCard labels={labels} part={part} />;
  }

  if (part.type === "file") {
    return <AgentChatFileCard labels={labels} part={part} />;
  }

  if (part.type === "step-start") {
    return <AgentChatStepBadge label={part.title || part.stepId || "Step"} />;
  }

  return <pre className="agent-chat-raw-part">{stringifyUnknown(part)}</pre>;
}
