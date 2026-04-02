import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { ConfigGetResult } from "../gateway/types";

interface ConfigState {
  config: Record<string, unknown> | null;
  schema: Record<string, unknown> | null;
  baseHash: string | null;
  dirty: boolean;
  pendingChanges: Record<string, unknown>;
  loading: boolean;
  applying: boolean;
  error: string | null;
  rateLimitedUntil: number | null;

  fetch: () => Promise<void>;
  fetchSchema: () => Promise<void>;
  patch: (path: string, value: unknown) => Promise<void>;
  apply: () => Promise<void>;
  setPendingChange: (path: string, value: unknown) => void;
  clearPendingChanges: () => void;
  clearError: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  schema: null,
  baseHash: null,
  dirty: false,
  pendingChanges: {},
  loading: false,
  applying: false,
  error: null,
  rateLimitedUntil: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.config.get();
      set({
        config: result.config,
        baseHash: result.baseHash,
        schema: result.schema ?? null,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  fetchSchema: async () => {
    try {
      const result = await gateway.config.schema();
      set({ schema: result.schema });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  patch: async (path, value) => {
    const { baseHash, rateLimitedUntil } = get();
    if (!baseHash) return;

    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      set({
        error: `Rate limited. Retry after ${Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s`,
      });
      return;
    }

    try {
      const result = await gateway.config.patch({ path, value, baseHash });
      set({
        baseHash: result.baseHash,
        dirty: true,
      });
    } catch (err: unknown) {
      const error = err as { retryAfterMs?: number; message?: string };
      if (error.retryAfterMs) {
        set({
          rateLimitedUntil: Date.now() + error.retryAfterMs,
          error: `Rate limited. Retry after ${Math.ceil(error.retryAfterMs / 1000)}s`,
        });
      } else {
        set({
          error: error.message ?? String(err),
        });
      }
    }
  },

  apply: async () => {
    set({ applying: true, error: null });
    try {
      const result = await gateway.config.apply();
      set({ applying: false, dirty: false });
    } catch (err) {
      set({
        applying: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  setPendingChange: (path, value) => {
    set((s) => ({
      pendingChanges: { ...s.pendingChanges, [path]: value },
      dirty: true,
    }));
  },

  clearPendingChanges: () => set({ pendingChanges: {}, dirty: false }),
  clearError: () => set({ error: null }),
}));
