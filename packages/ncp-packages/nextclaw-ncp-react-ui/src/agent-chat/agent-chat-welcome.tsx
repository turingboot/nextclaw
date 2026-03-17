import { Sparkles } from "lucide-react";
import type { AgentChatWelcomeAction } from "./agent-chat-types.js";

type AgentChatWelcomeProps = {
  title: string;
  subtitle?: string;
  actions?: readonly AgentChatWelcomeAction[];
};

export function AgentChatWelcome({
  title,
  subtitle,
  actions = [],
}: AgentChatWelcomeProps) {
  return (
    <div className="agent-chat-welcome">
      <div className="agent-chat-welcome-badge">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions.length > 0 ? (
        <div className="agent-chat-welcome-grid">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="agent-chat-welcome-card"
              onClick={action.onClick}
            >
              <div className="agent-chat-welcome-icon">
                {action.icon ?? <Sparkles className="h-4 w-4" />}
              </div>
              <div className="agent-chat-welcome-title">{action.title}</div>
              {action.description ? (
                <div className="agent-chat-welcome-description">{action.description}</div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
