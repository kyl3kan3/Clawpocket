import { performAuth } from "../auth";
import type { Frame } from "../types";

// Mock dependencies
jest.mock("../device-identity", () => ({
  getOrCreateDeviceKeyPair: jest.fn().mockResolvedValue({
    publicKey: "abc123public",
    privateKey: "abc123private",
  }),
  signChallenge: jest.fn().mockResolvedValue({
    publicKey: "abc123public",
    signature: "sig123",
    signedAt: 1000,
    nonce: "nonce123",
    platform: "ios",
    deviceFamily: "mobile",
  }),
}));

jest.mock("../../lib/secure-store", () => ({
  getDeviceToken: jest.fn().mockResolvedValue(null),
  setDeviceToken: jest.fn().mockResolvedValue(undefined),
  getAuthToken: jest.fn().mockResolvedValue("test-token"),
  clearDeviceToken: jest.fn().mockResolvedValue(undefined),
}));

import { getDeviceToken, setDeviceToken, clearDeviceToken } from "../../lib/secure-store";

describe("performAuth", () => {
  let messageHandler: ((frame: Frame) => void) | null = null;
  let sentMessages: string[] = [];

  const mockTransport = {
    connected: true,
    onMessage: jest.fn((handler: (frame: Frame) => void) => {
      messageHandler = handler;
    }),
    send: jest.fn((data: string) => {
      sentMessages.push(data);
    }),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    messageHandler = null;
    sentMessages = [];
    mockTransport.onMessage.mockClear();
    mockTransport.send.mockClear();
    (setDeviceToken as jest.Mock).mockClear();
    (clearDeviceToken as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("completes full auth handshake successfully", async () => {
    const authPromise = performAuth(mockTransport as any);

    // Simulate challenge
    messageHandler!({
      type: "evt",
      event: "connect.challenge",
      payload: { nonce: "nonce123", ts: Date.now() },
    } as any);

    // Wait for async signing
    await new Promise((r) => setTimeout(r, 0));
    jest.runAllTimers();

    // Verify connect frame was sent
    expect(mockTransport.send).toHaveBeenCalled();
    const connectFrame = JSON.parse(sentMessages[0]);
    expect(connectFrame.method).toBe("connect");
    expect(connectFrame.params.device.publicKey).toBe("abc123public");
    expect(connectFrame.params.auth.token).toBe("test-token");

    // Simulate hello-ok
    messageHandler!({
      type: "evt",
      event: "hello-ok",
      payload: {
        auth: { deviceToken: "new-device-token" },
        server: { version: "1.0.0", features: [] },
      },
    } as any);

    const result = await authPromise;
    expect(result.success).toBe(true);
    expect(result.state).toBe("authenticated");
    expect(result.deviceToken).toBe("new-device-token");
    expect(setDeviceToken).toHaveBeenCalledWith("new-device-token");
  });

  it("handles DEVICE_PENDING_APPROVAL", async () => {
    const authPromise = performAuth(mockTransport as any);

    // Challenge
    messageHandler!({
      type: "evt",
      event: "connect.challenge",
      payload: { nonce: "nonce123", ts: Date.now() },
    } as any);

    await new Promise((r) => setTimeout(r, 0));
    jest.runAllTimers();

    // Error: pending approval
    messageHandler!({
      type: "evt",
      event: "connect.error",
      payload: { code: "DEVICE_PENDING_APPROVAL", message: "Awaiting approval" },
    } as any);

    const result = await authPromise;
    expect(result.success).toBe(false);
    expect(result.state).toBe("waiting_approval");
  });

  it("handles AUTH_TOKEN_MISMATCH and clears device token", async () => {
    const authPromise = performAuth(mockTransport as any);

    messageHandler!({
      type: "evt",
      event: "connect.challenge",
      payload: { nonce: "nonce123", ts: Date.now() },
    } as any);

    await new Promise((r) => setTimeout(r, 0));
    jest.runAllTimers();

    messageHandler!({
      type: "evt",
      event: "connect.error",
      payload: { code: "AUTH_TOKEN_MISMATCH", message: "Token mismatch" },
    } as any);

    const result = await authPromise;
    expect(result.success).toBe(false);
    expect(result.state).toBe("error");
    expect(clearDeviceToken).toHaveBeenCalled();
  });

  it("times out if no challenge is received", async () => {
    const authPromise = performAuth(mockTransport as any);

    // Advance past the challenge timeout
    jest.advanceTimersByTime(15000);

    const result = await authPromise;
    expect(result.success).toBe(false);
    expect(result.state).toBe("error");
    expect(result.error).toContain("timeout");
  });

  it("uses device token when available", async () => {
    (getDeviceToken as jest.Mock).mockResolvedValueOnce("existing-device-token");

    const authPromise = performAuth(mockTransport as any);

    messageHandler!({
      type: "evt",
      event: "connect.challenge",
      payload: { nonce: "nonce123", ts: Date.now() },
    } as any);

    await new Promise((r) => setTimeout(r, 0));
    jest.runAllTimers();

    const connectFrame = JSON.parse(sentMessages[0]);
    expect(connectFrame.params.auth.deviceToken).toBe("existing-device-token");

    // Complete the auth
    messageHandler!({
      type: "evt",
      event: "hello-ok",
      payload: {
        auth: { deviceToken: "refreshed-token" },
        server: { version: "1.0.0", features: [] },
      },
    } as any);

    await authPromise;
  });
});
