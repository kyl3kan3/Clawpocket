import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSessionsStore } from "../src/stores/sessions";
import type { UsageSummary } from "../src/gateway/types";

export default function UsageScreen() {
  const { sessions, loading, fetch } = useSessionsStore();
  const [summaries, setSummaries] = useState<UsageSummary[]>([]);

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    // Aggregate usage by model from sessions
    const modelMap = new Map<
      string,
      { input: number; output: number; count: number }
    >();

    for (const session of sessions) {
      const model = session.model ?? "unknown";
      const existing = modelMap.get(model) ?? {
        input: 0,
        output: 0,
        count: 0,
      };
      modelMap.set(model, {
        input: existing.input + session.tokens.input,
        output: existing.output + session.tokens.output,
        count: existing.count + 1,
      });
    }

    setSummaries(
      Array.from(modelMap.entries()).map(([model, data]) => ({
        model,
        inputTokens: data.input,
        outputTokens: data.output,
        cost: 0, // Cost calculation would depend on pricing config
        requestCount: data.count,
      }))
    );
  }, [sessions]);

  const totalInput = summaries.reduce((sum, s) => sum + s.inputTokens, 0);
  const totalOutput = summaries.reduce((sum, s) => sum + s.outputTokens, 0);
  const totalSessions = sessions.length;

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
      }
    >
      <View className="px-4 pt-4 pb-8">
        {/* Totals */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-slate-800 rounded-xl p-4">
            <Text className="text-2xl font-bold text-white">
              {formatTokenCount(totalInput)}
            </Text>
            <Text className="text-xs text-slate-400 mt-1">Input Tokens</Text>
          </View>
          <View className="flex-1 bg-slate-800 rounded-xl p-4">
            <Text className="text-2xl font-bold text-white">
              {formatTokenCount(totalOutput)}
            </Text>
            <Text className="text-xs text-slate-400 mt-1">Output Tokens</Text>
          </View>
        </View>

        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-400">Total Sessions</Text>
            <Text className="text-sm text-white font-medium">
              {totalSessions}
            </Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-sm text-slate-400">Total Tokens</Text>
            <Text className="text-sm text-white font-medium">
              {formatTokenCount(totalInput + totalOutput)}
            </Text>
          </View>
        </View>

        {/* Per-model breakdown */}
        <Text className="text-xs text-slate-400 font-semibold mb-3">
          BY MODEL
        </Text>
        {summaries.map((s) => (
          <View
            key={s.model}
            className="bg-slate-800 rounded-xl p-4 mb-2"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-medium text-white">
                {s.model}
              </Text>
              <Text className="text-xs text-slate-500">
                {s.requestCount} session{s.requestCount > 1 ? "s" : ""}
              </Text>
            </View>
            <View className="flex-row gap-4">
              <View>
                <Text className="text-[10px] text-slate-500">INPUT</Text>
                <Text className="text-xs text-slate-300">
                  {formatTokenCount(s.inputTokens)}
                </Text>
              </View>
              <View>
                <Text className="text-[10px] text-slate-500">OUTPUT</Text>
                <Text className="text-xs text-slate-300">
                  {formatTokenCount(s.outputTokens)}
                </Text>
              </View>
              <View>
                <Text className="text-[10px] text-slate-500">TOTAL</Text>
                <Text className="text-xs text-slate-300">
                  {formatTokenCount(s.inputTokens + s.outputTokens)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {summaries.length === 0 && !loading && (
          <View className="items-center py-12">
            <Text className="text-sm text-slate-500">No usage data</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}
