import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import type { NcpError, NcpMessage } from "@nextclaw/ncp";
import { AgentChatComposer } from "./agent-chat-composer.js";
import { AgentChatHeader } from "./agent-chat-header.js";
import { defaultAgentChatLabels, type AgentChatHeaderAction, type AgentChatLabels } from "./agent-chat-types.js";
import { AgentChatThread } from "./thread/agent-chat-thread.js";

type AgentChatPanelProps = {
  resetScrollKey?: string | number;
  title: string;
  subtitle?: string;
  messages: readonly NcpMessage[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onAbort?: () => void | Promise<void>;
  isSending: boolean;
  isRunning: boolean;
  isHydrating?: boolean;
  sendDisabled?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: NcpError | { code?: string; message: string } | null;
  emptyState?: ReactNode;
  emptyMessage?: string;
  statusBanner?: ReactNode;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  headerActions?: readonly AgentChatHeaderAction[];
  labels?: Partial<AgentChatLabels>;
};

const STICKY_BOTTOM_THRESHOLD_PX = 10;

export function AgentChatPanel({
  resetScrollKey,
  title,
  subtitle,
  messages,
  value,
  onChange,
  onSend,
  onAbort,
  isSending,
  isRunning,
  isHydrating = false,
  sendDisabled = false,
  disabled = false,
  placeholder,
  error,
  emptyState,
  emptyMessage = "Send a message to start.",
  statusBanner,
  footerStart,
  footerEnd,
  headerActions = [],
  labels,
}: AgentChatPanelProps) {
  const resolvedLabels: AgentChatLabels = { ...defaultAgentChatLabels, ...labels };
  const threadRef = useRef<HTMLDivElement | null>(null);
  const isStickyRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const element = threadRef.current;
    if (!element) {
      return;
    }
    isProgrammaticScrollRef.current = true;
    element.scrollTop = element.scrollHeight;
  }, []);

  useEffect(() => {
    isStickyRef.current = true;
  }, [resetScrollKey]);

  useLayoutEffect(() => {
    if (!isStickyRef.current || messages.length === 0) {
      return;
    }
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <section className="agent-chat-panel">
      <AgentChatHeader actions={headerActions} subtitle={subtitle} title={title} />
      {statusBanner ? <div className="agent-chat-status-banner">{statusBanner}</div> : null}
      <div
        ref={threadRef}
        className="agent-chat-panel-body"
        onScroll={() => {
          if (isProgrammaticScrollRef.current) {
            isProgrammaticScrollRef.current = false;
            return;
          }
          const element = threadRef.current;
          if (!element) {
            return;
          }
          const distanceFromBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight;
          isStickyRef.current = distanceFromBottom <= STICKY_BOTTOM_THRESHOLD_PX;
        }}
      >
        {messages.length === 0 ? (
          isHydrating ? (
            <div className="agent-chat-empty">
              Loading conversation...
            </div>
          ) : (
            emptyState ?? <div className="agent-chat-empty">{emptyMessage}</div>
          )
        ) : (
          <div className="agent-chat-thread-shell">
            <AgentChatThread
              isSending={isSending && !isHydrating}
              labels={resolvedLabels}
              messages={messages}
            />
          </div>
        )}
      </div>
      {error ? (
        <div className="agent-chat-panel-error">
          {error.code ? `${error.code}: ` : ""}
          {error.message}
        </div>
      ) : null}
      <AgentChatComposer
        disabled={disabled}
        errorMessage={null}
        footerEnd={footerEnd}
        footerStart={footerStart}
        isRunning={isRunning}
        isSending={isSending}
        labels={resolvedLabels}
        onChange={onChange}
        onSend={onSend}
        onStop={onAbort}
        placeholder={placeholder}
        sendDisabled={sendDisabled}
        value={value}
      />
    </section>
  );
}
