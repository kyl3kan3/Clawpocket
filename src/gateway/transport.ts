import ReconnectingWebSocket from "reconnecting-websocket";
import { PROTOCOL, FRAME_TYPES } from "../constants/protocol";
import type { RequestFrame, ResponseFrame, EventFrame, Frame, FrameError } from "./types";

type MessageHandler = (frame: Frame) => void;

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: FrameError) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class GatewayTransport {
  private rws: ReconnectingWebSocket | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private messageQueue: string[] = [];
  private messageHandler: MessageHandler | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  connect(url: string): void {
    this.disconnect();

    this.rws = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: PROTOCOL.RECONNECT_MAX_DELAY_MS,
      minReconnectionDelay: PROTOCOL.RECONNECT_MIN_DELAY_MS,
      reconnectionDelayGrowFactor: PROTOCOL.RECONNECT_DELAY_GROW_FACTOR,
      connectionTimeout: PROTOCOL.CONNECTION_TIMEOUT_MS,
      maxRetries: Infinity,
    });

    this.rws.addEventListener("open", this.handleOpen);
    this.rws.addEventListener("close", this.handleClose);
    this.rws.addEventListener("message", this.handleMessage);
    this.rws.addEventListener("error", this.handleError);
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.rws) {
      this.rws.removeEventListener("open", this.handleOpen);
      this.rws.removeEventListener("close", this.handleClose);
      this.rws.removeEventListener("message", this.handleMessage);
      this.rws.removeEventListener("error", this.handleError);
      this.rws.close();
      this.rws = null;
    }
    this._connected = false;
    this.rejectAllPending("Transport disconnected");
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  async request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    const id = generateId();
    const frame: RequestFrame = { type: FRAME_TYPES.REQUEST, id, method, params };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject({ code: "TIMEOUT", message: `Request ${method} timed out` });
      }, PROTOCOL.REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, {
        resolve: resolve as (result: unknown) => void,
        reject,
        timeout,
      });

      this.send(JSON.stringify(frame));
    });
  }

  send(data: string): void {
    if (this._connected && this.rws?.readyState === WebSocket.OPEN) {
      this.rws.send(data);
    } else {
      this.messageQueue.push(data);
    }
  }

  private handleOpen = (): void => {
    this._connected = true;
    this.flushQueue();
    this.startHeartbeat();
  };

  private handleClose = (): void => {
    this._connected = false;
    this.stopHeartbeat();
  };

  private handleMessage = (event: MessageEvent): void => {
    let frame: Frame;
    try {
      frame = JSON.parse(event.data as string) as Frame;
    } catch {
      return;
    }

    if (frame.type === FRAME_TYPES.RESPONSE) {
      const res = frame as ResponseFrame;
      const pending = this.pendingRequests.get(res.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(res.id);
        if (res.error) {
          pending.reject(res.error);
        } else {
          pending.resolve(res.result);
        }
      }
    }

    this.messageHandler?.(frame);
  };

  private handleError = (): void => {
    // Reconnection is handled automatically by ReconnectingWebSocket
  };

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.rws?.send(msg);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this._connected) {
        this.send(JSON.stringify({ type: "ping" }));
      }
    }, PROTOCOL.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private rejectAllPending(message: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject({ code: "DISCONNECTED", message });
    }
    this.pendingRequests.clear();
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
