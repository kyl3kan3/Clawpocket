import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStreamingChat } from "../../src/hooks/useStreamingChat";
import { useChatStore } from "../../src/stores/chat";
import { MessageBubble } from "../../src/components/chat/MessageBubble";
import { StreamingText } from "../../src/components/chat/StreamingText";
import { ComposeBar } from "../../src/components/chat/ComposeBar";
import { ConnectionBadge } from "../../src/components/ConnectionBadge";
import type { ChatMessage } from "../../src/gateway/types";

export default function ChatScreen() {
  const {
    messages,
    streamBuffer,
    sending,
    loading,
    error,
    isStreaming,
    send,
    abort,
    clearError,
  } = useStreamingChat();

  const flatListRef = useRef<FlatList>(null);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const currentModel = useChatStore((s) => s.currentModel);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, streamBuffer, isStreaming]);

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} />
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800">
        <View>
          <Text className="text-lg font-semibold text-white">Chat</Text>
          {currentSessionId && (
            <Text className="text-xs text-slate-500">
              {currentSessionId.slice(0, 12)}...
            </Text>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          {currentModel && (
            <View className="px-2 py-1 bg-slate-800 rounded-md">
              <Text className="text-xs text-slate-400">{currentModel}</Text>
            </View>
          )}
          <ConnectionBadge />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            !loading ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-xl text-slate-600 mb-2">
                  {"\u2709"}
                </Text>
                <Text className="text-sm text-slate-500">
                  Send a message to get started
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <>
              {isStreaming && <StreamingText text={streamBuffer} />}
              {error && (
                <Pressable onPress={clearError}>
                  <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-3">
                    <Text className="text-sm text-red-400">{error}</Text>
                    <Text className="text-xs text-red-500 mt-1">
                      Tap to dismiss
                    </Text>
                  </View>
                </Pressable>
              )}
            </>
          }
        />

        {/* Compose */}
        <ComposeBar
          onSend={send}
          onAbort={abort}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
