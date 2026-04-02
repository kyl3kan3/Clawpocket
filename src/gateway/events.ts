import type {
  ChallengePayload,
  HelloOkPayload,
  ChatMessage,
  ToolCall,
  HealthStatus,
  PresenceEntry,
  ExecApproval,
  CronJob,
  CronRun,
  LogEntry,
  Node,
  Device,
} from "./types";

// ─── Event Type Map ─────────────────────────────────────────────
export interface GatewayEventMap {
  // Connection lifecycle
  "connect.challenge": ChallengePayload;
  "hello-ok": HelloOkPayload;
  "connect.error": { code: string; message: string };

  // Agent/Chat streaming
  agent: AgentEvent;
  chat: ChatEvent;

  // Health & presence
  health: HealthStatus;
  presence: PresenceEntry[];
  tick: { ts: number };
  "update.available": { version: string; changelog?: string };

  // Exec approvals
  "exec.approval.requested": ExecApproval;
  "exec.approval.resolved": ExecApproval;

  // Device pairing
  "device.pair.requested": Device;
  "device.pair.resolved": Device & { approved: boolean };
  "node.pair.requested": Node;
  "node.pair.resolved": Node & { approved: boolean };

  // Cron
  cron: CronEvent;

  // Logs (streaming)
  log: LogEntry;
}

// ─── Agent Event (Chat Streaming) ───────────────────────────────
export type AgentEventState =
  | "started"
  | "delta"
  | "tool_call_start"
  | "tool_call_delta"
  | "tool_call_end"
  | "final"
  | "aborted"
  | "error";

export interface AgentEvent {
  runId: string;
  sessionId: string;
  state: AgentEventState;
  text?: string;
  toolCall?: Partial<ToolCall>;
  message?: ChatMessage;
  error?: string;
  model?: string;
  tokens?: { input: number; output: number };
}

// ─── Chat Event ─────────────────────────────────────────────────
export interface ChatEvent {
  sessionId: string;
  message: ChatMessage;
}

// ─── Cron Event ─────────────────────────────────────────────────
export interface CronEvent {
  type: "run.started" | "run.completed" | "run.error" | "updated";
  job?: CronJob;
  run?: CronRun;
}

// ─── Event Handler Type ─────────────────────────────────────────
export type EventHandler<K extends keyof GatewayEventMap> = (
  payload: GatewayEventMap[K]
) => void;
