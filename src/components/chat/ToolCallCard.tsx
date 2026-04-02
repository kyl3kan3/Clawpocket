import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ToolCall } from "../../gateway/types";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pending: "\u23F3",
    running: "\u26A1",
    completed: "\u2705",
    error: "\u274C",
  };

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View className="mt-2 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
        <View className="flex-row items-center px-3 py-2 gap-2">
          <Text className="text-sm">{statusIcon[toolCall.status]}</Text>
          <Text className="text-xs text-slate-300 font-mono flex-1" numberOfLines={1}>
            {toolCall.name}
          </Text>
          <Text className="text-xs text-slate-500">
            {expanded ? "\u25B2" : "\u25BC"}
          </Text>
        </View>

        {expanded && (
          <View className="px-3 pb-3 border-t border-slate-700">
            {/* Input */}
            <Text className="text-[10px] text-slate-500 mt-2 mb-1">INPUT</Text>
            <View className="bg-slate-900 rounded p-2">
              <Text
                className="text-xs text-slate-400 font-mono"
                selectable
                numberOfLines={10}
              >
                {JSON.stringify(toolCall.input, null, 2)}
              </Text>
            </View>

            {/* Output */}
            {toolCall.output && (
              <>
                <Text className="text-[10px] text-slate-500 mt-2 mb-1">
                  OUTPUT
                </Text>
                <View className="bg-slate-900 rounded p-2">
                  <Text
                    className="text-xs text-slate-400 font-mono"
                    selectable
                    numberOfLines={20}
                  >
                    {toolCall.output}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
