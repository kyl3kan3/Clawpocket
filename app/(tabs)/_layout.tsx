import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerTitleStyle: { fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarActiveTintColor: "#818cf8",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"\u2302"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"\u2709"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: "Sessions",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"\u2630"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: "Agents",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"\u2699"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"\u2026"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
