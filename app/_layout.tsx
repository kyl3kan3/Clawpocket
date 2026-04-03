import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useConnectionStore } from "../src/stores/connection";
import { useGateway } from "../src/hooks/useGateway";
import { ExecApprovalSheet } from "../src/components/ExecApprovalSheet";
import "../src/i18n";
import "../global.css";

export default function RootLayout() {
  const authState = useConnectionStore((s) => s.authState);
  const restoreConnection = useConnectionStore((s) => s.restoreConnection);

  // Wire up gateway event handlers
  useGateway();

  // Attempt to restore connection on mount
  useEffect(() => {
    restoreConnection();
  }, [restoreConnection]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0f172a" },
          animation: "slide_from_right",
        }}
      >
        {authState === "authenticated" ? (
          <>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="channels"
              options={{ title: "Channels", presentation: "card" }}
            />
            <Stack.Screen
              name="cron"
              options={{ title: "Cron Jobs", presentation: "card" }}
            />
            <Stack.Screen
              name="nodes"
              options={{ title: "Nodes & Devices", presentation: "card" }}
            />
            <Stack.Screen
              name="skills"
              options={{ title: "Skills", presentation: "card" }}
            />
            <Stack.Screen
              name="logs"
              options={{ title: "Logs", presentation: "card" }}
            />
            <Stack.Screen
              name="debug"
              options={{ title: "Debug", presentation: "card" }}
            />
            <Stack.Screen
              name="instances"
              options={{ title: "Instances", presentation: "card" }}
            />
            <Stack.Screen
              name="usage"
              options={{ title: "Usage", presentation: "card" }}
            />
            <Stack.Screen
              name="settings"
              options={{ title: "Settings", presentation: "card" }}
            />
            <Stack.Screen
              name="config"
              options={{ title: "Config", presentation: "card" }}
            />
            <Stack.Screen
              name="exec-approval"
              options={{
                title: "Exec Approval",
                presentation: "modal",
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />
        )}
      </Stack>

      {/* Global exec approval overlay */}
      {authState === "authenticated" && <ExecApprovalSheet />}
    </GestureHandlerRootView>
  );
}
