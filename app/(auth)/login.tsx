import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useConnectionStore } from "../../src/stores/connection";
import { setAuthToken, setGatewayUrl } from "../../src/lib/secure-store";

export default function LoginScreen() {
  const router = useRouter();
  const { connect, authState, authError } = useConnectionStore();

  const [host, setHost] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isConnecting = authState === "connecting" || authState === "authenticating";

  const handleConnect = async () => {
    const trimmedHost = host.trim();
    if (!trimmedHost) {
      setError("Please enter a gateway hostname or IP");
      return;
    }

    setError(null);

    // Persist credentials
    await setGatewayUrl(trimmedHost);
    if (token.trim()) {
      await setAuthToken(token.trim());
    }

    const result = await connect(trimmedHost);

    if (result.success) {
      // Navigation handled by root layout auth gate
    } else if (result.state === "waiting_approval") {
      router.replace("/(auth)/pair-device");
    } else {
      setError(result.error ?? "Connection failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-900"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo / Title */}
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-white mb-2">
            ClawPocket
          </Text>
          <Text className="text-sm text-slate-400">
            Connect to your OpenClaw Gateway
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-xs text-slate-400 mb-1.5 ml-1">
              GATEWAY HOST
            </Text>
            <TextInput
              className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3.5 text-white text-sm"
              placeholder="raspberry-pi.tail1234.ts.net"
              placeholderTextColor="#64748b"
              value={host}
              onChangeText={setHost}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View>
            <Text className="text-xs text-slate-400 mb-1.5 ml-1">
              TOKEN (optional if using Tailscale)
            </Text>
            <TextInput
              className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3.5 text-white text-sm font-mono"
              placeholder="OPENCLAW_GATEWAY_TOKEN"
              placeholderTextColor="#64748b"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          {(error || authError) && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <Text className="text-sm text-red-400">
                {error || authError}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleConnect}
            disabled={isConnecting}
            className={`py-4 rounded-xl items-center mt-2 ${
              isConnecting ? "bg-indigo-800" : "bg-indigo-600"
            }`}
          >
            {isConnecting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Connect
              </Text>
            )}
          </Pressable>
        </View>

        {/* Help text */}
        <View className="mt-8 items-center">
          <Text className="text-xs text-slate-500 text-center leading-5">
            Ensure your Tailscale VPN is active, or enter your{"\n"}
            Gateway's direct IP address and auth token.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
