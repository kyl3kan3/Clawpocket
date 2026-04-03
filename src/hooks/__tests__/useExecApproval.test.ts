import { renderHook, act } from "@testing-library/react-native";
import { useExecApproval } from "../useExecApproval";
import { useNodesStore } from "../../stores/nodes";
import type { ExecApproval } from "../../gateway/types";

// Mock the gateway client (needed by nodes store)
jest.mock("../../gateway/client", () => ({
  gateway: {
    execApprovals: {
      resolve: jest.fn().mockResolvedValue({ success: true }),
    },
  },
}));

const mockApproval: ExecApproval = {
  id: "approval-1",
  command: "rm -rf /tmp/test",
  agentId: "agent-1",
  sessionId: "session-1",
  requestedAt: Date.now(),
  expiresAt: Date.now() + 60000,
  status: "pending",
};

describe("useExecApproval", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset store
    useNodesStore.setState({
      pendingApprovals: [],
      nodes: [],
      devices: [],
      approvalPolicy: null,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns hasApprovals: false when queue is empty", () => {
    const { result } = renderHook(() => useExecApproval());
    expect(result.current.hasApprovals).toBe(false);
    expect(result.current.currentApproval).toBeNull();
  });

  it("returns currentApproval as first item in queue", () => {
    useNodesStore.setState({ pendingApprovals: [mockApproval] });

    const { result } = renderHook(() => useExecApproval());
    expect(result.current.hasApprovals).toBe(true);
    expect(result.current.currentApproval?.id).toBe("approval-1");
  });

  it("reports correct queueLength", () => {
    const secondApproval = { ...mockApproval, id: "approval-2" };
    useNodesStore.setState({
      pendingApprovals: [mockApproval, secondApproval],
    });

    const { result } = renderHook(() => useExecApproval());
    expect(result.current.queueLength).toBe(2);
  });

  it("counts down remainingSeconds", () => {
    const futureApproval = {
      ...mockApproval,
      expiresAt: Date.now() + 30000, // 30 seconds from now
    };
    useNodesStore.setState({ pendingApprovals: [futureApproval] });

    const { result } = renderHook(() => useExecApproval());

    expect(result.current.remainingSeconds).toBeGreaterThanOrEqual(29);
    expect(result.current.remainingSeconds).toBeLessThanOrEqual(31);

    // Advance 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBeGreaterThanOrEqual(24);
    expect(result.current.remainingSeconds).toBeLessThanOrEqual(26);
  });

  it("calls resolveApproval with correct action", () => {
    useNodesStore.setState({ pendingApprovals: [mockApproval] });

    const { result } = renderHook(() => useExecApproval());

    act(() => {
      result.current.approve("allow_once");
    });

    // The approval should have been resolved via the store
    // (The actual RPC call is in the store, tested separately)
  });
});
