import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useExecApproval } from "../src/hooks/useExecApproval";
import * as Haptics from "expo-haptics";

export default function ExecApprovalModal() {
  const router = useRouter();
  const {
    currentApproval,
    remainingSeconds,
    queueLength,
    approve,
    hasApprovals,
  } = useExecApproval();

  if (!hasApprovals || !currentApproval) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-slate-500">No pending approvals</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-slate-800 rounded-xl"
        >
          <Text className="text-slate-300">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isUrgent = remainingSeconds <= 15;

  const handleAction = (action: "allow_once" | "allow_always" | "deny") => {
    Haptics.notificationAsync(
      action === "deny"
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    approve(action);
    if (queueLength <= 1) {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-8">
      {/* Timer */}
      <View className="items-center mb-6">
        <View
          className={`w-20 h-20 rounded-full items-center justify-center ${
            isUrgent ? "bg-red-500/20" : "bg-slate-800"
          }`}
        >
          <Text
            className={`text-2xl font-bold font-mono ${
              isUrgent ? "text-red-400" : "text-white"
            }`}
          >
            {remainingSeconds}
          </Text>
        </View>
        <Text className="text-xs text-slate-500 mt-2">seconds remaining</Text>
      </View>

      {/* Command */}
      <View className="bg-slate-800 rounded-xl p-5 mb-4">
        <Text className="text-xs text-slate-500 mb-2">COMMAND</Text>
        <Text className="text-sm text-white font-mono" selectable>
          {currentApproval.command}
        </Text>
      </View>

      {/* Context */}
      <View className="flex-row gap-4 mb-6">
        {currentApproval.agentId && (
          <View className="bg-slate-800 rounded-xl p-4 flex-1">
            <Text className="text-[10px] text-slate-500">AGENT</Text>
            <Text className="text-xs text-slate-300 mt-0.5">
              {currentApproval.agentId}
            </Text>
          </View>
        )}
        {currentApproval.sessionId && (
          <View className="bg-slate-800 rounded-xl p-4 flex-1">
            <Text className="text-[10px] text-slate-500">SESSION</Text>
            <Text className="text-xs text-slate-300 mt-0.5">
              {currentApproval.sessionId.slice(0, 12)}...
            </Text>
          </View>
        )}
      </View>

      {queueLength > 1 && (
        <Text className="text-xs text-slate-500 text-center mb-4">
          +{queueLength - 1} more pending approvals
        </Text>
      )}

      {/* Actions */}
      <View className="gap-3">
        <Pressable
          onPress={() => handleAction("allow_once")}
          className="py-4 bg-indigo-600 rounded-xl items-center"
        >
          <Text className="text-white font-semibold text-base">
            Allow Once
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleAction("allow_always")}
          className="py-4 bg-emerald-600 rounded-xl items-center"
        >
          <Text className="text-white font-semibold text-base">
            Allow Always
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleAction("deny")}
          className="py-4 bg-red-500/20 rounded-xl items-center"
        >
          <Text className="text-red-400 font-semibold text-base">Deny</Text>
        </Pressable>
      </View>
    </View>
  );
}
