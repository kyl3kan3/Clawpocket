import React from "react";
import { View, Text } from "react-native";
import { useConnectionStore } from "../stores/connection";

export function ConnectionBadge() {
  const authState = useConnectionStore((s) => s.authState);
  const health = useConnectionStore((s) => s.health);

  const statusConfig = {
    authenticated: { color: "bg-status-success", label: "Connected" },
    connecting: { color: "bg-status-warning", label: "Connecting..." },
    challenged: { color: "bg-status-warning", label: "Authenticating..." },
    authenticating: { color: "bg-status-warning", label: "Authenticating..." },
    waiting_approval: { color: "bg-status-info", label: "Awaiting Approval" },
    disconnected: { color: "bg-neutral-500", label: "Disconnected" },
    error: { color: "bg-status-error", label: "Error" },
  };

  const config = statusConfig[authState] ?? statusConfig.disconnected;

  return (
    <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800">
      <View className={`w-2 h-2 rounded-full ${config.color}`} />
      <Text className="text-xs text-slate-300 font-medium">
        {config.label}
      </Text>
      {health?.version && (
        <Text className="text-xs text-slate-500">v{health.version}</Text>
      )}
    </View>
  );
}
