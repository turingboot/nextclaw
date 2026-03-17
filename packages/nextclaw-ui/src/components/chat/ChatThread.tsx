import { type UiMessage } from '@nextclaw/agent-chat';
import { AgentChatThread } from '@nextclaw/ncp-react-ui';
import { buildAgentChatLabels } from '@/components/chat/agent-chat-labels';
import { toNcpMessages } from '@/components/chat/chat-thread-message-adapter';
import { cn } from '@/lib/utils';

type ChatThreadProps = {
  uiMessages: UiMessage[];
  isSending: boolean;
  className?: string;
};

export function ChatThread({ uiMessages, isSending, className }: ChatThreadProps) {
  return (
    <AgentChatThread
      className={cn(className)}
      isSending={isSending}
      labels={buildAgentChatLabels()}
      messages={toNcpMessages(uiMessages)}
    />
  );
}
