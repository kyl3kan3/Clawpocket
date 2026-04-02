import React, { useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLogsStore } from "../src/stores/logs";
import type { LogEntry } from "../src/gateway/types";

const LEVEL_COLORS = {
  debug: "text-slate-500",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

const LEVELS = ["debug", "info", "warn", "error"] as const;

export default function LogsScreen() {
  const {
    entries,
    filter,
    autoScroll,
    streaming,
    startStreaming,
    setFilter,
    setAutoScroll,
    clear,
    exportAsText,
  } = useLogsStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    startStreaming();
    return () => useLogsStore.getState().stopStreaming();
  }, []);

  const filteredEntries = filter
    ? entries.filter((e) => e.level === filter)
    : entries;

  useEffect(() => {
    if (autoScroll && filteredEntries.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [filteredEntries.length, autoScroll]);

  const handleExport = async () => {
    const text = exportAsText();
    await Clipboard.setStringAsync(text);
  };

  const renderItem = ({ item }: { item: LogEntry }) => (
    <View className="px-3 py-1.5 border-b border-slate-800/50">
      <View className="flex-row items-center gap-2">
        <Text className={`text-[10px] font-mono w-10 ${LEVEL_COLORS[item.level]}`}>
          {item.level.toUpperCase().slice(0, 4)}
        </Text>
        <Text className="text-[10px] text-slate-600 font-mono w-16">
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
        {item.source && (
          <Text className="text-[10px] text-slate-600 font-mono">
            [{item.source}]
          </Text>
        )}
      </View>
      <Text className="text-xs text-slate-300 ml-12" selectable>
        {item.message}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      {/* Toolbar */}
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-slate-800">
        {LEVELS.map((level) => (
          <Pressable
            key={level}
            onPress={() => setFilter(filter === level ? null : level)}
            className={`px-3 py-1 rounded-md ${
              filter === level ? "bg-indigo-600" : "bg-slate-800"
            }`}
          >
            <Text
              className={`text-xs ${
                filter === level ? "text-white" : LEVEL_COLORS[level]
              }`}
            >
              {level}
            </Text>
          </Pressable>
        ))}
        <View className="flex-1" />
        <Pressable onPress={() => setAutoScroll(!autoScroll)}>
          <Text
            className={`text-xs ${
              autoScroll ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            Auto
          </Text>
        </Pressable>
        <Pressable onPress={handleExport}>
          <Text className="text-xs text-slate-400">Copy</Text>
        </Pressable>
        <Pressable onPress={clear}>
          <Text className="text-xs text-slate-500">Clear</Text>
        </Pressable>
      </View>

      {/* Log entries */}
      <FlatList
        ref={flatListRef}
        data={filteredEntries}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        initialNumToRender={50}
        maxToRenderPerBatch={30}
        windowSize={5}
      />

      {/* Status bar */}
      <View className="flex-row items-center justify-between px-3 py-1.5 bg-slate-800 border-t border-slate-700">
        <Text className="text-[10px] text-slate-500">
          {filteredEntries.length} entries
          {filter ? ` (filtered: ${filter})` : ""}
        </Text>
        <View className="flex-row items-center gap-1">
          <View
            className={`w-1.5 h-1.5 rounded-full ${
              streaming ? "bg-green-400" : "bg-slate-500"
            }`}
          />
          <Text className="text-[10px] text-slate-500">
            {streaming ? "Streaming" : "Paused"}
          </Text>
        </View>
      </View>
    </View>
  );
}
