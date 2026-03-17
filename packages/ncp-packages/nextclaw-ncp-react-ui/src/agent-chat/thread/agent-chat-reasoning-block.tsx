import type { AgentChatLabels } from "../agent-chat-types.js";

type AgentChatReasoningBlockProps = {
  text: string;
  labels: AgentChatLabels;
};

export function AgentChatReasoningBlock({
  text,
  labels,
}: AgentChatReasoningBlockProps) {
  return (
    <details className="agent-chat-reasoning">
      <summary>{labels.reasoning}</summary>
      <pre>{text}</pre>
    </details>
  );
}
