export { ChatInputBar } from './ui/chat-input-bar/chat-input-bar';
export { ChatMessageList } from './ui/chat-message-list/chat-message-list';

export { useActiveItemScroll } from './hooks/use-active-item-scroll';
export { useCopyFeedback } from './hooks/use-copy-feedback';
export { useElementWidth } from './hooks/use-element-width';
export { useStickyBottomScroll } from './hooks/use-sticky-bottom-scroll';
export { copyText } from './utils/copy-text';

export type {
  ChatTexts,
  ChatSlashItem,
  ChatSelectedItem,
  ChatToolbarIcon,
  ChatToolbarAccessoryIcon,
  ChatToolbarSelectOption,
  ChatToolbarSelect,
  ChatToolbarAccessory,
  ChatSkillPickerOption,
  ChatSkillPickerProps,
  ChatInputBarActionsProps,
  ChatInputBarToolbarProps,
  ChatInlineHint,
  ChatSlashMenuProps,
  ChatInputBarProps,
  ChatMessageRole,
  ChatToolPartViewModel,
  ChatMessagePartViewModel,
  ChatMessageViewModel,
  ChatMessageTexts,
  ChatMessageListProps
} from './view-models/chat-ui.types';
