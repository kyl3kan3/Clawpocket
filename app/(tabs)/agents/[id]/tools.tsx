import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Switch, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { gateway } from "../../../../src/gateway/client";

interface ToolItem {
  id: string;
  name: string;
  source: string;
  pluginId?: string;
  allowed: boolean;
}

export default function AgentToolsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const [catalog, effective] = await Promise.all([
        gateway.tools.catalog(),
        gateway.tools.effective({ agentId: id }),
      ]);

      const effectiveSet = new Set(effective.tools);
      setTools(
        catalog.tools.map((t) => ({
          ...t,
          allowed: effectiveSet.has(t.id),
        }))
      );
    } catch {
      // Error handling managed by store
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTools();
  }, [id]);

  const toggleTool = async (toolId: string, allowed: boolean) => {
    const policyPath = allowed
      ? `agents.${id}.tools.allowed`
      : `agents.${id}.tools.denied`;

    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, allowed } : t))
    );

    try {
      // This would add/remove from the allow/deny list via config.patch
      await gateway.config.patch({
        path: `agents.${id}.tools`,
        value: { [toolId]: allowed },
        baseHash: "",
      });
    } catch {
      // Revert on failure
      setTools((prev) =>
        prev.map((t) => (t.id === toolId ? { ...t, allowed: !allowed } : t))
      );
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={tools}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTools} tintColor="#818cf8" />
        }
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between py-3 border-b border-slate-800">
            <View className="flex-1 mr-3">
              <Text className="text-sm text-white">{item.name}</Text>
              <View className="flex-row gap-2 mt-1">
                <Text className="text-xs text-slate-500">{item.source}</Text>
                {item.pluginId && (
                  <Text className="text-xs text-slate-600">
                    {item.pluginId}
                  </Text>
                )}
              </View>
            </View>
            <Switch
              value={item.allowed}
              onValueChange={(v) => toggleTool(item.id, v)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-12">
              <Text className="text-sm text-slate-500">No tools available</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
