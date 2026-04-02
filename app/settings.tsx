import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useConnectionStore } from "../src/stores/connection";
import { useUIStore } from "../src/stores/ui";
import {
  getGatewayUrl,
  setGatewayUrl,
  getAuthToken,
  clearAll,
} from "../src/lib/secure-store";

type ThemeMode = "dark" | "light" | "system";

export default function SettingsScreen() {
  const router = useRouter();
  const { disconnect, url } = useConnectionStore();
  const { themeMode, setThemeMode } = useUIStore();

  const [host, setHost] = useState(url ?? "");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedUrl = await getGatewayUrl();
    if (savedUrl) setHost(savedUrl);
    const token = await getAuthToken();
    setHasToken(!!token);
  };

  const handleSaveHost = async () => {
    if (host.trim()) {
      await setGatewayUrl(host.trim());
      Alert.alert("Saved", "Reconnect to apply changes.");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will remove all saved credentials and disconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            disconnect();
            await clearAll();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const themes: ThemeMode[] = ["dark", "light", "system"];

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-4 pt-4 pb-8">
        {/* Connection */}
        <Text className="text-xs text-slate-400 font-semibold mb-3">
          CONNECTION
        </Text>
        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <Text className="text-xs text-slate-400 mb-1.5">GATEWAY HOST</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              value={host}
              onChangeText={setHost}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={handleSaveHost}
              className="px-4 py-2 bg-indigo-600 rounded-lg"
            >
              <Text className="text-sm text-white">Save</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2 mt-3">
            <View
              className={`w-2 h-2 rounded-full ${
                hasToken ? "bg-green-400" : "bg-slate-500"
              }`}
            />
            <Text className="text-xs text-slate-500">
              Auth token: {hasToken ? "stored" : "not set"}
            </Text>
          </View>
        </View>

        {/* Theme */}
        <Text className="text-xs text-slate-400 font-semibold mb-3">
          APPEARANCE
        </Text>
        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <Text className="text-xs text-slate-400 mb-2">THEME</Text>
          <View className="flex-row gap-2">
            {themes.map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setThemeMode(mode)}
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  themeMode === mode ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <Text
                  className={`text-xs font-medium capitalize ${
                    themeMode === mode ? "text-white" : "text-slate-400"
                  }`}
                >
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Device */}
        <Text className="text-xs text-slate-400 font-semibold mb-3">
          DEVICE
        </Text>
        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm text-slate-300">Platform</Text>
            <Text className="text-sm text-slate-500">iOS</Text>
          </View>
          <View className="flex-row justify-between items-center py-2 border-t border-slate-700">
            <Text className="text-sm text-slate-300">App Version</Text>
            <Text className="text-sm text-slate-500">1.0.0</Text>
          </View>
        </View>

        {/* Danger zone */}
        <Text className="text-xs text-red-400/60 font-semibold mb-3">
          DANGER ZONE
        </Text>
        <View className="gap-2">
          <Pressable
            onPress={() => {
              disconnect();
              router.replace("/(auth)/login");
            }}
            className="bg-slate-800 rounded-xl p-4"
          >
            <Text className="text-sm text-slate-300">Disconnect</Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Disconnect from gateway but keep credentials
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearData}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <Text className="text-sm text-red-400">Clear All Data</Text>
            <Text className="text-xs text-red-400/60 mt-0.5">
              Remove all saved credentials, tokens, and keys
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
