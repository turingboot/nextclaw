import type { ReactNode } from "react";
import type { AgentChatLabels } from "./agent-chat-types.js";

type AgentChatComposerProps = {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  isSending: boolean;
  isRunning: boolean;
  sendDisabled?: boolean;
  errorMessage?: string | null;
  labels: AgentChatLabels;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onStop?: () => void | Promise<void>;
};

export function AgentChatComposer({
  value,
  placeholder = "Ask anything.",
  disabled = false,
  isSending,
  isRunning,
  sendDisabled = false,
  errorMessage,
  labels,
  footerStart,
  footerEnd,
  onChange,
  onSend,
  onStop,
}: AgentChatComposerProps) {
  const showStop = isRunning && Boolean(onStop);
  const resolvedSendDisabled = disabled || sendDisabled || value.trim().length === 0;

  return (
    <div className="agent-chat-composer-shell">
      {errorMessage?.trim() ? (
        <div className="agent-chat-composer-error">{errorMessage}</div>
      ) : null}
      <div className="agent-chat-composer-frame">
        <textarea
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) {
              return;
            }
            event.preventDefault();
            if (showStop) {
              void onStop?.();
              return;
            }
            if (resolvedSendDisabled) {
              return;
            }
            void onSend();
          }}
        />
        <div className="agent-chat-composer-toolbar">
          <div className="agent-chat-composer-toolbar-start">{footerStart}</div>
          <div className="agent-chat-composer-toolbar-end">
            {footerEnd}
            {showStop ? (
              <button
                className="ncp-ui-button ncp-ui-button-danger"
                type="button"
                onClick={() => void onStop?.()}
              >
                {labels.stop}
              </button>
            ) : (
              <button
                className="ncp-ui-button"
                type="button"
                onClick={() => void onSend()}
                disabled={resolvedSendDisabled}
              >
                {isSending ? labels.running : labels.send}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
