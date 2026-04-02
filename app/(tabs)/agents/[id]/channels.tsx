import React, { useEffect } from "react";
import { View, Text, FlatList, Switch, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useChannelsStore } from "../../../../src/stores/channels";
import { useAgentsStore } from "../../../../src/stores/agents";
import { gateway } from "../../../../src/gateway/client";

export default function AgentChannelsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { channels, loading, fetch } = useChannelsStore();
  const agents = useAgentsStore((s) => s.agents);
  const agent = agents.find((a) => a.id === id);
  const boundChannels = new Set(agent?.channels ?? []);

  useEffect(() => {
    fetch();
  }, []);

  const toggleBinding = async (channelId: string, bound: boolean) => {
    try {
      const current = agent?.channels ?? [];
      const updated = bound
        ? [...current, channelId]
        : current.filter((c) => c !== channelId);

      await gateway.config.patch({
        path: `agents.${id}.channels`,
        value: updated,
        baseHash: "",
      });

      useAgentsStore.getState().update({ id: id, channels: updated });
    } catch {
      // Error handled elsewhere
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
        }
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between py-3 border-b border-slate-800">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2 h-2 rounded-full ${
                    item.status === "connected"
                      ? "bg-green-400"
                      : item.status === "error"
                        ? "bg-red-400"
                        : "bg-slate-500"
                  }`}
                />
                <Text className="text-sm text-white">{item.name}</Text>
              </View>
              <Text className="text-xs text-slate-500 mt-0.5">
                {item.type} - {item.status}
              </Text>
            </View>
            <Switch
              value={boundChannels.has(item.id)}
              onValueChange={(v) => toggleBinding(item.id, v)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-sm text-slate-500">No channels configured</Text>
          </View>
        }
      />
    </View>
  );
}
