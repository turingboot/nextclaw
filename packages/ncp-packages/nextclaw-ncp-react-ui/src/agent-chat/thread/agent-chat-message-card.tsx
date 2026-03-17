import type { NcpMessage } from "@nextclaw/ncp";
import type { AgentChatLabels } from "../agent-chat-types.js";
import { cx } from "../agent-chat-utils.js";
import { AgentChatMessagePart } from "./agent-chat-message-part.js";

type AgentChatMessageCardProps = {
  message: NcpMessage;
  labels: AgentChatLabels;
};

export function AgentChatMessageCard({
  message,
  labels,
}: AgentChatMessageCardProps) {
  const isUser = message.role === "user";
  const parts = message.parts
    .map((part, index) => (
      <AgentChatMessagePart
        key={`${message.id}-${index}`}
        labels={labels}
        message={message}
        part={part}
      />
    ))
    .filter((part) => part !== null);

  return (
    <div
      data-agent-chat-message-id={message.id}
      data-agent-chat-message-role={message.role}
      data-agent-chat-message-status={message.status}
      className={cx(
        "agent-chat-bubble",
        isUser ? "agent-chat-bubble-user" : "agent-chat-bubble-assistant",
        message.role === "tool" && "agent-chat-bubble-tool",
        message.role === "system" && "agent-chat-bubble-system",
        message.role === "service" && "agent-chat-bubble-system",
      )}
    >
      <div className="agent-chat-bubble-parts">{parts}</div>
    </div>
  );
}
