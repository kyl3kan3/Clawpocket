import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { useConfigStore } from "../src/stores/config";
import { ConfigDiff } from "../src/components/config/ConfigDiff";

export default function ConfigScreen() {
  const {
    config,
    baseHash,
    dirty,
    loading,
    applying,
    error,
    fetch,
    patch,
    apply,
    clearError,
  } = useConfigStore();

  const [rawMode, setRawMode] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, unknown>
  >({});

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (config) {
      setRawJson(JSON.stringify(config, null, 2));
    }
  }, [config]);

  const handleFieldChange = async (path: string, value: unknown) => {
    setPendingChanges((prev) => ({ ...prev, [path]: value }));
    await patch(path, value);
  };

  const handleApply = () => {
    Alert.alert(
      "Apply Config",
      "This may restart the Gateway. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Apply", onPress: () => apply() },
      ]
    );
  };

  if (!config) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-slate-500">Loading config...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#818cf8" />
      }
    >
      <View className="px-4 pt-4 pb-8">
        {/* Mode toggle */}
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={() => setRawMode(false)}
            className={`flex-1 py-2 rounded-lg items-center ${
              !rawMode ? "bg-indigo-600" : "bg-slate-800"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                !rawMode ? "text-white" : "text-slate-400"
              }`}
            >
              Form Editor
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRawMode(true)}
            className={`flex-1 py-2 rounded-lg items-center ${
              rawMode ? "bg-indigo-600" : "bg-slate-800"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                rawMode ? "text-white" : "text-slate-400"
              }`}
            >
              Raw JSON
            </Text>
          </Pressable>
        </View>

        {error && (
          <Pressable onPress={clearError}>
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-red-400">{error}</Text>
            </View>
          </Pressable>
        )}

        {rawMode ? (
          <TextInput
            className="bg-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono min-h-[400px]"
            value={rawJson}
            onChangeText={setRawJson}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <View>
            {Object.entries(config).map(([key, value]) => (
              <View key={key} className="bg-slate-800 rounded-xl p-4 mb-2">
                <Text className="text-xs text-slate-400 font-mono mb-1">
                  {key}
                </Text>
                {typeof value === "object" && value !== null ? (
                  <Text
                    className="text-xs text-slate-300 font-mono"
                    numberOfLines={3}
                  >
                    {JSON.stringify(value, null, 2)}
                  </Text>
                ) : (
                  <Text className="text-sm text-white">
                    {String(value)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Diff preview */}
        {Object.keys(pendingChanges).length > 0 && (
          <View className="mt-4">
            <Text className="text-xs text-slate-400 font-semibold mb-2">
              PENDING CHANGES
            </Text>
            <ConfigDiff original={config} changes={pendingChanges} />
          </View>
        )}

        {/* Apply button */}
        {dirty && (
          <Pressable
            onPress={handleApply}
            disabled={applying}
            className={`mt-4 py-3 rounded-xl items-center ${
              applying ? "bg-indigo-800" : "bg-indigo-600"
            }`}
          >
            <Text className="text-white font-semibold">
              {applying ? "Applying..." : "Apply Changes"}
            </Text>
          </Pressable>
        )}

        {/* Base hash */}
        {baseHash && (
          <Text className="text-[10px] text-slate-600 text-center mt-4 font-mono">
            Base hash: {baseHash.slice(0, 16)}...
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
