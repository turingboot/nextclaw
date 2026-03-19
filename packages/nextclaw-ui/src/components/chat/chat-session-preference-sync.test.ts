import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateSession } from '@/api/config';
import { ChatSessionPreferenceSync } from '@/components/chat/chat-session-preference-sync';
import { useChatInputStore } from '@/components/chat/stores/chat-input.store';
import { useChatSessionListStore } from '@/components/chat/stores/chat-session-list.store';

vi.mock('@/api/config', () => ({
  updateSession: vi.fn(async () => ({
    key: 'session-1',
    totalMessages: 0,
    totalEvents: 0,
    sessionType: 'native',
    sessionTypeMutable: false,
    metadata: {},
    messages: [],
    events: []
  }))
}));

describe('ChatSessionPreferenceSync', () => {
  afterEach(() => {
    useChatInputStore.setState((state) => ({
      snapshot: {
        ...state.snapshot,
        selectedModel: '',
        selectedThinkingLevel: null
      }
    }));
    useChatSessionListStore.setState((state) => ({
      snapshot: {
        ...state.snapshot,
        selectedSessionKey: null
      }
    }));
    vi.clearAllMocks();
  });

  it('persists the selected model and thinking to the current session metadata', async () => {
    useChatInputStore.setState((state) => ({
      snapshot: {
        ...state.snapshot,
        selectedModel: 'openai/gpt-5',
        selectedThinkingLevel: 'high'
      }
    }));
    useChatSessionListStore.setState((state) => ({
      snapshot: {
        ...state.snapshot,
        selectedSessionKey: 'session-1'
      }
    }));

    const sync = new ChatSessionPreferenceSync(updateSession);
    sync.syncSelectedSessionPreferences();
    await vi.waitFor(() => {
      expect(updateSession).toHaveBeenCalledWith('session-1', {
        preferredModel: 'openai/gpt-5',
        preferredThinking: 'high'
      });
    });
  });
});
