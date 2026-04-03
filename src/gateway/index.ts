export { GatewayTransport } from "./transport";
export { performAuth, type AuthState, type AuthResult } from "./auth";
export { gateway, type GatewayClient } from "./client";
export {
  getOrCreateDeviceKeyPair,
  signChallenge,
  type DeviceSignature,
} from "./device-identity";
export type * from "./types";
export type * from "./events";
