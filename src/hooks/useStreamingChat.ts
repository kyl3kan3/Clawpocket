import { useChatStore } from "../stores/chat";

/**
 * Convenience hook for chat screen — selects only the fields needed for rendering.
 */
export function useStreamingChat() {
  const messages = useChatStore((s) => s.messages);
  const streamBuffer = useChatStore((s) => s.streamBuffer);
  const streamToolCalls = useChatStore((s) => s.streamToolCalls);
  const sending = useChatStore((s) => s.sending);
  const loading = useChatStore((s) => s.loading);
  const error = useChatStore((s) => s.error);
  const send = useChatStore((s) => s.send);
  const abort = useChatStore((s) => s.abort);
  const clearError = useChatStore((s) => s.clearError);

  const isStreaming = streamBuffer.length > 0;

  return {
    messages,
    streamBuffer,
    streamToolCalls,
    sending,
    loading,
    error,
    isStreaming,
    send,
    abort,
    clearError,
  };
}
