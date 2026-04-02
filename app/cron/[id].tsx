import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCronStore } from "../../src/stores/cron";
import type { CronRun } from "../../src/gateway/types";

export default function CronEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { jobs, runs, update, remove, fetchRuns, run } = useCronStore();
  const job = jobs.find((j) => j.id === id);

  const [schedule, setSchedule] = useState(job?.schedule ?? "");
  const [message, setMessage] = useState(job?.message ?? "");
  const [agentId, setAgentId] = useState(job?.agentId ?? "");
  const [sessionTarget, setSessionTarget] = useState(job?.sessionTarget ?? "");
  const [enabled, setEnabled] = useState(job?.enabled ?? true);

  const jobRuns = runs.get(id) ?? [];

  useEffect(() => {
    if (id) fetchRuns(id);
  }, [id]);

  if (!job) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-slate-500">Job not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    await update({ id, schedule, message, agentId: agentId || undefined, sessionTarget: sessionTarget || undefined, enabled });
    Alert.alert("Saved", "Cron job updated");
  };

  const handleDelete = () => {
    Alert.alert("Delete Job", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await remove(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-4 pt-4 pb-8">
        {/* Schedule */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">SCHEDULE</Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm font-mono"
            value={schedule}
            onChangeText={setSchedule}
            placeholder="*/15 * * * * or every: 1h"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Message */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">MESSAGE</Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Agent ID */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">AGENT</Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
            value={agentId}
            onChangeText={setAgentId}
            placeholder="Optional agent ID"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Session Target */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">
            SESSION TARGET
          </Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
            value={sessionTarget}
            onChangeText={setSessionTarget}
            placeholder="Optional"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Enabled */}
        <View className="flex-row items-center justify-between py-3 mb-4">
          <Text className="text-sm text-white">Enabled</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: "#334155", true: "#6366f1" }}
            thumbColor="#f8fafc"
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={handleSave}
            className="flex-1 py-3 bg-indigo-600 rounded-xl items-center"
          >
            <Text className="text-white font-semibold">Save</Text>
          </Pressable>
          <Pressable
            onPress={() => run(id)}
            className="py-3 px-6 bg-slate-700 rounded-xl items-center"
          >
            <Text className="text-slate-300 font-semibold">Run Now</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            className="py-3 px-4 bg-red-500/20 rounded-xl items-center"
          >
            <Text className="text-red-400 font-semibold">Delete</Text>
          </Pressable>
        </View>

        {/* Run History */}
        <Text className="text-sm text-slate-400 font-semibold mb-3">
          RUN HISTORY
        </Text>
        {jobRuns.length === 0 ? (
          <Text className="text-xs text-slate-500">No runs yet</Text>
        ) : (
          jobRuns.map((r: CronRun) => (
            <View
              key={r.id}
              className="bg-slate-800 rounded-lg p-3 mb-2"
            >
              <View className="flex-row justify-between mb-1">
                <Text
                  className={`text-xs font-medium ${
                    r.status === "completed"
                      ? "text-green-400"
                      : r.status === "error"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {r.status.toUpperCase()}
                </Text>
                <Text className="text-xs text-slate-500">
                  {new Date(r.startedAt).toLocaleString()}
                </Text>
              </View>
              {r.result && (
                <Text className="text-xs text-slate-400" numberOfLines={3}>
                  {r.result}
                </Text>
              )}
              {r.error && (
                <Text className="text-xs text-red-400" numberOfLines={3}>
                  {r.error}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
