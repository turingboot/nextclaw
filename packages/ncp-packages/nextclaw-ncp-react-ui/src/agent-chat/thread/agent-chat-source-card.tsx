import type { NcpSourcePart } from "@nextclaw/ncp";
import { Globe } from "lucide-react";
import type { AgentChatLabels } from "../agent-chat-types.js";
import { resolveSafeHref } from "../agent-chat-utils.js";

type AgentChatSourceCardProps = {
  part: NcpSourcePart;
  labels: AgentChatLabels;
};

export function AgentChatSourceCard({
  part,
  labels,
}: AgentChatSourceCardProps) {
  const href = resolveSafeHref(part.url);
  const content = (
    <>
      <div className="agent-chat-source-head">
        <Globe className="h-3.5 w-3.5" />
        <span>{labels.sourceLabel}</span>
      </div>
      <div className="agent-chat-source-title">
        {part.title || part.url || labels.sourceLabel}
      </div>
      {part.snippet ? <div className="agent-chat-source-snippet">{part.snippet}</div> : null}
    </>
  );

  if (!href) {
    return <div className="agent-chat-source-card">{content}</div>;
  }

  return (
    <a
      className="agent-chat-source-card"
      href={href}
      target="_blank"
      rel="noreferrer noopener"
    >
      {content}
    </a>
  );
}
