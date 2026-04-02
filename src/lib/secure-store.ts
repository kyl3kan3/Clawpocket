import * as SecureStore from "expo-secure-store";

const KEYS = {
  DEVICE_PRIVATE_KEY: "clawpocket_device_private_key",
  DEVICE_PUBLIC_KEY: "clawpocket_device_public_key",
  DEVICE_TOKEN: "clawpocket_device_token",
  AUTH_TOKEN: "clawpocket_auth_token",
  GATEWAY_URL: "clawpocket_gateway_url",
} as const;

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getDevicePrivateKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.DEVICE_PRIVATE_KEY, SECURE_OPTIONS);
}

export async function setDevicePrivateKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.DEVICE_PRIVATE_KEY, key, SECURE_OPTIONS);
}

export async function getDevicePublicKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.DEVICE_PUBLIC_KEY, SECURE_OPTIONS);
}

export async function setDevicePublicKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.DEVICE_PUBLIC_KEY, key, SECURE_OPTIONS);
}

export async function getDeviceToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.DEVICE_TOKEN, SECURE_OPTIONS);
}

export async function setDeviceToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.DEVICE_TOKEN, token, SECURE_OPTIONS);
}

export async function clearDeviceToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.DEVICE_TOKEN, SECURE_OPTIONS);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.AUTH_TOKEN, SECURE_OPTIONS);
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token, SECURE_OPTIONS);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN, SECURE_OPTIONS);
}

export async function getGatewayUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.GATEWAY_URL, SECURE_OPTIONS);
}

export async function setGatewayUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.GATEWAY_URL, url, SECURE_OPTIONS);
}

export async function clearAll(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) =>
      SecureStore.deleteItemAsync(key, SECURE_OPTIONS)
    )
  );
}
