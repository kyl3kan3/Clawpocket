import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { gateway } from "../gateway/client";
import { useConnectionStore } from "../stores/connection";
import { useChatStore } from "../stores/chat";
import { useNodesStore } from "../stores/nodes";
import { useLogsStore } from "../stores/logs";
import type { GatewayEventMap } from "../gateway/events";

/**
 * Master hook that wires Gateway events to Zustand stores.
 * Call once in the root layout.
 */
export function useGateway() {
  const { authState, setHealth, setAuthState } = useConnectionStore();
  const { handleAgentEvent, handleChatEvent } = useChatStore();
  const { addPendingApproval, resolvePendingApproval } = useNodesStore();
  const { addEntry } = useLogsStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (authState !== "authenticated") return;

    // Wire up all event handlers
    const handlers: Array<[keyof GatewayEventMap, (payload: unknown) => void]> =
      [
        ["health", (p) => setHealth(p as GatewayEventMap["health"])],
        ["agent", (p) => handleAgentEvent(p as GatewayEventMap["agent"])],
        ["chat", (p) => handleChatEvent(p as GatewayEventMap["chat"])],
        [
          "exec.approval.requested",
          (p) =>
            addPendingApproval(
              p as GatewayEventMap["exec.approval.requested"]
            ),
        ],
        [
          "exec.approval.resolved",
          (p) =>
            resolvePendingApproval(
              p as GatewayEventMap["exec.approval.resolved"]
            ),
        ],
        ["log", (p) => addEntry(p as GatewayEventMap["log"])],
      ];

    for (const [event, handler] of handlers) {
      gateway.on(event, handler as never);
    }

    return () => {
      for (const [event, handler] of handlers) {
        gateway.off(event, handler as never);
      }
    };
  }, [
    authState,
    setHealth,
    handleAgentEvent,
    handleChatEvent,
    addPendingApproval,
    resolvePendingApproval,
    addEntry,
  ]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          // Returning to foreground — reconnect
          if (authState === "authenticated") {
            gateway.reconnect();
          }
        } else if (nextState.match(/inactive|background/)) {
          // Going to background — disconnect gracefully
          gateway.disconnect();
          setAuthState("disconnected");
        }
        appState.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [authState, setAuthState]);

  return { connected: authState === "authenticated" };
}
