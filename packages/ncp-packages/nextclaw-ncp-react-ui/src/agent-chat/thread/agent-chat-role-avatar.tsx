import type { NcpMessage } from "@nextclaw/ncp";
import { Bot, Settings2, User, Wrench } from "lucide-react";

type AgentChatRoleAvatarProps = {
  role: NcpMessage["role"];
};

export function AgentChatRoleAvatar({ role }: AgentChatRoleAvatarProps) {
  if (role === "user") {
    return (
      <div className="agent-chat-avatar agent-chat-avatar-user">
        <User className="h-4 w-4" />
      </div>
    );
  }
  if (role === "assistant") {
    return (
      <div className="agent-chat-avatar agent-chat-avatar-assistant">
        <Bot className="h-4 w-4" />
      </div>
    );
  }
  if (role === "tool") {
    return (
      <div className="agent-chat-avatar agent-chat-avatar-tool">
        <Wrench className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="agent-chat-avatar agent-chat-avatar-system">
      <Settings2 className="h-4 w-4" />
    </div>
  );
}
