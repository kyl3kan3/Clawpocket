import { GatewayTransport } from "./transport";
import { performAuth, type AuthResult } from "./auth";
import type { GatewayEventMap, EventHandler } from "./events";
import type {
  Frame,
  ChatSendParams,
  ChatHistoryParams,
  ChatAbortParams,
  ChatInjectParams,
  SessionPatchParams,
  ConfigPatchParams,
  ConfigSetParams,
  CronAddParams,
  Session,
  Agent,
  AgentFile,
  CronJob,
  CronRun,
  ChannelStatus,
  Skill,
  HealthStatus,
  PresenceEntry,
  ModelInfo,
  Node,
  Device,
  ExecApproval,
  ExecApprovalPolicy,
  ConfigGetResult,
  LogEntry,
  ChatMessage,
} from "./types";
import { PROTOCOL } from "../constants/protocol";

type EventHandlerMap = {
  [K in keyof GatewayEventMap]?: Set<EventHandler<K>>;
};

class GatewayClient {
  private transport = new GatewayTransport();
  private eventHandlers: EventHandlerMap = {};
  private _url: string | null = null;
  private _authResult: AuthResult | null = null;

  get connected(): boolean {
    return this.transport.connected;
  }

  get authResult(): AuthResult | null {
    return this._authResult;
  }

  // ─── Connection ─────────────────────────────────────────────
  async connect(url: string): Promise<AuthResult> {
    this._url = url;
    this.transport.onMessage(this.dispatchFrame);
    this.transport.connect(url);
    this._authResult = await performAuth(this.transport);
    return this._authResult;
  }

  disconnect(): void {
    this.transport.disconnect();
    this._authResult = null;
  }

  reconnect(): void {
    if (this._url) {
      this.transport.connect(this._url);
    }
  }

