import { PROTOCOL } from "../../constants/protocol";

// Mock ReconnectingWebSocket
class MockWebSocket {
  listeners: Record<string, Function[]> = {};
  sent: string[] = [];
  readyState = 1; // OPEN

  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }

  // Test helpers
  simulateOpen() {
    this.readyState = 1;
    this.listeners["open"]?.forEach((h) => h());
  }

  simulateClose() {
    this.readyState = 3;
    this.listeners["close"]?.forEach((h) => h());
  }

  simulateMessage(data: unknown) {
    this.listeners["message"]?.forEach((h) =>
      h({ data: JSON.stringify(data) })
    );
  }
}

let mockWs: MockWebSocket;

jest.mock("reconnecting-websocket", () => {
  return jest.fn().mockImplementation(() => {
    mockWs = new MockWebSocket();
    return mockWs;
  });
});

import { GatewayTransport } from "../transport";

describe("GatewayTransport", () => {
  let transport: GatewayTransport;

  beforeEach(() => {
    jest.useFakeTimers();
    transport = new GatewayTransport();
  });

  afterEach(() => {
    transport.disconnect();
    jest.useRealTimers();
  });

  describe("connect", () => {
    it("creates a WebSocket connection", () => {
      transport.connect("ws://localhost:18789");
      expect(mockWs).toBeDefined();
    });

    it("sets connected to true on open", () => {
      transport.connect("ws://localhost:18789");
      expect(transport.connected).toBe(false);
      mockWs.simulateOpen();
      expect(transport.connected).toBe(true);
    });

    it("sets connected to false on close", () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();
      mockWs.simulateClose();
      expect(transport.connected).toBe(false);
    });
  });

  describe("request", () => {
    it("sends a JSON frame with type req, id, method, and params", () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      transport.request("health", { foo: "bar" });

      expect(mockWs.sent.length).toBe(1);
      const frame = JSON.parse(mockWs.sent[0]);
      expect(frame.type).toBe("req");
      expect(frame.id).toBeDefined();
      expect(frame.method).toBe("health");
      expect(frame.params).toEqual({ foo: "bar" });
    });

    it("resolves when a matching response frame arrives", async () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      const promise = transport.request("health");

      // Extract the request ID from the sent frame
      const sentFrame = JSON.parse(mockWs.sent[0]);

      // Simulate response
      mockWs.simulateMessage({
        type: "res",
        id: sentFrame.id,
        result: { status: "ok" },
      });

      const result = await promise;
      expect(result).toEqual({ status: "ok" });
    });

    it("rejects with error when response contains an error field", async () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      const promise = transport.request("bad-method");
      const sentFrame = JSON.parse(mockWs.sent[0]);

      mockWs.simulateMessage({
        type: "res",
        id: sentFrame.id,
        error: { code: "NOT_FOUND", message: "Method not found" },
      });

      await expect(promise).rejects.toEqual({
        code: "NOT_FOUND",
        message: "Method not found",
      });
    });

    it("rejects with TIMEOUT when no response arrives", async () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      const promise = transport.request("slow-method");

      jest.advanceTimersByTime(PROTOCOL.REQUEST_TIMEOUT_MS + 100);

      await expect(promise).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });
  });

  describe("message queue", () => {
    it("queues messages when disconnected and flushes on open", () => {
      transport.connect("ws://localhost:18789");
      // Not yet open, so messages should queue
      transport.send(JSON.stringify({ type: "ping" }));

      expect(mockWs.sent.length).toBe(0);

      mockWs.simulateOpen();

      // Now the queued message should have been flushed
      expect(mockWs.sent.length).toBe(1);
    });
  });

  describe("disconnect", () => {
    it("rejects all pending requests", async () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      const promise = transport.request("will-disconnect");

      transport.disconnect();

      await expect(promise).rejects.toMatchObject({
        code: "DISCONNECTED",
      });
    });
  });

  describe("event dispatch", () => {
    it("passes event frames to the message handler", () => {
      const handler = jest.fn();
      transport.onMessage(handler);
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "evt",
        event: "health",
        payload: { status: "ok" },
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "evt",
          event: "health",
          payload: { status: "ok" },
        })
      );
    });
  });

  describe("heartbeat", () => {
    it("sends ping frames at the heartbeat interval", () => {
      transport.connect("ws://localhost:18789");
      mockWs.simulateOpen();

      // Clear any messages sent during connection
      mockWs.sent = [];

      jest.advanceTimersByTime(PROTOCOL.HEARTBEAT_INTERVAL_MS);

      expect(mockWs.sent.length).toBe(1);
      expect(JSON.parse(mockWs.sent[0])).toEqual({ type: "ping" });
    });
  });
});
