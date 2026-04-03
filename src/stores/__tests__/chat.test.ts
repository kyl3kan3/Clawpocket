// Mock the gateway client
const mockGateway = {
  chat: {
    send: jest.fn().mockResolvedValue({ runId: "run-1", status: "started" }),
    history: jest.fn().mockResolvedValue({
      messages: [
        { id: "msg-1", role: "user", content: "hello", timestamp: 1000 },
        { id: "msg-2", role: "assistant", content: "hi", timestamp: 1001 },
      ],
    }),
    abort: jest.fn().mockResolvedValue({ success: true }),
    inject: jest.fn().mockResolvedValue({ success: true }),
  },
};

jest.mock("../../gateway/client", () => ({
  gateway: mockGateway,
}));

import { useChatStore } from "../chat";
import type { AgentEvent } from "../../gateway/events";

describe("useChatStore", () => {
  beforeEach(() => {
    // Reset store state
    useChatStore.setState({
      messages: [],
      streamBuffer: "",
      streamRunId: null,
      streamToolCalls: [],
      sending: false,
      loading: false,
      currentSessionId: null,
      currentModel: null,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe("send", () => {
    it("adds a user message and calls gateway.chat.send", async () => {
      await useChatStore.getState().send("hello world");

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].role).toBe("user");
      expect(state.messages[0].content).toBe("hello world");
      expect(mockGateway.chat.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "hello world" })
      );
    });

    it("includes sessionId and model when set", async () => {
      useChatStore.setState({
        currentSessionId: "session-1",
        currentModel: "claude-3",
      });

      await useChatStore.getState().send("test");

      expect(mockGateway.chat.send).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "session-1",
          model: "claude-3",
        })
      );
    });

    it("sets streamRunId from response", async () => {
      await useChatStore.getState().send("test");
      expect(useChatStore.getState().streamRunId).toBe("run-1");
    });

    it("sets error on failure", async () => {
      mockGateway.chat.send.mockRejectedValueOnce(new Error("Network error"));

      await useChatStore.getState().send("test");

      expect(useChatStore.getState().sending).toBe(false);
      expect(useChatStore.getState().error).toBe("Network error");
    });
  });

  describe("handleAgentEvent", () => {
    it("accumulates text on delta events", () => {
      const { handleAgentEvent } = useChatStore.getState();

      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "delta",
        text: "Hello ",
      } as AgentEvent);

      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "delta",
        text: "world!",
      } as AgentEvent);

      expect(useChatStore.getState().streamBuffer).toBe("Hello world!");
    });

    it("creates assistant message on final event", () => {
      const { handleAgentEvent } = useChatStore.getState();

      // Accumulate some text first
      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "delta",
        text: "Response text",
      } as AgentEvent);

      // Final event
      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "final",
        model: "claude-3",
        tokens: { input: 10, output: 20 },
      } as AgentEvent);

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].role).toBe("assistant");
      expect(state.messages[0].content).toBe("Response text");
      expect(state.messages[0].model).toBe("claude-3");
      expect(state.streamBuffer).toBe("");
      expect(state.streamRunId).toBeNull();
      expect(state.sending).toBe(false);
    });

    it("creates aborted message on aborted event", () => {
      const { handleAgentEvent } = useChatStore.getState();

      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "delta",
        text: "Partial ",
      } as AgentEvent);

      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "aborted",
      } as AgentEvent);

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].aborted).toBe(true);
      expect(state.messages[0].content).toBe("Partial ");
      expect(state.sending).toBe(false);
    });

    it("sets error on error event", () => {
      const { handleAgentEvent } = useChatStore.getState();

      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "error",
        error: "Something went wrong",
      } as AgentEvent);

      expect(useChatStore.getState().error).toBe("Something went wrong");
      expect(useChatStore.getState().sending).toBe(false);
    });

    it("tracks tool calls through lifecycle", () => {
      const { handleAgentEvent } = useChatStore.getState();

      // Tool call start
      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "tool_call_start",
        toolCall: { id: "tc-1", name: "search", input: { query: "test" } },
      } as AgentEvent);

      expect(useChatStore.getState().streamToolCalls.length).toBe(1);
      expect(useChatStore.getState().streamToolCalls[0].status).toBe("running");

      // Tool call delta (output streaming)
      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "tool_call_delta",
        toolCall: { id: "tc-1", output: "result data" },
      } as AgentEvent);

      expect(useChatStore.getState().streamToolCalls[0].output).toBe(
        "result data"
      );

      // Tool call end
      handleAgentEvent({
        runId: "run-1",
        sessionId: "s1",
        state: "tool_call_end",
        toolCall: { id: "tc-1" },
      } as AgentEvent);

      expect(useChatStore.getState().streamToolCalls[0].status).toBe(
        "completed"
      );
    });
  });

  describe("loadHistory", () => {
    it("fetches and replaces messages", async () => {
      await useChatStore.getState().loadHistory("session-1");

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(2);
      expect(state.messages[0].id).toBe("msg-1");
      expect(state.currentSessionId).toBe("session-1");
      expect(state.loading).toBe(false);
    });
  });

  describe("setSession", () => {
    it("clears all message state", () => {
      useChatStore.setState({
        messages: [{ id: "1", role: "user", content: "hi", timestamp: 1 }],
        streamBuffer: "partial",
        streamRunId: "run-1",
        streamToolCalls: [
          {
            id: "tc",
            name: "test",
            input: {},
            status: "running" as const,
          },
        ],
      });

      useChatStore.getState().setSession("new-session");

      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.streamBuffer).toBe("");
      expect(state.streamRunId).toBeNull();
      expect(state.streamToolCalls).toEqual([]);
      expect(state.currentSessionId).toBe("new-session");
    });
  });

  describe("abort", () => {
    it("calls gateway.chat.abort with current runId", async () => {
      useChatStore.setState({ streamRunId: "run-1" });

      await useChatStore.getState().abort();

      expect(mockGateway.chat.abort).toHaveBeenCalledWith({ runId: "run-1" });
    });

    it("does nothing when no runId", async () => {
      await useChatStore.getState().abort();
      expect(mockGateway.chat.abort).not.toHaveBeenCalled();
    });
  });
});
