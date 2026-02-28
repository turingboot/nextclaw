import { create } from 'zustand';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface UiState {
  // Connection status
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // Channel modal
  channelModal: { open: boolean; channel?: string };
  openChannelModal: (channel?: string) => void;
  closeChannelModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  channelModal: { open: false },
  openChannelModal: (channel) => set({ channelModal: { open: true, channel } }),
  closeChannelModal: () => set({ channelModal: { open: false } })
}));
