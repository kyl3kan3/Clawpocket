import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { Session, SessionPatchParams, SessionSettings } from "../gateway/types";

interface SessionsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  patch: (params: SessionPatchParams) => Promise<void>;
  reset: (sessionId: string) => Promise<void>;
  remove: (sessionId: string) => Promise<void>;
  compact: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.sessions.list();
      set({ sessions: result.sessions, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  patch: async (params) => {
    try {
      await gateway.sessions.patch(params);
      set((s) => ({
        sessions: s.sessions.map((session) =>
          session.id === params.sessionId
            ? {
                ...session,
                ...(params.title !== undefined ? { title: params.title } : {}),
                ...(params.settings
                  ? { settings: { ...session.settings, ...params.settings } }
                  : {}),
              }
            : session
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  reset: async (sessionId) => {
    try {
      await gateway.sessions.reset({ sessionId });
      set((s) => ({
        sessions: s.sessions.map((session) =>
          session.id === sessionId
            ? { ...session, messageCount: 0, tokens: { input: 0, output: 0 } }
            : session
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  remove: async (sessionId) => {
    try {
      await gateway.sessions.delete({ sessionId });
      set((s) => ({
        sessions: s.sessions.filter((session) => session.id !== sessionId),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  compact: async (sessionId) => {
    try {
      await gateway.sessions.compact({ sessionId });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
