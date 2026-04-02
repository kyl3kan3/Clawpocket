import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAgentsStore } from "../../../../src/stores/agents";
import type { AgentFile } from "../../../../src/gateway/types";

export default function AgentFilesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { files, fetchFiles, readFile, writeFile } = useAgentsStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (id) fetchFiles(id);
  }, [id]);

  const handleSelectFile = async (name: string) => {
    if (dirty) {
      Alert.alert("Unsaved changes", "Save before switching?", [
        { text: "Discard", onPress: () => loadFile(name), style: "destructive" },
        { text: "Save", onPress: async () => { await handleSave(); loadFile(name); } },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      loadFile(name);
    }
  };

  const loadFile = async (name: string) => {
    const result = await readFile(id, name);
    if (result !== null) {
      setSelectedFile(name);
      setContent(result);
      setDirty(false);
    }
  };

  const handleSave = async () => {
    if (selectedFile && id) {
      await writeFile(id, selectedFile, content);
      setDirty(false);
      Alert.alert("Saved", `${selectedFile} updated`);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* File list */}
      <View className="border-b border-slate-700">
        <FlatList
          horizontal
          data={files}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelectFile(item.name)}>
              <View
                className={`px-3 py-2 rounded-lg ${
                  selectedFile === item.name ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                <Text
                  className={`text-xs font-mono ${
                    selectedFile === item.name
                      ? "text-white"
                      : "text-slate-300"
                  }`}
                >
                  {item.name}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="text-xs text-slate-500">No files</Text>
          }
        />
      </View>

      {/* Editor */}
      {selectedFile ? (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-2 bg-slate-800">
            <Text className="text-xs text-slate-400 font-mono">
              {selectedFile}
              {dirty && " *"}
            </Text>
            <Pressable onPress={handleSave} disabled={!dirty}>
              <Text
                className={`text-xs font-medium ${
                  dirty ? "text-indigo-400" : "text-slate-600"
                }`}
              >
                Save
              </Text>
            </Pressable>
          </View>
          <TextInput
            className="flex-1 bg-slate-900 px-4 py-3 text-sm text-slate-200 font-mono"
            value={content}
            onChangeText={(v) => {
              setContent(v);
              setDirty(true);
            }}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-slate-500">
            Select a file to edit
          </Text>
        </View>
      )}
    </View>
  );
}
