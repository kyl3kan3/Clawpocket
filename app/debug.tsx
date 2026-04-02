import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { gateway } from "../src/gateway/client";
import { useConnectionStore } from "../src/stores/connection";
import type { HealthStatus, ModelInfo } from "../src/gateway/types";

export default function DebugScreen() {
  const health = useConnectionStore((s) => s.health);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<Record<string, unknown> | null>(null);

  // Manual RPC
  const [rpcMethod, setRpcMethod] = useState("");
  const [rpcParams, setRpcParams] = useState("{}");
  const [rpcResult, setRpcResult] = useState<string | null>(null);
  const [rpcLoading, setRpcLoading] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [healthRes, modelsRes, memRes] = await Promise.allSettled([
        gateway.health(),
        gateway.models(),
        gateway.doctor.memoryStatus(),
      ]);

      if (healthRes.status === "fulfilled") {
        useConnectionStore.getState().setHealth(healthRes.value);
      }
      if (modelsRes.status === "fulfilled") {
        setModels(modelsRes.value.models);
      }
      if (memRes.status === "fulfilled") {
        setMemoryStatus(memRes.value.status);
      }
    } catch {
      // Best effort
    }
  };

  const handleRpcCall = async () => {
    if (!rpcMethod.trim()) return;

    setRpcLoading(true);
    setRpcError(null);
    setRpcResult(null);

    try {
      let params: Record<string, unknown> = {};
      try {
        params = JSON.parse(rpcParams);
      } catch {
        setRpcError("Invalid JSON params");
        setRpcLoading(false);
        return;
      }

      const result = await (gateway as unknown as {
        transport: { request: (m: string, p: Record<string, unknown>) => Promise<unknown> };
      }).health(); // Use a known method as fallback

      // Direct transport access for arbitrary RPC
      const transport = (gateway as unknown as { transport: { request: (m: string, p?: Record<string, unknown>) => Promise<unknown> } }).transport;
      if (transport) {
        const res = await transport.request(rpcMethod.trim(), params);
        setRpcResult(JSON.stringify(res, null, 2));
      }
    } catch (err) {
      setRpcError(err instanceof Error ? err.message : String(err));
    }
    setRpcLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-4 pt-4 pb-8">
        {/* Health Snapshot */}
        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <Text className="text-xs text-slate-400 font-semibold mb-3">
            HEALTH SNAPSHOT
          </Text>
          {health ? (
            <Text className="text-xs text-slate-300 font-mono" selectable>
              {JSON.stringify(health, null, 2)}
            </Text>
          ) : (
            <Text className="text-xs text-slate-500">Loading...</Text>
          )}
        </View>

        {/* Models */}
        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <Text className="text-xs text-slate-400 font-semibold mb-3">
            MODELS ({models.length})
          </Text>
          {models.map((m) => (
            <View
              key={m.id}
              className="flex-row items-center justify-between py-1.5 border-b border-slate-700"
            >
              <Text className="text-xs text-slate-200">{m.name}</Text>
              <Text className="text-xs text-slate-500">{m.provider}</Text>
            </View>
          ))}
        </View>

        {/* Memory */}
        {memoryStatus && (
          <View className="bg-slate-800 rounded-xl p-4 mb-4">
            <Text className="text-xs text-slate-400 font-semibold mb-3">
              MEMORY STATUS
            </Text>
            <Text className="text-xs text-slate-300 font-mono" selectable>
              {JSON.stringify(memoryStatus, null, 2)}
            </Text>
          </View>
        )}

        {/* Manual RPC */}
        <View className="bg-slate-800 rounded-xl p-4">
          <Text className="text-xs text-slate-400 font-semibold mb-3">
            MANUAL RPC
          </Text>

          <TextInput
            className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono mb-2"
            placeholder="Method name (e.g., health)"
            placeholderTextColor="#64748b"
            value={rpcMethod}
            onChangeText={setRpcMethod}
            autoCapitalize="none"
          />

          <TextInput
            className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono mb-3 min-h-[60px]"
            placeholder='{"key": "value"}'
            placeholderTextColor="#64748b"
            value={rpcParams}
            onChangeText={setRpcParams}
            autoCapitalize="none"
            multiline
          />

          <Pressable
            onPress={handleRpcCall}
            disabled={rpcLoading}
            className={`py-2.5 rounded-lg items-center ${
              rpcLoading ? "bg-indigo-800" : "bg-indigo-600"
            }`}
          >
            {rpcLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-sm text-white font-medium">Send</Text>
            )}
          </Pressable>

          {rpcError && (
            <View className="mt-3 bg-red-500/10 rounded-lg p-3">
              <Text className="text-xs text-red-400">{rpcError}</Text>
            </View>
          )}

          {rpcResult && (
            <View className="mt-3 bg-slate-900 rounded-lg p-3">
              <Text className="text-xs text-slate-300 font-mono" selectable>
                {rpcResult}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mt-4">
          <Pressable
            onPress={loadData}
            className="flex-1 py-3 bg-slate-800 rounded-xl items-center"
          >
            <Text className="text-slate-300 font-medium">Refresh</Text>
          </Pressable>
          <Pressable
            onPress={() => gateway.wake()}
            className="flex-1 py-3 bg-slate-800 rounded-xl items-center"
          >
            <Text className="text-slate-300 font-medium">Wake</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
