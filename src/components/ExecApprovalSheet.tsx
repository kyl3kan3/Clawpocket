import React from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useExecApproval } from "../hooks/useExecApproval";

export function ExecApprovalSheet() {
  const {
    currentApproval,
    remainingSeconds,
    queueLength,
    approve,
    hasApprovals,
  } = useExecApproval();

  if (!hasApprovals || !currentApproval) return null;

  const isUrgent = remainingSeconds <= 15;

  const handleAction = (action: "allow_once" | "allow_always" | "deny") => {
    Haptics.notificationAsync(
      action === "deny"
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    approve(action);
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-600 rounded-t-3xl px-5 py-6 shadow-2xl">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-white">
          Exec Approval
        </Text>
        <View
          className={`px-3 py-1 rounded-full ${
            isUrgent ? "bg-red-500/20" : "bg-slate-700"
          }`}
        >
          <Text
            className={`text-sm font-mono ${
              isUrgent ? "text-red-400" : "text-slate-300"
            }`}
          >
            {remainingSeconds}s
          </Text>
        </View>
      </View>

      {/* Command */}
      <View className="bg-slate-900 rounded-xl p-4 mb-4">
        <Text className="text-xs text-slate-500 mb-1">COMMAND</Text>
        <Text
          className="text-sm text-slate-200 font-mono"
          selectable
          numberOfLines={5}
        >
          {currentApproval.command}
        </Text>
      </View>

      {/* Context */}
      <View className="flex-row gap-4 mb-4">
        {currentApproval.agentId && (
          <View>
            <Text className="text-[10px] text-slate-500">AGENT</Text>
            <Text className="text-xs text-slate-300">
              {currentApproval.agentId}
            </Text>
          </View>
        )}
        {currentApproval.sessionId && (
          <View>
            <Text className="text-[10px] text-slate-500">SESSION</Text>
            <Text className="text-xs text-slate-300">
              {currentApproval.sessionId.slice(0, 8)}...
            </Text>
          </View>
        )}
      </View>

      {/* Queue indicator */}
      {queueLength > 1 && (
        <Text className="text-xs text-slate-500 mb-3 text-center">
          +{queueLength - 1} more pending
        </Text>
      )}

      {/* Actions */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => handleAction("deny")}
          className="flex-1 py-3 rounded-xl bg-red-500/20 items-center"
        >
          <Text className="text-red-400 font-semibold">Deny</Text>
        </Pressable>
        <Pressable
          onPress={() => handleAction("allow_once")}
          className="flex-1 py-3 rounded-xl bg-indigo-600 items-center"
        >
          <Text className="text-white font-semibold">Allow Once</Text>
        </Pressable>
        <Pressable
          onPress={() => handleAction("allow_always")}
          className="flex-1 py-3 rounded-xl bg-emerald-600 items-center"
        >
          <Text className="text-white font-semibold">Always</Text>
        </Pressable>
      </View>
    </View>
  );
}
