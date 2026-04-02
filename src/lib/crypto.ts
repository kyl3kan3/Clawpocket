import "react-native-get-random-values";
import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

// Configure ed25519 to use sha512
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

export interface KeyPair {
  publicKey: string; // hex
  privateKey: string; // hex
}

export async function generateKeyPair(): Promise<KeyPair> {
  const privateKeyBytes = ed25519.utils.randomPrivateKey();
  const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes);

  return {
    publicKey: bytesToHex(publicKeyBytes),
    privateKey: bytesToHex(privateKeyBytes),
  };
}

export async function signMessage(
  message: string,
  privateKeyHex: string
): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const signature = await ed25519.signAsync(messageBytes, privateKeyBytes);
  return bytesToHex(signature);
}

export async function verifySignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = hexToBytes(signatureHex);
  const publicKeyBytes = hexToBytes(publicKeyHex);
  return ed25519.verifyAsync(signatureBytes, messageBytes, publicKeyBytes);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
