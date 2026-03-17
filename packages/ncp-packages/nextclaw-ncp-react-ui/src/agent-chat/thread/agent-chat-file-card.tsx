import type { NcpFilePart } from "@nextclaw/ncp";
import { FileText } from "lucide-react";
import type { AgentChatLabels } from "../agent-chat-types.js";

type AgentChatFileCardProps = {
  part: NcpFilePart;
  labels: AgentChatLabels;
};

export function AgentChatFileCard({
  part,
  labels,
}: AgentChatFileCardProps) {
  return (
    <div className="agent-chat-file-card">
      <div className="agent-chat-file-head">
        <FileText className="h-3.5 w-3.5" />
        <span>{labels.attachmentLabel}</span>
      </div>
      <div className="agent-chat-file-name">{part.name || part.url || "file"}</div>
      {part.mimeType ? <div className="agent-chat-file-meta">{part.mimeType}</div> : null}
    </div>
  );
}
