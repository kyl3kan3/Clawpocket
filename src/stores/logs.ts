import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { LogEntry } from "../gateway/types";

const MAX_LOG_ENTRIES = 1000;

interface LogsState {
  entries: LogEntry[];
  filter: "debug" | "info" | "warn" | "error" | null;
  autoScroll: boolean;
  streaming: boolean;
  error: string | null;

  startStreaming: (level?: string) => Promise<void>;
  stopStreaming: () => void;
  addEntry: (entry: LogEntry) => void;
  setFilter: (filter: LogsState["filter"]) => void;
  setAutoScroll: (enabled: boolean) => void;
  clear: () => void;
  exportAsText: () => string;
}

export const useLogsStore = create<LogsState>((set, get) => ({
  entries: [],
  filter: null,
  autoScroll: true,
  streaming: false,
  error: null,

  startStreaming: async (level) => {
    set({ streaming: true, error: null });
    try {
      const result = await gateway.logs.tail({ level, limit: 100 });
      set({ entries: result.entries });
    } catch (err) {
      set({
        streaming: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  stopStreaming: () => set({ streaming: false }),

  addEntry: (entry) => {
    set((s) => {
      const entries = [...s.entries, entry];
      if (entries.length > MAX_LOG_ENTRIES) {
        entries.splice(0, entries.length - MAX_LOG_ENTRIES);
      }
      return { entries };
    });
  },

  setFilter: (filter) => set({ filter }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  clear: () => set({ entries: [] }),

  exportAsText: () => {
    const { entries, filter } = get();
    const filtered = filter
      ? entries.filter((e) => e.level === filter)
      : entries;
    return filtered
      .map(
        (e) =>
          `[${new Date(e.timestamp).toISOString()}] [${e.level.toUpperCase()}] ${e.source ? `[${e.source}] ` : ""}${e.message}`
      )
      .join("\n");
  },
}));
