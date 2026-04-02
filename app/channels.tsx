import React, { useEffect } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useChannelsStore } from "../src/stores/channels";
import type { ChannelStatus } from "../src/gateway/types";

export default function ChannelsScreen() {
  const { channels, loading, fetch } = useChannelsStore();

  useEffect(() => {
    fetch();
  }, []);

  const renderItem = ({ item }: { item: ChannelStatus }) => (
    <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className={`w-3 h-3 rounded-full ${
              item.status === "connected"
                ? "bg-green-400"
                : item.status === "error"
                  ? "bg-red-400"
                  : "bg-slate-500"
            }`}
          />
          <View>
            <Text className="text-sm font-medium text-white">{item.name}</Text>
            <Text className="text-xs text-slate-400">{item.type}</Text>
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            item.status === "connected"
              ? "bg-green-500/20"
              : item.status === "error"
                ? "bg-red-500/20"
                : "bg-slate-700"
          }`}
        >
          <Text
            className={`text-xs ${
              item.status === "connected"
                ? "text-green-400"
                : item.status === "error"
                  ? "text-red-400"
                  : "text-slate-400"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>
      {item.error && (
        <View className="mt-2 bg-red-500/10 rounded-lg px-3 py-2">
          <Text className="text-xs text-red-400">{item.error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={channels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No channels configured</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
