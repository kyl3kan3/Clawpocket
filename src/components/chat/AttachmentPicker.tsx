import React from "react";
import { View, Text, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import type { Attachment } from "../../gateway/types";

interface AttachmentPickerProps {
  onAttach: (attachment: Attachment) => void;
}

export function AttachmentPicker({ onAttach }: AttachmentPickerProps) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onAttach({
        type: "image",
        name: asset.fileName ?? "image.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        data: asset.base64 ?? "",
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onAttach({
        type: "image",
        name: asset.fileName ?? "photo.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        data: asset.base64 ?? "",
      });
    }
  };

  return (
    <View className="flex-row gap-3 px-4 py-2">
      <Pressable
        onPress={pickImage}
        className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-700 rounded-lg"
      >
        <Text className="text-sm">🖼</Text>
        <Text className="text-xs text-slate-300">Photo Library</Text>
      </Pressable>
      <Pressable
        onPress={takePhoto}
        className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-700 rounded-lg"
      >
        <Text className="text-sm">📷</Text>
        <Text className="text-xs text-slate-300">Camera</Text>
      </Pressable>
    </View>
  );
}
