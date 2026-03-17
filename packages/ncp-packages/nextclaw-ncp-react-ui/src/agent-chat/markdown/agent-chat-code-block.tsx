import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import type { AgentChatLabels } from "../agent-chat-types.js";

const CODE_LANGUAGE_REGEX = /language-([a-z0-9-]+)/i;

function flattenNodeText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(flattenNodeText).join("");
  }
  return "";
}

function normalizeCodeText(value: ReactNode): string {
  const content = flattenNodeText(value);
  return content.endsWith("\n") ? content.slice(0, -1) : content;
}

function resolveCodeLanguage(className?: string): string {
  const match = className ? CODE_LANGUAGE_REGEX.exec(className) : null;
  return match?.[1]?.toLowerCase() || "text";
}

type AgentChatCodeBlockProps = {
  className?: string;
  children: ReactNode;
  labels: AgentChatLabels;
};

export function AgentChatCodeBlock({
  className,
  children,
  labels,
}: AgentChatCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = useMemo(() => resolveCodeLanguage(className), [className]);
  const codeText = useMemo(() => normalizeCodeText(children), [children]);

  useEffect(() => {
    if (!copied || typeof window === "undefined") {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1300);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!codeText || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="agent-chat-code-block">
      <div className="agent-chat-code-toolbar">
        <span className="agent-chat-code-language">{language}</span>
        <button className="agent-chat-code-copy" type="button" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? labels.copiedCode : labels.copyCode}</span>
        </button>
      </div>
      <pre>
        <code className={className}>{codeText}</code>
      </pre>
    </div>
  );
}
