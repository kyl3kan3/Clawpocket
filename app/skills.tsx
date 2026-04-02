import React, { useEffect } from "react";
import { View, Text, FlatList, Switch, Pressable, RefreshControl } from "react-native";
import { useSkillsStore } from "../src/stores/skills";
import type { Skill } from "../src/gateway/types";

export default function SkillsScreen() {
  const { skills, loading, fetch, toggle, install } = useSkillsStore();

  useEffect(() => {
    fetch();
  }, []);

  const renderItem = ({ item }: { item: Skill }) => (
    <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-medium text-white">{item.name}</Text>
          {item.description && (
            <Text className="text-xs text-slate-400 mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View className="flex-row gap-2 mt-1.5">
            <Text className="text-[10px] text-slate-500">{item.source}</Text>
            {item.version && (
              <Text className="text-[10px] text-slate-600">v{item.version}</Text>
            )}
          </View>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={(v) => toggle(item.id, v)}
          trackColor={{ false: "#334155", true: "#6366f1" }}
          thumbColor="#f8fafc"
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={skills}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No skills installed</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
