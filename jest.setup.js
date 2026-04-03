// Mock react-native-get-random-values (polyfill, needs to be early)
jest.mock("react-native-get-random-values", () => {});

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "test-token" }),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-clipboard
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn().mockResolvedValue(""),
}));

// Mock expo-localization
jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "en", languageCode: "en" }]),
}));

// Mock react-native-mmkv
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn().mockReturnValue(false),
  })),
}));

// Mock reanimated
jest.mock("react-native-reanimated", () => ({
  default: {
    createAnimatedComponent: jest.fn((comp) => comp),
  },
  useSharedValue: jest.fn((v) => ({ value: v })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((v) => v),
  withSpring: jest.fn((v) => v),
}));

// Mock @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));
