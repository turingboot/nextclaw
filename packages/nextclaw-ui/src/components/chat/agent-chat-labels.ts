import { type AgentChatLabels } from '@nextclaw/ncp-react-ui';
import { t } from '@/lib/i18n';

export function buildAgentChatLabels(): AgentChatLabels {
  return {
    assistantRole: t('chatRoleAssistant'),
    userRole: t('chatRoleUser'),
    toolRole: t('chatRoleTool'),
    systemRole: t('chatRoleSystem'),
    serviceRole: t('chatRoleService'),
    messageRole: t('chatRoleMessage'),
    reasoning: t('chatReasoning'),
    toolCall: t('chatToolCall'),
    toolResult: t('chatToolResult'),
    toolOutput: t('chatToolOutput'),
    toolNoOutput: t('chatToolNoOutput'),
    sourceLabel: t('chatSourceLabel'),
    attachmentLabel: t('chatAttachmentLabel'),
    typing: t('chatTyping'),
    copyCode: t('chatCodeCopy'),
    copiedCode: t('chatCodeCopied'),
    send: t('chatSend'),
    running: t('chatSending'),
    stop: t('chatStop'),
  };
}
