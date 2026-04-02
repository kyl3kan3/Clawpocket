import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { ChannelStatus } from "../gateway/types";

interface ChannelsState {
  channels: ChannelStatus[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  clearError: () => void;
}

export const useChannelsStore = create<ChannelsState>((set) => ({
  channels: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.channels.status();
      set({ channels: result.channels, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  clearError: () => set({ error: null }),
}));
