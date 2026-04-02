import { GatewayTransport } from "./transport";
import { getOrCreateDeviceKeyPair, signChallenge } from "./device-identity";
import {
  getDeviceToken,
  setDeviceToken,
  getAuthToken,
  clearDeviceToken,
} from "../lib/secure-store";
import { PROTOCOL } from "../constants/protocol";
import type {
  ConnectParams,
  ChallengePayload,
  HelloOkPayload,
  Frame,
} from "./types";

export type AuthState =
  | "disconnected"
  | "connecting"
  | "challenged"
  | "authenticating"
  | "authenticated"
  | "waiting_approval"
  | "error";

export interface AuthResult {
  success: boolean;
  state: AuthState;
  deviceToken?: string;
  error?: string;
}

/**
 * Perform the full Gateway authentication handshake:
 * 1. Wait for connect.challenge event
 * 2. Sign the challenge with device keypair
 * 3. Send connect frame with auth credentials + device signature
 * 4. Wait for hello-ok or error
 */
export async function performAuth(
  transport: GatewayTransport
): Promise<AuthResult> {
  return new Promise<AuthResult>((resolve) => {
    let challengeTimeout: ReturnType<typeof setTimeout>;

    const handler = async (frame: Frame) => {
      if (frame.type !== "evt") return;

      const event = frame as { type: "evt"; event: string; payload: unknown };

      // Step 1: Receive challenge
      if (event.event === "connect.challenge") {
        clearTimeout(challengeTimeout);
        const challenge = event.payload as ChallengePayload;

        try {
          // Step 2: Sign challenge
          const keyPair = await getOrCreateDeviceKeyPair();
          const deviceSig = await signChallenge(
            challenge.nonce,
            keyPair.privateKey,
            keyPair.publicKey
          );

          // Step 3: Build connect params
          const connectParams: ConnectParams = {
            device: deviceSig,
            protocol: PROTOCOL.VERSION,
          };

          // Try device token first, then auth token
          const deviceToken = await getDeviceToken();
          const authToken = await getAuthToken();

          if (deviceToken) {
            connectParams.auth = { deviceToken };
          } else if (authToken) {
            connectParams.auth = { token: authToken };
          }

          // Send connect frame
          transport.send(
            JSON.stringify({
              type: "req",
              id: "connect",
              method: "connect",
              params: connectParams,
            })
          );
        } catch (err) {
          resolve({
            success: false,
            state: "error",
            error: `Signing failed: ${err}`,
          });
        }
      }

      // Step 4: Handle response
      if (event.event === "hello-ok") {
        const payload = event.payload as HelloOkPayload;
        if (payload.auth?.deviceToken) {
          await setDeviceToken(payload.auth.deviceToken);
        }
        resolve({
          success: true,
          state: "authenticated",
          deviceToken: payload.auth?.deviceToken,
        });
      }

      if (event.event === "connect.error") {
        const error = event.payload as { code: string; message: string };

        if (error.code === "DEVICE_PENDING_APPROVAL") {
          resolve({ success: false, state: "waiting_approval" });
          return;
        }

        if (error.code === "AUTH_TOKEN_MISMATCH") {
          await clearDeviceToken();
          resolve({
            success: false,
            state: "error",
            error: "Device token revoked. Please re-authenticate.",
          });
          return;
        }

        resolve({
          success: false,
          state: "error",
          error: error.message,
        });
      }
    };

    transport.onMessage(handler);

    // Timeout if no challenge received
    challengeTimeout = setTimeout(() => {
      resolve({
        success: false,
        state: "error",
        error: "Connection timeout: no challenge received",
      });
    }, PROTOCOL.CONNECTION_TIMEOUT_MS * 2);
  });
}
