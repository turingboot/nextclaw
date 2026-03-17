import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentChatLabels } from "../agent-chat-types.js";
import { cx, isExternalHref, resolveSafeHref } from "../agent-chat-utils.js";
import { AgentChatCodeBlock } from "./agent-chat-code-block.js";

const MARKDOWN_MAX_CHARS = 140_000;

function trimMarkdown(value: string): string {
  if (value.length <= MARKDOWN_MAX_CHARS) {
    return value;
  }
  return `${value.slice(0, MARKDOWN_MAX_CHARS)}\n\n...`;
}

type AgentChatMarkdownProps = {
  text: string;
  isUser: boolean;
  labels: AgentChatLabels;
};

export function AgentChatMarkdown({
  text,
  isUser,
  labels,
}: AgentChatMarkdownProps) {
  const components = useMemo<Components>(
    () => ({
      a: ({ href, children, ...props }) => {
        const safeHref = resolveSafeHref(href);
        if (!safeHref) {
          return <span className="agent-chat-link-invalid">{children}</span>;
        }
        const external = isExternalHref(safeHref);
        return (
          <a
            {...props}
            href={safeHref}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer noopener" : undefined}
          >
            {children}
          </a>
        );
      },
      table: ({ children, ...props }) => (
        <div className="agent-chat-table-wrap">
          <table {...props}>{children}</table>
        </div>
      ),
      code: ({ className, children, ...props }) => {
        const plainText = String(children ?? "");
        const isInlineCode = !className && !plainText.includes("\n");
        if (isInlineCode) {
          return (
            <code {...props} className={cx("agent-chat-inline-code", className)}>
              {children}
            </code>
          );
        }
        return (
          <AgentChatCodeBlock className={className} labels={labels}>
            {children}
          </AgentChatCodeBlock>
        );
      },
    }),
    [labels],
  );

  return (
    <div
      className={cx(
        "agent-chat-markdown",
        isUser ? "agent-chat-markdown-user" : "agent-chat-markdown-assistant",
      )}
    >
      <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={components}>
        {trimMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}
