type AgentChatStepBadgeProps = {
  label: string;
};

export function AgentChatStepBadge({ label }: AgentChatStepBadgeProps) {
  return <div className="agent-chat-step-badge">{label}</div>;
}
