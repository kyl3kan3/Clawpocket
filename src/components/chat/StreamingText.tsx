import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";

interface StreamingTextProps {
  text: string;
}

export function StreamingText({ text }: StreamingTextProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);

  if (!text) return null;

  return (
    <View className="self-start mb-3 max-w-[85%]">
      <View className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-700">
        <Text className="text-sm leading-5 text-slate-200" selectable>
          {text}
          <Animated.Text style={{ opacity }} className="text-indigo-400">
            {" \u2588"}
          </Animated.Text>
        </Text>
      </View>
    </View>
  );
}
