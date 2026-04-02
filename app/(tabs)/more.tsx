import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ConnectionBadge } from "../../src/components/ConnectionBadge";

interface MenuItem {
  title: string;
  subtitle: string;
  route: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Channels",
    subtitle: "Messaging channel connections",
    route: "/channels",
    icon: "\u{1F4E1}",
  },
  {
    title: "Cron Jobs",
    subtitle: "Scheduled tasks & runs",
    route: "/cron",
    icon: "\u{23F0}",
  },
  {
    title: "Nodes & Devices",
    subtitle: "Connected nodes & device pairing",
    route: "/nodes",
    icon: "\u{1F5A5}",
  },
  {
    title: "Skills",
    subtitle: "Skill marketplace & management",
    route: "/skills",
    icon: "\u{1F9E9}",
  },
  {
    title: "Config",
    subtitle: "Gateway configuration editor",
    route: "/config",
    icon: "\u{2699}",
  },
  {
    title: "Logs",
    subtitle: "Live gateway log viewer",
    route: "/logs",
    icon: "\u{1F4DC}",
  },
  {
    title: "Debug",
    subtitle: "Health inspector & manual RPC",
    route: "/debug",
    icon: "\u{1F41B}",
  },
  {
    title: "Instances",
    subtitle: "Connected client presence",
    route: "/instances",
    icon: "\u{1F465}",
  },
  {
    title: "Usage",
    subtitle: "Token usage & costs",
    route: "/usage",
    icon: "\u{1F4CA}",
  },
  {
    title: "Settings",
    subtitle: "App connection & theme settings",
    route: "/settings",
    icon: "\u{2699}",
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-4 pt-4 pb-8">
        <View className="items-center mb-6">
          <ConnectionBadge />
        </View>

        <View className="gap-2">
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as never)}
            >
              <View className="bg-slate-800 rounded-xl px-4 py-4 flex-row items-center">
                <Text className="text-xl mr-3">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-white">
                    {item.title}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {item.subtitle}
                  </Text>
                </View>
                <Text className="text-slate-600">{"\u203A"}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
