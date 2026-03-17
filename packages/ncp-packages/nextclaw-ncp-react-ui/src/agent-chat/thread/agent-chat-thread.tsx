import type { NcpMessage } from "@nextclaw/ncp";
import type { AgentChatLabels } from "../agent-chat-types.js";
import { cx, formatTimestamp, roleLabel } from "../agent-chat-utils.js";
import { AgentChatMessageCard } from "./agent-chat-message-card.js";
import { AgentChatRoleAvatar } from "./agent-chat-role-avatar.js";

type AgentChatThreadProps = {
  messages: readonly NcpMessage[];
  isSending?: boolean;
  labels: AgentChatLabels;
  className?: string;
};

export function AgentChatThread({
  messages,
  isSending = false,
  labels,
  className,
}: AgentChatThreadProps) {
  const hasStreamingMessage = messages.some((message) => message.status === "streaming");

  return (
    <div className={cx("agent-chat-thread", className)}>
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            data-agent-chat-row-role={message.role}
            className={cx(
              "agent-chat-row",
              isUser ? "agent-chat-row-user" : "agent-chat-row-assistant",
            )}
          >
            {!isUser ? <AgentChatRoleAvatar role={message.role} /> : null}
            <div className={cx("agent-chat-message", isUser && "agent-chat-message-user")}>
              <AgentChatMessageCard labels={labels} message={message} />
              <div className="agent-chat-meta">
                {roleLabel(message.role, labels)} · {formatTimestamp(message)}
              </div>
            </div>
            {isUser ? <AgentChatRoleAvatar role={message.role} /> : null}
          </div>
        );
      })}
      {isSending && !hasStreamingMessage ? (
        <div className="agent-chat-row agent-chat-row-assistant">
          <AgentChatRoleAvatar role="assistant" />
          <div className="agent-chat-typing">{labels.typing}</div>
        </div>
      ) : null}
    </div>
  );
}
