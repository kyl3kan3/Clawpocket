import React, { useEffect } from "react";
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { useNodesStore } from "../src/stores/nodes";
import type { Node, Device } from "../src/gateway/types";

export default function NodesScreen() {
  const {
    nodes,
    devices,
    loading,
    fetchNodes,
    fetchDevices,
    renameNode,
    approveDevice,
  } = useNodesStore();

  useEffect(() => {
    fetchNodes();
    fetchDevices();
  }, []);

  const refresh = () => {
    fetchNodes();
    fetchDevices();
  };

  const handleRenameNode = (node: Node) => {
    Alert.prompt("Rename Node", `Current: ${node.name}`, async (name) => {
      if (name?.trim()) {
        await renameNode(node.id, name.trim());
      }
    });
  };

  const handleApproveDevice = (device: Device) => {
    Alert.alert(
      "Approve Device",
      `Platform: ${device.platform}\nKey: ${device.publicKey.slice(0, 16)}...`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: () => approveDevice(device.publicKey, false),
        },
        {
          text: "Approve",
          onPress: () => approveDevice(device.publicKey, true),
        },
      ]
    );
  };

  const sections = [
    {
      title: "Nodes",
      data: nodes.map((n) => ({ type: "node" as const, item: n })),
    },
    {
      title: "Devices",
      data: devices.map((d) => ({ type: "device" as const, item: d })),
    },
  ];

  return (
    <View className="flex-1 bg-slate-900">
      <SectionList
        sections={sections}
        keyExtractor={(item) =>
          item.type === "node" ? item.item.id : item.item.publicKey
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#818cf8" />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        renderSectionHeader={({ section }) => (
          <View className="px-4 py-2 bg-slate-900">
            <Text className="text-xs text-slate-400 font-semibold">
              {section.title.toUpperCase()} ({section.data.length})
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.type === "node") {
            const node = item.item as Node;
            return (
              <Pressable onLongPress={() => handleRenameNode(node)}>
                <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`w-2.5 h-2.5 rounded-full ${
                          node.status === "online"
                            ? "bg-green-400"
                            : "bg-slate-500"
                        }`}
                      />
                      <Text className="text-sm text-white font-medium">
                        {node.name}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500">
                      {node.platform}
                    </Text>
                  </View>
                  {node.capabilities.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-2">
                      {node.capabilities.map((cap) => (
                        <View
                          key={cap}
                          className="px-2 py-0.5 bg-slate-700 rounded"
                        >
                          <Text className="text-[10px] text-slate-400">
                            {cap}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }

          const device = item.item as Device;
          return (
            <Pressable
              onPress={
                !device.approved ? () => handleApproveDevice(device) : undefined
              }
            >
              <View className="bg-slate-800 rounded-xl p-4 mb-2 mx-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-white">
                      {device.name ?? device.publicKey.slice(0, 12) + "..."}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {device.platform} / {device.deviceFamily}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      device.approved
                        ? "bg-green-500/20"
                        : "bg-yellow-500/20"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        device.approved
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {device.approved ? "Approved" : "Pending"}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
