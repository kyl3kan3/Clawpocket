module.exports = {
  preset: "jest-expo",
  setupFilesAfterSetup: ["./jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@gorhom/.*|nativewind|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-get-random-values|react-native-mmkv|reconnecting-websocket|@noble/.*|react-native-markdown-display)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@gateway/(.*)$": "<rootDir>/src/gateway/$1",
    "^@stores/(.*)$": "<rootDir>/src/stores/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
};
