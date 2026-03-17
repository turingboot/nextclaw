import { type AgentChatWelcomeAction, AgentChatWelcome } from '@nextclaw/ncp-react-ui';
import { t } from '@/lib/i18n';
import { AlarmClock, BrainCircuit, MessageCircle } from 'lucide-react';

type ChatWelcomeProps = {
  onCreateSession: () => void;
};

const capabilities = [
  {
    icon: MessageCircle,
    titleKey: 'chatWelcomeCapability1Title' as const,
    descKey: 'chatWelcomeCapability1Desc' as const,
  },
  {
    icon: BrainCircuit,
    titleKey: 'chatWelcomeCapability2Title' as const,
    descKey: 'chatWelcomeCapability2Desc' as const,
  },
  {
    icon: AlarmClock,
    titleKey: 'chatWelcomeCapability3Title' as const,
    descKey: 'chatWelcomeCapability3Desc' as const,
  },
];

export function ChatWelcome({ onCreateSession }: ChatWelcomeProps) {
  const actions: AgentChatWelcomeAction[] = capabilities.map((cap) => {
    const Icon = cap.icon;
    return {
      id: cap.titleKey,
      title: t(cap.titleKey),
      description: t(cap.descKey),
      icon: <Icon className="h-4.5 w-4.5" />,
      onClick: onCreateSession,
    };
  });

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <AgentChatWelcome
          title={t('chatWelcomeTitle')}
          subtitle={t('chatWelcomeSubtitle')}
          actions={actions}
        />
      </div>
    </div>
  );
}
