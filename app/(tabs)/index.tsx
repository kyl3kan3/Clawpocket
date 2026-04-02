import React, { useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { useConnectionStore } from "../../src/stores/connection";
import { useSessionsStore } from "../../src/stores/sessions";
import { useCronStore } from "../../src/stores/cron";
import { ConnectionBadge } from "../../src/components/ConnectionBadge";
import { gateway } from "../../src/gateway/client";

export default function OverviewScreen() {
  const health = useConnectionStore((s) => s.health);
  const sessions = useSessionsStore((s) => s.sessions);
  const fetchSessions = useSessionsStore((s) => s.fetch);
  const cronJobs = useCronStore((s) => s.jobs);
  const fetchCron = useCronStore((s) => s.fetch);

  const [refreshing, setRefreshing] = React.useState(false);
  const [presence, setPresence] = React.useState<
    Array<{ deviceId: string; platform: string; type: string }>
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchSessions(),
      fetchCron(),
      gateway.health().then((h) => useConnectionStore.getState().setHealth(h)),
      gateway.presence().then((p) => setPresence(p.entries)),
    ]).catch(() => {});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeSessions = sessions.filter(
    (s) => Date.now() - s.lastActivity < 3600000
  );
  const enabledCron = cronJobs.filter((j) => j.enabled);

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />
      }
    >
      <View className="px-4 pt-4 pb-8">
        {/* Connection status */}
        <View className="items-center mb-6">
          <ConnectionBadge />
        </View>

        {/* Health card */}
        <View className="bg-slate-800 rounded-2xl p-5 mb-4">
          <Text className="text-sm text-slate-400 font-semibold mb-3">
            GATEWAY HEALTH
          </Text>
          {health ? (
            <View className="gap-3">
              <StatusRow
                label="Status"
                value={health.status.toUpperCase()}
                color={
                  health.status === "ok"
                    ? "text-green-400"
                    : health.status === "degraded"
                      ? "text-yellow-400"
                      : "text-red-400"
                }
              />
              <StatusRow label="Version" value={health.version} />
              <StatusRow
                label="Uptime"
                value={formatUptime(health.uptime)}
              />
              {health.memory && (
                <StatusRow
                  label="Memory"
                  value={`${Math.round(health.memory.used / 1024 / 1024)}MB / ${Math.round(health.memory.total / 1024 / 1024)}MB`}
                />
              )}
              {health.updateAvailable && (
                <View className="bg-indigo-500/20 rounded-lg px-3 py-2 mt-1">
                  <Text className="text-xs text-indigo-300">
                    Update available: v{health.updateAvailable}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text className="text-sm text-slate-500">Loading...</Text>
          )}
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-4">
          <StatCard
            label="Active Sessions"
            value={String(activeSessions.length)}
            total={sessions.length}
          />
          <StatCard
            label="Cron Jobs"
            value={String(enabledCron.length)}
            total={cronJobs.length}
          />
          <StatCard
            label="Clients"
            value={String(presence.length)}
          />
        </View>

        {/* Connected clients */}
        {presence.length > 0 && (
          <View className="bg-slate-800 rounded-2xl p-5">
            <Text className="text-sm text-slate-400 font-semibold mb-3">
              CONNECTED CLIENTS
            </Text>
            {presence.map((p, i) => (
              <View
                key={p.deviceId || i}
                className="flex-row items-center justify-between py-2 border-b border-slate-700 last:border-0"
              >
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-green-400" />
                  <Text className="text-sm text-slate-200">
                    {p.deviceId.slice(0, 8)}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <Text className="text-xs text-slate-500">{p.platform}</Text>
                  <Text className="text-xs text-slate-600">{p.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatusRow({
  label,
  value,
  color = "text-slate-200",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-sm text-slate-400">{label}</Text>
      <Text className={`text-sm font-medium ${color}`}>{value}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  total,
}: {
  label: string;
  value: string;
  total?: number;
}) {
  return (
    <View className="flex-1 bg-slate-800 rounded-xl p-4">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      {total !== undefined && (
        <Text className="text-xs text-slate-500">of {total}</Text>
      )}
      <Text className="text-xs text-slate-400 mt-1">{label}</Text>
    </View>
  );
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}
