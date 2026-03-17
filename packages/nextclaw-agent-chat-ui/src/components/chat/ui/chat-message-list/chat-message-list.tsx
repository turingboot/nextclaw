import type { ChatMessageListProps } from '../../view-models/chat-ui.types';
import { cn } from '../../internal/cn';
import { ChatMessageAvatar } from './chat-message-avatar';
import { ChatMessage } from './chat-message';
import { ChatMessageMeta } from './chat-message-meta';

export function ChatMessageList(props: ChatMessageListProps) {
  return (
    <div className={cn('space-y-5', props.className)}>
      {props.messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div key={message.id} className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser ? <ChatMessageAvatar role={message.role} /> : null}
            <div className={cn('w-fit max-w-[92%] space-y-2', isUser && 'flex flex-col items-end')}>
              <ChatMessage message={message} texts={props.texts} />
              <ChatMessageMeta roleLabel={message.roleLabel} timestampLabel={message.timestampLabel} isUser={isUser} />
            </div>
            {isUser ? <ChatMessageAvatar role={message.role} /> : null}
          </div>
        );
      })}

      {props.isSending && !props.hasStreamingDraft ? (
        <div className="flex justify-start gap-3">
          <ChatMessageAvatar role="assistant" />
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            {props.texts.typingLabel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
