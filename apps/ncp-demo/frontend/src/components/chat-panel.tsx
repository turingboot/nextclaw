import type { NcpMessage, NcpError } from "@nextclaw/ncp";
import { ChatHeader } from "../ui/chat-header";
import { ChatInput } from "../ui/chat-input";
import { ErrorBox } from "../ui/error-box";
import { MessageList } from "../ui/message-list";

type ChatPanelProps = {
  visibleMessages: readonly NcpMessage[];
  error: NcpError | null;
  draft: string;
  isSending: boolean;
  activeRunId: string | null;
  isRunning: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onAbort: () => void;
  onStreamRun: () => void;
};

export function ChatPanel({
  visibleMessages,
  error,
  draft,
  isSending,
  activeRunId,
  isRunning,
  onDraftChange,
  onSend,
  onAbort,
  onStreamRun,
}: ChatPanelProps) {
  return (
    <main className="panel chat-panel">
      <ChatHeader
        title="NCP Agent Demo"
        streamRunDisabled={!activeRunId}
        abortDisabled={!isRunning}
        onStreamRun={onStreamRun}
        onAbort={onAbort}
      />
      <MessageList messages={visibleMessages} emptyMessage="Send a message to start." />
      <ErrorBox error={error} />
      <ChatInput
        value={draft}
        placeholder="Ask anything. Demo will call get_current_time tool first."
        isSending={isSending}
        sendDisabled={isSending || isRunning}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </main>
  );
}
