import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { AuthResult, AuthState } from "../gateway/auth";
import type { HealthStatus } from "../gateway/types";
import { getGatewayUrl } from "../lib/secure-store";
import { gatewayUrl } from "../gateway/url";

interface ConnectionState {
  url: string | null;
  authState: AuthState;
  authError: string | null;
  health: HealthStatus | null;
  reconnecting: boolean;

  // Actions
  connect: (url: string) => Promise<AuthResult>;
  disconnect: () => void;
  reconnect: () => void;
  restoreConnection: () => Promise<void>;
  setHealth: (health: HealthStatus) => void;
  setAuthState: (state: AuthState, error?: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  url: null,
  authState: "disconnected",
  authError: null,
  health: null,
  reconnecting: false,

  connect: async (url: string) => {
    set({ url, authState: "connecting", authError: null });

    try {
      const wsUrl = gatewayUrl(url);
      const result = await gateway.connect(wsUrl);

      set({
        authState: result.state,
        authError: result.error ?? null,
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ authState: "error", authError: error });
      return { success: false, state: "error" as AuthState, error };
    }
  },

  disconnect: () => {
    gateway.disconnect();
    set({
      authState: "disconnected",
      authError: null,
      health: null,
    });
  },

  reconnect: () => {
    set({ reconnecting: true });
    gateway.reconnect();
  },

  restoreConnection: async () => {
    const url = await getGatewayUrl();
    if (url) {
      await get().connect(url);
    }
  },

  setHealth: (health) => set({ health }),
  setAuthState: (authState, authError) =>
    set({ authState, authError: authError ?? null, reconnecting: false }),
}));

