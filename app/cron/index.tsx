import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useCronStore } from "../../src/stores/cron";
import type { CronJob } from "../../src/gateway/types";

export default function CronListScreen() {
  const router = useRouter();
  const { jobs, loading, fetch, remove, run, update } = useCronStore();

  useEffect(() => {
    fetch();
  }, []);

  const handleRun = (job: CronJob) => {
    Alert.alert("Run Now", `Execute "${job.message.slice(0, 50)}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Run", onPress: () => run(job.id) },
    ]);
  };

  const toggleEnabled = async (job: CronJob) => {
    await update({ id: job.id, enabled: !job.enabled });
  };

  const renderItem = ({ item }: { item: CronJob }) => (
    <Pressable onPress={() => router.push(`/cron/${item.id}`)}>
      <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-sm text-white" numberOfLines={2}>
              {item.message}
            </Text>
            <Text className="text-xs text-indigo-400 font-mono mt-1">
              {item.schedule}
            </Text>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleEnabled(item)}
            trackColor={{ false: "#334155", true: "#6366f1" }}
            thumbColor="#f8fafc"
          />
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-3">
            {item.agentId && (
              <Text className="text-xs text-slate-500">{item.agentId}</Text>
            )}
            {item.nextRun && (
              <Text className="text-xs text-slate-500">
                Next: {new Date(item.nextRun).toLocaleTimeString()}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => handleRun(item)}
            className="px-3 py-1 bg-slate-700 rounded-lg"
          >
            <Text className="text-xs text-slate-300">Run Now</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No cron jobs</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
