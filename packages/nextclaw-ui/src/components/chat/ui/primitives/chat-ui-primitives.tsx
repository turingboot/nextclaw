import { ChatInput as DefaultInput } from '@/components/chat/default-skin/input';
import {
  ChatPopover as DefaultPopover,
  ChatPopoverAnchor as DefaultPopoverAnchor,
  ChatPopoverContent as DefaultPopoverContent,
  ChatPopoverTrigger as DefaultPopoverTrigger
} from '@/components/chat/default-skin/popover';
import {
  ChatSelect as DefaultSelect,
  ChatSelectContent as DefaultSelectContent,
  ChatSelectItem as DefaultSelectItem,
  ChatSelectTrigger as DefaultSelectTrigger,
  ChatSelectValue as DefaultSelectValue
} from '@/components/chat/default-skin/select';
import {
  ChatTooltip as DefaultTooltip,
  ChatTooltipContent as DefaultTooltipContent,
  ChatTooltipProvider as DefaultTooltipProvider,
  ChatTooltipTrigger as DefaultTooltipTrigger
} from '@/components/chat/default-skin/tooltip';

// Centralized primitive adapter layer for chat UI.
export const ChatUiPrimitives = {
  Popover: DefaultPopover,
  PopoverAnchor: DefaultPopoverAnchor,
  PopoverContent: DefaultPopoverContent,
  PopoverTrigger: DefaultPopoverTrigger,
  Input: DefaultInput,
  Select: DefaultSelect,
  SelectContent: DefaultSelectContent,
  SelectItem: DefaultSelectItem,
  SelectTrigger: DefaultSelectTrigger,
  SelectValue: DefaultSelectValue,
  Tooltip: DefaultTooltip,
  TooltipContent: DefaultTooltipContent,
  TooltipProvider: DefaultTooltipProvider,
  TooltipTrigger: DefaultTooltipTrigger
};
