import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { Agent, AgentFile } from "../gateway/types";

interface AgentsState {
  agents: Agent[];
  selectedAgentId: string | null;
  files: AgentFile[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  create: (params: Partial<Agent>) => Promise<Agent | null>;
  update: (params: { id: string } & Partial<Agent>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (id: string | null) => void;

  // Files
  fetchFiles: (agentId: string) => Promise<void>;
  readFile: (agentId: string, name: string) => Promise<string | null>;
  writeFile: (agentId: string, name: string, content: string) => Promise<void>;

  clearError: () => void;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  files: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.agents.list();
      set({ agents: result.agents, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  create: async (params) => {
    try {
      const agent = await gateway.agents.create(params);
      set((s) => ({ agents: [...s.agents, agent] }));
      return agent;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  },

  update: async (params) => {
    try {
      const agent = await gateway.agents.update(params);
      set((s) => ({
        agents: s.agents.map((a) => (a.id === params.id ? agent : a)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  remove: async (id) => {
    try {
      await gateway.agents.delete({ id });
      set((s) => ({
        agents: s.agents.filter((a) => a.id !== id),
        selectedAgentId:
          s.selectedAgentId === id ? null : s.selectedAgentId,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  select: (id) => set({ selectedAgentId: id, files: [] }),

  fetchFiles: async (agentId) => {
    try {
      const result = await gateway.agents.files.list({ agentId });
      set({ files: result.files });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  readFile: async (agentId, name) => {
    try {
      const result = await gateway.agents.files.read({ agentId, name });
      return result.content;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  },

  writeFile: async (agentId, name, content) => {
    try {
      await gateway.agents.files.write({ agentId, name, content });
      set((s) => ({
        files: s.files.map((f) =>
          f.name === name ? { ...f, content, updatedAt: Date.now() } : f
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
