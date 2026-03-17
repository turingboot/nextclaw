import type { AgentChatHeaderAction } from "./agent-chat-types.js";
import { cx } from "./agent-chat-utils.js";

type AgentChatHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: readonly AgentChatHeaderAction[];
};

export function AgentChatHeader({
  title,
  subtitle,
  actions = [],
}: AgentChatHeaderProps) {
  return (
    <header className="agent-chat-header">
      <div className="agent-chat-header-copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions.length > 0 ? (
        <div className="agent-chat-header-actions">
          {actions.map((action) => (
            <button
              key={action.id}
              className={cx(
                "ncp-ui-button",
                action.variant === "ghost" && "ncp-ui-button-ghost",
                action.variant === "danger" && "ncp-ui-button-danger",
              )}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}
