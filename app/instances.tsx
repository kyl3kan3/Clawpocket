import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { gateway } from "../src/gateway/client";
import type { PresenceEntry } from "../src/gateway/types";

export default function InstancesScreen() {
  const [entries, setEntries] = useState<PresenceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const result = await gateway.presence();
      setEntries(result.entries);
    } catch {
      // Error handled
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const renderItem = ({ item }: { item: PresenceEntry }) => {
    const duration = Date.now() - item.connectedAt;
    const hours = Math.floor(duration / 3600000);
    const mins = Math.floor((duration % 3600000) / 60000);

    return (
      <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <Text className="text-sm text-white font-medium">
              {item.deviceName ?? item.deviceId.slice(0, 12)}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded ${
              item.type === "operator" ? "bg-indigo-600/30" : "bg-slate-700"
            }`}
          >
            <Text
              className={`text-xs ${
                item.type === "operator"
                  ? "text-indigo-300"
                  : "text-slate-400"
              }`}
            >
              {item.type}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3 mt-2">
          <Text className="text-xs text-slate-500">{item.platform}</Text>
          <Text className="text-xs text-slate-500">
            Connected {hours > 0 ? `${hours}h ` : ""}{mins}m
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={(item) => item.deviceId}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">
                No connected instances
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
