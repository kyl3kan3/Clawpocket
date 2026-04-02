import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { Skill } from "../gateway/types";

interface SkillsState {
  skills: Skill[];
  availableBins: Skill[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  fetchBins: () => Promise<void>;
  install: (skillId: string) => Promise<void>;
  update: (skillId: string) => Promise<void>;
  toggle: (skillId: string, enabled: boolean) => Promise<void>;
  clearError: () => void;
}

export const useSkillsStore = create<SkillsState>((set) => ({
  skills: [],
  availableBins: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.skills.status();
      set({ skills: result.skills, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  fetchBins: async () => {
    try {
      const result = await gateway.skills.bins();
      set({ availableBins: result.bins });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  install: async (skillId) => {
    try {
      await gateway.skills.install({ skillId });
      // Refresh after install
      const result = await gateway.skills.status();
      set({ skills: result.skills });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  update: async (skillId) => {
    try {
      await gateway.skills.update({ skillId });
      const result = await gateway.skills.status();
      set({ skills: result.skills });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  toggle: async (skillId, enabled) => {
    try {
      await gateway.config.patch({
        path: `skills.${skillId}.enabled`,
        value: enabled,
        baseHash: "", // Will be managed by config store
      });
      set((s) => ({
        skills: s.skills.map((sk) =>
          sk.id === skillId ? { ...sk, enabled } : sk
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
