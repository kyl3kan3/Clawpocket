import React, { useState, useRef } from "react";
import { View, TextInput, Pressable, Text, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";

interface ComposeBarProps {
  onSend: (message: string) => void;
  onAbort: () => void;
  sending: boolean;
  disabled?: boolean;
}

export function ComposeBar({ onSend, onAbort, sending, disabled }: ComposeBarProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText("");
  };

  const handleAbort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAbort();
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 bg-slate-800 border-t border-slate-700">
      <TextInput
        ref={inputRef}
        className="flex-1 bg-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white min-h-[40px] max-h-[120px]"
        placeholder="Message..."
        placeholderTextColor="#64748b"
        value={text}
        onChangeText={setText}
        multiline
        editable={!disabled}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        returnKeyType="send"
      />

      {sending ? (
        <Pressable
          onPress={handleAbort}
          className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
        >
          <Text className="text-red-400 text-lg font-bold">{"\u25A0"}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            text.trim() && !disabled
              ? "bg-indigo-600"
              : "bg-slate-600"
          }`}
        >
          <Text className="text-white text-lg">{"\u2191"}</Text>
        </Pressable>
      )}
    </View>
  );
}
