export const COLORS = {
  dark: {
    bgPrimary: "#0f172a",
    bgSecondary: "#1e293b",
    bgTertiary: "#334155",
    accent: "#6366f1",
    accentHover: "#818cf8",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    border: "#334155",
  },
  light: {
    bgPrimary: "#ffffff",
    bgSecondary: "#f8fafc",
    bgTertiary: "#f1f5f9",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    border: "#e2e8f0",
  },
} as const;

export const STATUS_COLORS = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export const TAB_ICONS = {
  overview: "home",
  chat: "message-circle",
  sessions: "layers",
  agents: "cpu",
  more: "menu",
} as const;
