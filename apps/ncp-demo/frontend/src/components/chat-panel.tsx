import { useEffect, useRef, useState } from "react";
import { NcpHttpAgentClientEndpoint } from "@nextclaw/ncp-http-agent-client";
import { useHydratedNcpAgent } from "@nextclaw/ncp-react";
import {
  AgentChatPanel,
  AgentChatWelcome,
  type AgentChatHeaderAction,
  type AgentChatWelcomeAction,
} from "@nextclaw/ncp-react-ui";
import { loadConversationSeed } from "../lib/session";

type ChatPanelProps = {
  sessionId: string;
  onRefresh: () => void;
};

export function ChatPanel({ sessionId, onRefresh }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const ncpClientRef = useRef<NcpHttpAgentClientEndpoint>();
  if (!ncpClientRef.current) {
    ncpClientRef.current = new NcpHttpAgentClientEndpoint({
      baseUrl: window.location.origin,
    });
  }
  const agent = useHydratedNcpAgent({
    sessionId,
    client: ncpClientRef.current,
    loadSeed: loadConversationSeed,
  });

  useEffect(() => {
    setDraft("");
  }, [sessionId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || agent.isSending || agent.isRunning) return;
    setDraft("");
    await agent.send(content);
    onRefresh();
  };

  const handleAbort = async () => {
    await agent.abort();
    onRefresh();
  };

  const headerActions: AgentChatHeaderAction[] = [
    {
      id: "stream-last-run",
      label: "Stream last run",
      onClick: agent.streamRun,
      disabled: !agent.isRunning,
      variant: "ghost",
    },
    {
      id: "abort",
      label: "Abort",
      onClick: () => {
        void handleAbort();
      },
      disabled: !agent.isRunning,
      variant: "danger",
    },
  ];

  const welcomeActions: AgentChatWelcomeAction[] = [
    {
      id: "time",
      title: "Ask for the current time",
      description: "Use the clock tool and reply with a clear local time.",
      icon: <span aria-hidden="true">T</span>,
      onClick: () => setDraft("Tell me the current time in Asia/Shanghai."),
    },
    {
      id: "sleep",
      title: "Try a long-running tool",
      description: "Call the sleep tool so we can test running state and stop.",
      icon: <span aria-hidden="true">Z</span>,
      onClick: () => setDraft("Call the sleep tool with durationMs 2000, then tell me when it finishes."),
    },
    {
      id: "agent",
      title: "Prompt the agent",
      description: "Ask for a short multi-step answer with tool usage and reasoning.",
      icon: <span aria-hidden="true">A</span>,
      onClick: () => setDraft("Plan a simple morning routine and explain it briefly."),
    },
  ];

  return (
    <main className="chat-panel-shell">
      <AgentChatPanel
        resetScrollKey={sessionId}
        title="NCP Agent Demo"
        subtitle="A standard reusable agent conversation surface powered by NCP."
        messages={agent.visibleMessages}
        emptyState={
          <AgentChatWelcome
            title="Build agent interfaces from reusable blocks"
            subtitle="This demo now consumes standardized pure display components from @nextclaw/ncp-react-ui."
            actions={welcomeActions}
          />
        }
        headerActions={headerActions}
        isHydrating={agent.isHydrating}
        isRunning={agent.isRunning}
        isSending={agent.isSending}
        onAbort={handleAbort}
        onChange={setDraft}
        onSend={handleSend}
        placeholder="Ask for the time, or ask the agent to sleep for 2 seconds."
        sendDisabled={agent.isSending || agent.isRunning || agent.isHydrating}
        value={draft}
        error={
          agent.hydrateError
            ? {
                code: "runtime-error",
                message: agent.hydrateError.message,
              }
            : (agent.snapshot.error ?? null)
        }
      />
    </main>
  );
}