  // ─── Event System ───────────────────────────────────────────
  on<K extends keyof GatewayEventMap>(
    event: K,
    handler: EventHandler<K>
  ): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    (this.eventHandlers[event] as Set<EventHandler<K>>).add(handler);
  }

  off<K extends keyof GatewayEventMap>(
    event: K,
    handler: EventHandler<K>
  ): void {
    (this.eventHandlers[event] as Set<EventHandler<K>> | undefined)?.delete(
      handler
    );
  }

  private dispatchFrame = (frame: Frame): void => {
    if (frame.type === "evt") {
      const evt = frame as { type: "evt"; event: string; payload: unknown };
      const handlers = this.eventHandlers[
        evt.event as keyof GatewayEventMap
      ] as Set<(payload: unknown) => void> | undefined;
      if (handlers) {
        for (const handler of handlers) {
          handler(evt.payload);
        }
      }
    }
  };

  // ─── Chat RPC ───────────────────────────────────────────────
  chat = {
    send: (params: ChatSendParams) =>
      this.transport.request<{ runId: string; status: string }>(
        "chat.send",
        params as unknown as Record<string, unknown>
      ),
    history: (params: ChatHistoryParams) =>
      this.transport.request<{ messages: ChatMessage[] }>(
        "chat.history",
        params as unknown as Record<string, unknown>
      ),
    abort: (params: ChatAbortParams) =>
      this.transport.request<{ success: boolean }>(
        "chat.abort",
        params as unknown as Record<string, unknown>
      ),
    inject: (params: ChatInjectParams) =>
      this.transport.request<{ success: boolean }>(
        "chat.inject",
        params as unknown as Record<string, unknown>
      ),
  };

  // ─── Sessions RPC ──────────────────────────────────────────
  sessions = {
    list: (params?: { agentId?: string }) =>
      this.transport.request<{ sessions: Session[] }>(
        "sessions.list",
        params as Record<string, unknown>
      ),
    patch: (params: SessionPatchParams) =>
      this.transport.request<{ success: boolean }>(
        "sessions.patch",
        params as unknown as Record<string, unknown>
      ),
    reset: (params: { sessionId: string }) =>
      this.transport.request<{ success: boolean }>(
        "sessions.reset",
        params as Record<string, unknown>
      ),
    delete: (params: { sessionId: string }) =>
      this.transport.request<{ success: boolean }>(
        "sessions.delete",
        params as Record<string, unknown>
      ),
    compact: (params: { sessionId: string }) =>
      this.transport.request<{ success: boolean }>(
        "sessions.compact",
        params as Record<string, unknown>
      ),
  };

  // ─── Agents RPC ────────────────────────────────────────────
  agents = {
    list: () =>
      this.transport.request<{ agents: Agent[] }>("agents.list"),
    create: (params: Partial<Agent>) =>
      this.transport.request<Agent>(
        "agents.create",
        params as Record<string, unknown>
      ),
    update: (params: { id: string } & Partial<Agent>) =>
      this.transport.request<Agent>(
        "agents.update",
        params as Record<string, unknown>
      ),
    delete: (params: { id: string }) =>
      this.transport.request<{ success: boolean }>(
        "agents.delete",
        params as Record<string, unknown>
      ),
    identity: {
      get: (params: { agentId: string }) =>
        this.transport.request<{ identity: Agent["identity"] }>(
          "agent.identity.get",
          params as Record<string, unknown>
        ),
    },
    files: {
      list: (params: { agentId: string }) =>
        this.transport.request<{ files: AgentFile[] }>(
          "agents.files.list",
          params as Record<string, unknown>
        ),
      read: (params: { agentId: string; name: string }) =>
        this.transport.request<{ content: string }>(
          "agents.files.read",
          params as Record<string, unknown>
        ),
      write: (params: { agentId: string; name: string; content: string }) =>
        this.transport.request<{ success: boolean }>(
          "agents.files.write",
          params as Record<string, unknown>
        ),
    },
  };

  // ─── Config RPC ────────────────────────────────────────────
  config = {
    get: () => this.transport.request<ConfigGetResult>("config.get"),
    set: (params: ConfigSetParams) =>
      this.transport.request<{ success: boolean; baseHash: string }>(
        "config.set",
        params as unknown as Record<string, unknown>
      ),
    patch: (params: ConfigPatchParams) =>
      this.transport.request<{ success: boolean; baseHash: string }>(
        "config.patch",
        params as unknown as Record<string, unknown>
      ),
    apply: () =>
      this.transport.request<{ success: boolean; restarting: boolean }>(
        "config.apply"
      ),
    schema: () =>
      this.transport.request<{ schema: Record<string, unknown> }>(
        "config.schema"
      ),
  };

  // ─── Cron RPC ──────────────────────────────────────────────
  cron = {
    list: () =>
      this.transport.request<{ jobs: CronJob[] }>("cron.list"),
    add: (params: CronAddParams) =>
      this.transport.request<CronJob>(
        "cron.add",
        params as unknown as Record<string, unknown>
      ),
    update: (params: { id: string } & Partial<CronAddParams>) =>
      this.transport.request<CronJob>(
        "cron.update",
        params as unknown as Record<string, unknown>
      ),
    remove: (params: { id: string }) =>
      this.transport.request<{ success: boolean }>(
        "cron.remove",
        params as Record<string, unknown>
      ),
    run: (params: { id: string }) =>
      this.transport.request<{ runId: string }>(
        "cron.run",
        params as Record<string, unknown>
      ),
    runs: (params: { jobId: string; limit?: number }) =>
      this.transport.request<{ runs: CronRun[] }>(
        "cron.runs",
        params as Record<string, unknown>
      ),
  };

  // ─── Nodes & Devices RPC ───────────────────────────────────
  nodes = {
    list: () =>
      this.transport.request<{ nodes: Node[] }>("node.list"),
    describe: (params: { nodeId: string }) =>
      this.transport.request<Node>(
        "node.describe",
        params as Record<string, unknown>
      ),
    rename: (params: { nodeId: string; name: string }) =>
      this.transport.request<{ success: boolean }>(
        "node.rename",
        params as Record<string, unknown>
      ),
  };

  devices = {
    pairList: () =>
      this.transport.request<{ devices: Device[] }>("device.pair.list"),
    pairApprove: (params: { publicKey: string; approved: boolean }) =>
      this.transport.request<{ success: boolean }>(
        "device.pair.approve",
        params as Record<string, unknown>
      ),
    tokenRotate: () =>
      this.transport.request<{ deviceToken: string }>("device.token.rotate"),
    tokenRevoke: (params: { publicKey: string }) =>
      this.transport.request<{ success: boolean }>(
        "device.token.revoke",
        params as Record<string, unknown>
      ),
  };

  // ─── Exec Approvals RPC ────────────────────────────────────
  execApprovals = {
    get: () =>
      this.transport.request<{ policy: ExecApprovalPolicy }>(
        "exec.approvals.get"
      ),
    set: (params: ExecApprovalPolicy) =>
      this.transport.request<{ success: boolean }>(
        "exec.approvals.set",
        params as Record<string, unknown>
      ),
    resolve: (params: {
      id: string;
      action: "allow_once" | "allow_always" | "deny";
    }) =>
      this.transport.request<{ success: boolean }>(
        "exec.approval.resolve",
        params as Record<string, unknown>
      ),
  };

  // ─── Channels RPC ──────────────────────────────────────────
  channels = {
    status: () =>
      this.transport.request<{ channels: ChannelStatus[] }>(
        "channels.status"
      ),
  };

  // ─── Skills RPC ────────────────────────────────────────────
  skills = {
    status: () =>
      this.transport.request<{ skills: Skill[] }>("skills.status"),
    bins: () =>
      this.transport.request<{ bins: Skill[] }>("skills.bins"),
    install: (params: { skillId: string }) =>
      this.transport.request<{ success: boolean }>(
        "skills.install",
        params as Record<string, unknown>
      ),
    update: (params: { skillId: string }) =>
      this.transport.request<{ success: boolean }>(
        "skills.update",
        params as Record<string, unknown>
      ),
  };

  // ─── Health & System RPC ───────────────────────────────────
  health = () =>
    this.transport.request<HealthStatus>("health");

  presence = () =>
    this.transport.request<{ entries: PresenceEntry[] }>(
      "system-presence"
    );

  models = () =>
    this.transport.request<{ models: ModelInfo[] }>("models.list");

  // ─── Logs RPC ──────────────────────────────────────────────
  logs = {
    tail: (params?: { level?: string; limit?: number }) =>
      this.transport.request<{ entries: LogEntry[] }>(
        "logs.tail",
        params as Record<string, unknown>
      ),
  };

  // ─── Debug/Doctor RPC ──────────────────────────────────────
  doctor = {
    memoryStatus: () =>
      this.transport.request<{ status: Record<string, unknown> }>(
        "doctor.memory.status"
      ),
  };

  wake = () => this.transport.request<{ success: boolean }>("wake");

  // ─── Tools RPC ─────────────────────────────────────────────
  tools = {
    catalog: () =>
      this.transport.request<{
        tools: Array<{
          id: string;
          name: string;
          source: string;
          pluginId?: string;
        }>;
      }>("tools.catalog"),
    effective: (params: { agentId: string }) =>
      this.transport.request<{ tools: string[] }>(
        "tools.effective",
        params as Record<string, unknown>
      ),
  };
}

// Singleton instance
export const gateway = new GatewayClient();
export type { GatewayClient };
