import { create } from "zustand";
import { gateway } from "../gateway/client";
import type {
  ChatMessage,
  ChatSendParams,
  ToolCall,
} from "../gateway/types";
import type { AgentEvent } from "../gateway/events";

interface ChatState {
  messages: ChatMessage[];
  streamBuffer: string;
  streamRunId: string | null;
  streamToolCalls: ToolCall[];
  sending: boolean;
  loading: boolean;
  currentSessionId: string | null;
  currentModel: string | null;
  error: string | null;

  // Actions
  send: (message: string, options?: Partial<ChatSendParams>) => Promise<void>;
  abort: () => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  setSession: (sessionId: string | null) => void;
  setModel: (model: string | null) => void;
  clearError: () => void;
  handleAgentEvent: (event: AgentEvent) => void;
  handleChatEvent: (payload: { sessionId: string; message: ChatMessage }) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamBuffer: "",
  streamRunId: null,
  streamToolCalls: [],
  sending: false,
  loading: false,
  currentSessionId: null,
  currentModel: null,
  error: null,

  send: async (message, options = {}) => {
    const { currentSessionId, currentModel } = get();
    set({ sending: true, error: null, streamBuffer: "", streamToolCalls: [] });

    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, userMessage] }));

    try {
      const result = await gateway.chat.send({
        message,
        sessionId: currentSessionId ?? undefined,
        model: currentModel ?? undefined,
        ...options,
      });
      set({ streamRunId: result.runId });
    } catch (err) {
      set({
        sending: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  abort: async () => {
    const { streamRunId } = get();
    if (!streamRunId) return;

    try {
      await gateway.chat.abort({ runId: streamRunId });
    } catch {
      // Best effort
    }
  },

  loadHistory: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const result = await gateway.chat.history({ sessionId });
      set({
        messages: result.messages,
        loading: false,
        currentSessionId: sessionId,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  setSession: (sessionId) => {
    set({
      currentSessionId: sessionId,
      messages: [],
      streamBuffer: "",
      streamRunId: null,
      streamToolCalls: [],
    });
  },

  setModel: (model) => set({ currentModel: model }),
  clearError: () => set({ error: null }),

  handleAgentEvent: (event: AgentEvent) => {
    const state = get();

    switch (event.state) {
      case "started":
        set({ streamRunId: event.runId, streamBuffer: "" });
        break;

      case "delta":
        set({ streamBuffer: state.streamBuffer + (event.text ?? "") });
        break;

      case "tool_call_start":
        if (event.toolCall) {
          const tc: ToolCall = {
            id: event.toolCall.id ?? `tc-${Date.now()}`,
            name: event.toolCall.name ?? "unknown",
            input: (event.toolCall.input as Record<string, unknown>) ?? {},
            status: "running",
          };
          set({ streamToolCalls: [...state.streamToolCalls, tc] });
        }
        break;

      case "tool_call_delta":
        if (event.toolCall?.id) {
          set({
            streamToolCalls: state.streamToolCalls.map((tc) =>
              tc.id === event.toolCall!.id
                ? {
                    ...tc,
                    output: (tc.output ?? "") + (event.toolCall!.output ?? ""),
                  }
                : tc
            ),
          });
        }
        break;

      case "tool_call_end":
        if (event.toolCall?.id) {
          set({
            streamToolCalls: state.streamToolCalls.map((tc) =>
              tc.id === event.toolCall!.id
                ? { ...tc, status: "completed" as const }
                : tc
            ),
          });
        }
        break;

      case "final": {
        const assistantMessage: ChatMessage = {
          id: event.message?.id ?? `msg-${Date.now()}`,
          role: "assistant",
          content: state.streamBuffer,
          timestamp: Date.now(),
          model: event.model,
          toolCalls:
            state.streamToolCalls.length > 0
              ? state.streamToolCalls
              : undefined,
          tokens: event.tokens,
        };
        set({
          messages: [...state.messages, assistantMessage],
          streamBuffer: "",
          streamRunId: null,
          streamToolCalls: [],
          sending: false,
          currentSessionId: event.sessionId ?? state.currentSessionId,
        });
        break;
      }

      case "aborted": {
        const abortedMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: state.streamBuffer,
          timestamp: Date.now(),
          aborted: true,
          toolCalls:
            state.streamToolCalls.length > 0
              ? state.streamToolCalls
              : undefined,
        };
        set({
          messages: [...state.messages, abortedMessage],
          streamBuffer: "",
          streamRunId: null,
          streamToolCalls: [],
          sending: false,
        });
        break;
      }

      case "error":
        set({
          error: event.error ?? "Unknown error",
          streamBuffer: "",
          streamRunId: null,
          streamToolCalls: [],
          sending: false,
        });
        break;
    }
  },

  handleChatEvent: (payload) => {
    const { currentSessionId } = get();
    if (payload.sessionId === currentSessionId) {
      set((s) => ({ messages: [...s.messages, payload.message] }));
    }
  },
}));
