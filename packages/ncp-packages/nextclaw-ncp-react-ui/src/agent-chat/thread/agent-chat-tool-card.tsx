import type { NcpToolInvocationPart } from "@nextclaw/ncp";
import { Wrench } from "lucide-react";
import type { AgentChatLabels } from "../agent-chat-types.js";
import { stringifyUnknown, summarizeToolArgs } from "../agent-chat-utils.js";

type AgentChatToolCardProps = {
  part: NcpToolInvocationPart;
  labels: AgentChatLabels;
};

export function AgentChatToolCard({
  part,
  labels,
}: AgentChatToolCardProps) {
  const detail = summarizeToolArgs(part.args);
  const output = stringifyUnknown(part.result).trim();
  const title = part.state === "result" ? labels.toolResult : labels.toolCall;
  const showOutput = part.state === "result";

  return (
    <div className="agent-chat-tool-card">
      <div className="agent-chat-tool-head">
        <Wrench className="h-3.5 w-3.5" />
        <span>{title}</span>
        <span className="agent-chat-tool-name">{part.toolName}</span>
      </div>
      {detail ? <div className="agent-chat-tool-detail">{detail}</div> : null}
      {showOutput ? (
        <div className="agent-chat-tool-output">
          {!output ? (
            <div className="agent-chat-tool-empty">{labels.toolNoOutput}</div>
          ) : (
            <details>
              <summary>{labels.toolOutput}</summary>
              <pre>{output}</pre>
            </details>
          )}
        </div>
      ) : null}
    </div>
  );
}
