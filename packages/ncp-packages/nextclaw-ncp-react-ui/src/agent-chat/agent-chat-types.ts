import type { ReactNode } from "react";

export type AgentChatLabels = {
  assistantRole: string;
  userRole: string;
  toolRole: string;
  systemRole: string;
  serviceRole: string;
  messageRole: string;
  reasoning: string;
  toolCall: string;
  toolResult: string;
  toolOutput: string;
  toolNoOutput: string;
  sourceLabel: string;
  attachmentLabel: string;
  typing: string;
  copyCode: string;
  copiedCode: string;
  send: string;
  running: string;
  stop: string;
};

export type AgentChatHeaderAction = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
};

export type AgentChatWelcomeAction = {
  id: string;
  title: string;
  description?: string;
  onClick: () => void;
  icon?: ReactNode;
};

export const defaultAgentChatLabels: AgentChatLabels = {
  assistantRole: "Assistant",
  userRole: "You",
  toolRole: "Tool",
  systemRole: "System",
  serviceRole: "Service",
  messageRole: "Message",
  reasoning: "Reasoning",
  toolCall: "Tool call",
  toolResult: "Tool result",
  toolOutput: "Output",
  toolNoOutput: "No output returned.",
  sourceLabel: "Source",
  attachmentLabel: "Attachment",
  typing: "Thinking...",
  copyCode: "Copy",
  copiedCode: "Copied",
  send: "Send",
  running: "Running...",
  stop: "Stop",
};
