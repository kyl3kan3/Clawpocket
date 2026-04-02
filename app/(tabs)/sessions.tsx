import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSessionsStore } from "../../src/stores/sessions";
import { useChatStore } from "../../src/stores/chat";
import type { Session } from "../../src/gateway/types";

export default function SessionsScreen() {
  const router = useRouter();
  const { sessions, loading, error, fetch, remove, reset, compact } =
    useSessionsStore();
  const setSession = useChatStore((s) => s.setSession);
  const loadHistory = useChatStore((s) => s.loadHistory);

  useEffect(() => {
    fetch();
  }, []);

  const onRefresh = () => fetch();

  const handleOpen = (session: Session) => {
    setSession(session.id);
    loadHistory(session.id);
    router.navigate("/(tabs)/chat");
  };

  const handleAction = (session: Session) => {
    Alert.alert(session.title ?? session.id.slice(0, 12), "Choose an action", [
      {
        text: "Open",
        onPress: () => handleOpen(session),
      },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => reset(session.id),
      },
      {
        text: "Compact",
        onPress: () => compact(session.id),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete session?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => remove(session.id),
            },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderItem = ({ item }: { item: Session }) => (
    <Pressable onPress={() => handleOpen(item)} onLongPress={() => handleAction(item)}>
      <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-medium text-white" numberOfLines={1}>
              {item.title ?? `Session ${item.id.slice(0, 8)}`}
            </Text>
            {item.agentId && (
              <Text className="text-xs text-indigo-400 mt-0.5">
                {item.agentId}
              </Text>
            )}
          </View>
          <Text className="text-xs text-slate-500">
            {formatRelative(item.lastActivity)}
          </Text>
        </View>

        <View className="flex-row gap-3">
          {item.model && (
            <Text className="text-xs text-slate-500">{item.model}</Text>
          )}
          <Text className="text-xs text-slate-500">
            {item.messageCount} msgs
          </Text>
          <Text className="text-xs text-slate-500">
            {item.tokens.input + item.tokens.output} tokens
          </Text>
          {item.channelId && (
            <Text className="text-xs text-slate-600">{item.channelId}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No sessions yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
