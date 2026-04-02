import { create } from "zustand";
import { gateway } from "../gateway/client";
import type { Node, Device, ExecApproval, ExecApprovalPolicy } from "../gateway/types";

interface NodesState {
  nodes: Node[];
  devices: Device[];
  pendingApprovals: ExecApproval[];
  approvalPolicy: ExecApprovalPolicy | null;
  loading: boolean;
  error: string | null;

  fetchNodes: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  fetchApprovalPolicy: () => Promise<void>;
  renameNode: (nodeId: string, name: string) => Promise<void>;
  approveDevice: (publicKey: string, approved: boolean) => Promise<void>;
  resolveApproval: (
    id: string,
    action: "allow_once" | "allow_always" | "deny"
  ) => Promise<void>;
  setApprovalPolicy: (policy: ExecApprovalPolicy) => Promise<void>;

  // Event handlers
  addPendingApproval: (approval: ExecApproval) => void;
  resolvePendingApproval: (approval: ExecApproval) => void;
  clearError: () => void;
}

export const useNodesStore = create<NodesState>((set) => ({
  nodes: [],
  devices: [],
  pendingApprovals: [],
  approvalPolicy: null,
  loading: false,
  error: null,

  fetchNodes: async () => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.nodes.list();
      set({ nodes: result.nodes, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  fetchDevices: async () => {
    try {
      const result = await gateway.devices.pairList();
      set({ devices: result.devices });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  fetchApprovalPolicy: async () => {
    try {
      const result = await gateway.execApprovals.get();
      set({ approvalPolicy: result.policy });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  renameNode: async (nodeId, name) => {
    try {
      await gateway.nodes.rename({ nodeId, name });
      set((s) => ({
        nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, name } : n)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  approveDevice: async (publicKey, approved) => {
    try {
      await gateway.devices.pairApprove({ publicKey, approved });
      set((s) => ({
        devices: s.devices.map((d) =>
          d.publicKey === publicKey ? { ...d, approved } : d
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  resolveApproval: async (id, action) => {
    try {
      await gateway.execApprovals.resolve({ id, action });
      set((s) => ({
        pendingApprovals: s.pendingApprovals.filter((a) => a.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  setApprovalPolicy: async (policy) => {
    try {
      await gateway.execApprovals.set(policy);
      set({ approvalPolicy: policy });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  addPendingApproval: (approval) =>
    set((s) => ({
      pendingApprovals: [...s.pendingApprovals, approval],
    })),

  resolvePendingApproval: (approval) =>
    set((s) => ({
      pendingApprovals: s.pendingApprovals.filter((a) => a.id !== approval.id),
    })),

  clearError: () => set({ error: null }),
}));
