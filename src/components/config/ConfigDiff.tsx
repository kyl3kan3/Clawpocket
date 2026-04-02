import React from "react";
import { View, Text, ScrollView } from "react-native";

interface ConfigDiffProps {
  original: Record<string, unknown>;
  changes: Record<string, unknown>;
}

export function ConfigDiff({ original, changes }: ConfigDiffProps) {
  const paths = Object.keys(changes);

  if (paths.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-sm text-slate-500 text-center">No changes</Text>
      </View>
    );
  }

  return (
    <ScrollView className="max-h-[300px]">
      <View className="p-3 gap-2">
        <Text className="text-xs text-slate-500 font-semibold mb-1">
          {paths.length} CHANGE{paths.length > 1 ? "S" : ""}
        </Text>
        {paths.map((path) => {
          const oldVal = getNestedValue(original, path);
          const newVal = changes[path];
          return (
            <View key={path} className="bg-slate-800 rounded-lg p-3">
              <Text className="text-xs text-slate-400 font-mono mb-1">
                {path}
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[10px] text-red-400">OLD</Text>
                  <Text className="text-xs text-red-300 font-mono">
                    {JSON.stringify(oldVal)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-green-400">NEW</Text>
                  <Text className="text-xs text-green-300 font-mono">
                    {JSON.stringify(newVal)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
