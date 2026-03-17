import { ChatButton } from '../../default-skin/button';
import { ChatUiPrimitives } from '../primitives/chat-ui-primitives';
import type { ChatInputBarActionsProps } from '../../view-models/chat-ui.types';
import { ArrowUp, Square } from 'lucide-react';

export function ChatInputBarActions(props: ChatInputBarActionsProps) {
  const { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } = ChatUiPrimitives;
  return (
    <div className="flex flex-col items-end gap-1">
      {props.sendError?.trim() ? (
        <div className="max-w-[420px] text-right text-[11px] text-red-600">{props.sendError}</div>
      ) : null}
      <div className="flex items-center gap-2">
        {props.isSending ? (
          props.canStopGeneration ? (
            <ChatButton
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full"
              aria-label={props.stopButtonLabel}
              onClick={() => void props.onStop()}
              disabled={props.stopDisabled}
            >
              <Square className="h-3 w-3 fill-current" />
            </ChatButton>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ChatButton
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      aria-label={props.stopButtonLabel}
                      disabled
                    >
                      <Square className="h-3 w-3 fill-current" />
                    </ChatButton>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{props.stopHint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        ) : (
          <ChatButton
            size="icon"
            className="h-8 w-8 rounded-full"
            aria-label={props.sendButtonLabel}
            onClick={() => void props.onSend()}
            disabled={props.sendDisabled}
          >
            <ArrowUp className="h-5 w-5" />
          </ChatButton>
        )}
      </div>
    </div>
  );
}
