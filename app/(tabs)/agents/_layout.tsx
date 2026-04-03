import { Stack } from "expo-router";

export default function AgentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#0f172a" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Agents" }} />
      <Stack.Screen name="[id]/index" options={{ title: "Agent" }} />
      <Stack.Screen name="[id]/files" options={{ title: "Agent Files" }} />
      <Stack.Screen name="[id]/tools" options={{ title: "Agent Tools" }} />
      <Stack.Screen name="[id]/channels" options={{ title: "Agent Channels" }} />
    </Stack>
  );
}
