import { generateKeyPair, signMessage, type KeyPair } from "../lib/crypto";
import {
  getDevicePrivateKey,
  setDevicePrivateKey,
  getDevicePublicKey,
  setDevicePublicKey,
} from "../lib/secure-store";
import { PROTOCOL } from "../constants/protocol";

export interface DeviceSignature {
  publicKey: string;
  signature: string;
  signedAt: number;
  nonce: string;
  platform: "ios";
  deviceFamily: "mobile";
}

/**
 * Load or generate the device Ed25519 keypair.
 * The private key is persisted in the iOS Keychain via expo-secure-store.
 */
export async function getOrCreateDeviceKeyPair(): Promise<KeyPair> {
  const existingPrivate = await getDevicePrivateKey();
  const existingPublic = await getDevicePublicKey();

  if (existingPrivate && existingPublic) {
    return { privateKey: existingPrivate, publicKey: existingPublic };
  }

  const keyPair = await generateKeyPair();
  await setDevicePrivateKey(keyPair.privateKey);
  await setDevicePublicKey(keyPair.publicKey);
  return keyPair;
}

/**
 * Sign a challenge nonce using the v3 payload format.
 * Payload: `v3:ios:mobile:<nonce>:<timestamp>`
 */
export async function signChallenge(
  nonce: string,
  privateKey: string,
  publicKey: string
): Promise<DeviceSignature> {
  const signedAt = Date.now();
  const payload = `v${PROTOCOL.VERSION}:ios:mobile:${nonce}:${signedAt}`;
  const signature = await signMessage(payload, privateKey);

  return {
    publicKey,
    signature,
    signedAt,
    nonce,
    platform: "ios",
    deviceFamily: "mobile",
  };
}
