import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAgentsStore } from "../../../../src/stores/agents";
import type { Agent } from "../../../../src/gateway/types";

export default function AgentOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const agents = useAgentsStore((s) => s.agents);
  const update = useAgentsStore((s) => s.update);
  const remove = useAgentsStore((s) => s.remove);

  const agent = agents.find((a) => a.id === id);
  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [model, setModel] = useState(agent?.model ?? "");

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description ?? "");
      setModel(agent.model ?? "");
    }
  }, [agent]);

  if (!agent) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-slate-500">Agent not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    await update({ id: agent.id, name, description, model: model || undefined });
    Alert.alert("Saved", "Agent updated successfully");
  };

  const handleDelete = () => {
    Alert.alert("Delete Agent", `Delete "${agent.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await remove(agent.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-4 pt-4 pb-8">
        {/* Navigation tabs */}
        <View className="flex-row gap-2 mb-6">
          {["Overview", "Files", "Tools", "Channels"].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                if (tab === "Files") router.push(`/(tabs)/agents/${id}/files`);
                if (tab === "Tools") router.push(`/(tabs)/agents/${id}/tools`);
                if (tab === "Channels")
                  router.push(`/(tabs)/agents/${id}/channels`);
              }}
              className={`px-4 py-2 rounded-lg ${
                tab === "Overview" ? "bg-indigo-600" : "bg-slate-800"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  tab === "Overview" ? "text-white" : "text-slate-400"
                }`}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Name */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">NAME</Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">
            DESCRIPTION
          </Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Model */}
        <View className="mb-4">
          <Text className="text-xs text-slate-400 mb-1.5 ml-1">MODEL</Text>
          <TextInput
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm font-mono"
            value={model}
            onChangeText={setModel}
            placeholder="Default model"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Identity */}
        {agent.identity && (
          <View className="bg-slate-800 rounded-xl p-4 mb-4">
            <Text className="text-xs text-slate-400 font-semibold mb-2">
              IDENTITY
            </Text>
            <Text className="text-sm text-slate-200">
              {agent.identity.name}
            </Text>
            {agent.identity.personality && (
              <Text className="text-xs text-slate-400 mt-1">
                {agent.identity.personality}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 mt-4">
          <Pressable
            onPress={handleSave}
            className="flex-1 py-3 bg-indigo-600 rounded-xl items-center"
          >
            <Text className="text-white font-semibold">Save</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            className="py-3 px-6 bg-red-500/20 rounded-xl items-center"
          >
            <Text className="text-red-400 font-semibold">Delete</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
