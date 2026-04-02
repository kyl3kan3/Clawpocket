import React from "react";
import { View, Text, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { ChatMessage } from "../../gateway/types";
import { ToolCallCard } from "./ToolCallCard";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
  };

  return (
    <View
      className={`mb-3 max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
    >
      <Pressable onLongPress={handleCopy}>
        <View
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-indigo-600 rounded-br-md"
              : isSystem
                ? "bg-amber-900/30 rounded-bl-md"
                : "bg-slate-700 rounded-bl-md"
          }`}
        >
          {isSystem && (
            <Text className="text-xs text-amber-400 font-semibold mb-1">
              SYSTEM
            </Text>
          )}
          <Text
            className={`text-sm leading-5 ${
              isUser ? "text-white" : "text-slate-200"
            }`}
            selectable
          >
            {message.content}
          </Text>
          {message.aborted && (
            <Text className="text-xs text-red-400 mt-1 italic">
              (response aborted)
            </Text>
          )}
        </View>
      </Pressable>

      {/* Tool calls */}
      {message.toolCalls?.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} />
      ))}

      {/* Metadata */}
      <View className="flex-row items-center gap-2 mt-1 px-1">
        {message.model && (
          <Text className="text-[10px] text-slate-500">{message.model}</Text>
        )}
        {message.tokens && (
          <Text className="text-[10px] text-slate-500">
            {message.tokens.input + message.tokens.output} tokens
          </Text>
        )}
        <Text className="text-[10px] text-slate-600">
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}
