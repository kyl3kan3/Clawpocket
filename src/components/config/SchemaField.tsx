import React from "react";
import { View, Text, TextInput, Switch, Pressable } from "react-native";

interface SchemaFieldProps {
  path: string;
  label: string;
  description?: string;
  type: "string" | "number" | "boolean" | "select";
  value: unknown;
  options?: Array<{ label: string; value: string }>;
  onChange: (path: string, value: unknown) => void;
}

export function SchemaField({
  path,
  label,
  description,
  type,
  value,
  options,
  onChange,
}: SchemaFieldProps) {
  return (
    <View className="py-3 border-b border-slate-700">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-sm text-slate-200 font-medium">{label}</Text>
          {description && (
            <Text className="text-xs text-slate-500 mt-0.5">
              {description}
            </Text>
          )}
          <Text className="text-[10px] text-slate-600 font-mono mt-0.5">
            {path}
          </Text>
        </View>

        {type === "boolean" && (
          <Switch
            value={Boolean(value)}
            onValueChange={(v) => onChange(path, v)}
            trackColor={{ false: "#334155", true: "#6366f1" }}
            thumbColor="#f8fafc"
          />
        )}

        {type === "string" && (
          <TextInput
            className="bg-slate-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[120px] text-right"
            value={String(value ?? "")}
            onChangeText={(v) => onChange(path, v)}
            placeholderTextColor="#64748b"
          />
        )}

        {type === "number" && (
          <TextInput
            className="bg-slate-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[80px] text-right"
            value={String(value ?? "")}
            onChangeText={(v) => onChange(path, Number(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#64748b"
          />
        )}

        {type === "select" && options && (
          <View className="flex-row gap-1">
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => onChange(path, opt.value)}
                className={`px-3 py-1.5 rounded-lg ${
                  value === opt.value ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <Text
                  className={`text-xs ${
                    value === opt.value ? "text-white" : "text-slate-300"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
