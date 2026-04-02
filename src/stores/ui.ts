import { create } from "zustand";
import { Appearance, type ColorSchemeName } from "react-native";

type ThemeMode = "dark" | "light" | "system";

interface UIState {
  themeMode: ThemeMode;
  resolvedTheme: "dark" | "light";
  locale: string;

  setThemeMode: (mode: ThemeMode) => void;
  setLocale: (locale: string) => void;
}

function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "system") {
    return Appearance.getColorScheme() === "light" ? "light" : "dark";
  }
  return mode;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: "dark",
  resolvedTheme: "dark",
  locale: "en",

  setThemeMode: (mode) =>
    set({ themeMode: mode, resolvedTheme: resolveTheme(mode) }),
  setLocale: (locale) => set({ locale }),
}));
