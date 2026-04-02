import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { CronJob, CronRun, CronAddParams } from "../gateway/types";

interface CronState {
  jobs: CronJob[];
  runs: Map<string, CronRun[]>;
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  add: (params: CronAddParams) => Promise<CronJob | null>;
  update: (params: { id: string } & Partial<CronAddParams>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  run: (id: string) => Promise<void>;
  fetchRuns: (jobId: string) => Promise<void>;
  clearError: () => void;
}

export const useCronStore = create<CronState>((set, get) => ({
  jobs: [],
  runs: new Map(),
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.cron.list();
      set({ jobs: result.jobs, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  add: async (params) => {
    try {
      const job = await gateway.cron.add(params);
      set((s) => ({ jobs: [...s.jobs, job] }));
      return job;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  },

  update: async (params) => {
    try {
      const job = await gateway.cron.update(params);
      set((s) => ({
        jobs: s.jobs.map((j) => (j.id === params.id ? job : j)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  remove: async (id) => {
    try {
      await gateway.cron.remove({ id });
      set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  run: async (id) => {
    try {
      await gateway.cron.run({ id });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  fetchRuns: async (jobId) => {
    try {
      const result = await gateway.cron.runs({ jobId });
      set((s) => {
        const runs = new Map(s.runs);
        runs.set(jobId, result.runs);
        return { runs };
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
