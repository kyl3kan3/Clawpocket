import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAgentsStore } from "../../../src/stores/agents";
import type { Agent } from "../../../src/gateway/types";

export default function AgentsListScreen() {
  const router = useRouter();
  const { agents, loading, fetch, remove } = useAgentsStore();

  useEffect(() => {
    fetch();
  }, []);

  const handleCreate = () => {
    Alert.prompt("New Agent", "Enter agent name:", async (name) => {
      if (name?.trim()) {
        const agent = await useAgentsStore.getState().create({ name: name.trim() });
        if (agent) {
          router.push(`/(tabs)/agents/${agent.id}`);
        }
      }
    });
  };

  const renderItem = ({ item }: { item: Agent }) => (
    <Pressable onPress={() => router.push(`/(tabs)/agents/${item.id}`)}>
      <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-medium text-white">{item.name}</Text>
            {item.description && (
              <Text className="text-xs text-slate-400 mt-1" numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          {item.model && (
            <View className="px-2 py-1 bg-slate-700 rounded-md">
              <Text className="text-xs text-slate-300">{item.model}</Text>
            </View>
          )}
        </View>
        <View className="flex-row gap-3 mt-2">
          {item.channels && item.channels.length > 0 && (
            <Text className="text-xs text-indigo-400">
              {item.channels.length} channel{item.channels.length > 1 ? "s" : ""}
            </Text>
          )}
          <Text className="text-xs text-slate-500">
            Updated {formatDate(item.updatedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800">
        <Text className="text-lg font-semibold text-white">Agents</Text>
        <Pressable
          onPress={handleCreate}
          className="px-4 py-2 bg-indigo-600 rounded-lg"
        >
          <Text className="text-sm text-white font-medium">+ New</Text>
        </Pressable>
      </View>

      <FlatList
        data={agents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No agents configured</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
