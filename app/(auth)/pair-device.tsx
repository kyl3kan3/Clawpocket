import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useConnectionStore } from "../../src/stores/connection";
import { gateway } from "../../src/gateway/client";
import type { GatewayEventMap } from "../../src/gateway/events";

export default function PairDeviceScreen() {
  const router = useRouter();
  const authState = useConnectionStore((s) => s.authState);

  useEffect(() => {
    const handler = (payload: GatewayEventMap["device.pair.resolved"]) => {
      if (payload.approved) {
        // Re-attempt connection
        useConnectionStore.getState().restoreConnection();
      }
    };

    gateway.on("device.pair.resolved", handler);
    return () => gateway.off("device.pair.resolved", handler);
  }, []);

  useEffect(() => {
    if (authState === "authenticated") {
      // Auth gate in root layout will handle navigation
    }
  }, [authState]);

  const handleCancel = () => {
    useConnectionStore.getState().disconnect();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-slate-900 justify-center items-center px-8">
      <ActivityIndicator size="large" color="#6366f1" className="mb-6" />

      <Text className="text-xl font-semibold text-white mb-3 text-center">
        Waiting for Approval
      </Text>

      <Text className="text-sm text-slate-400 text-center leading-6 mb-8">
        This device needs to be approved by an operator on the Gateway.
        {"\n\n"}
        Check the Gateway's Control UI or another approved device to approve
        this pairing request.
      </Text>

      <View className="bg-slate-800 rounded-xl p-4 w-full mb-8">
        <Text className="text-xs text-slate-500 text-center">
          The device's public key has been sent to the Gateway. Once approved,
          you'll be connected automatically.
        </Text>
      </View>

      <Pressable
        onPress={handleCancel}
        className="px-6 py-3 rounded-xl bg-slate-700"
      >
        <Text className="text-slate-300 font-medium">Cancel</Text>
      </Pressable>
    </View>
  );
}
