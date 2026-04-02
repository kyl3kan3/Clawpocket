// ─── Frame Types ────────────────────────────────────────────────
export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface ResponseFrame {
  type: "res";
  id: string;
  result?: unknown;
  error?: FrameError;
}

export interface EventFrame {
  type: "evt";
  event: string;
  payload: unknown;
}

export interface FrameError {
  code: string;
  message: string;
  retryAfterMs?: number;
}

export type Frame = RequestFrame | ResponseFrame | EventFrame;

// ─── Connection & Auth ──────────────────────────────────────────
export interface ConnectParams {
  auth?: {
    token?: string;
    password?: string;
    deviceToken?: string;
  };
  device?: {
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
    platform: "ios" | "android" | "web";
    deviceFamily: "mobile" | "desktop" | "server";
  };
  protocol?: number;
}

export interface HelloOkPayload {
  auth: {
    deviceToken: string;
    expiresAt?: number;
  };
  server: {
    version: string;
    features: string[];
  };
}

export interface ChallengePayload {
  nonce: string;
  ts: number;
}

// ─── Chat ───────────────────────────────────────────────────────
export interface ChatSendParams {
  message: string;
  sessionId?: string;
  agentId?: string;
  model?: string;
  attachments?: Attachment[];
}

export interface ChatHistoryParams {
  sessionId: string;
  limit?: number;
  before?: string;
}

export interface ChatAbortParams {
  runId: string;
}

export interface ChatInjectParams {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Attachment {
  type: "image" | "file";
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
  aborted?: boolean;
  tokens?: { input: number; output: number };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "pending" | "running" | "completed" | "error";
}

// ─── Sessions ───────────────────────────────────────────────────
export interface Session {
  id: string;
  agentId?: string;
  channelId?: string;
  peerId?: string;
  model?: string;
  title?: string;
  lastActivity: number;
  messageCount: number;
  tokens: { input: number; output: number };
  settings?: SessionSettings;
}

export interface SessionSettings {
  thinking?: boolean;
  fast?: boolean;
  verbose?: boolean;
  reasoning?: "low" | "medium" | "high";
  model?: string;
}

export interface SessionPatchParams {
  sessionId: string;
  settings?: Partial<SessionSettings>;
  title?: string;
}

// ─── Agents ─────────────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  description?: string;
  model?: string;
  identity?: AgentIdentity;
  channels?: string[];
  tools?: AgentToolPolicy;
  createdAt: number;
  updatedAt: number;
}

export interface AgentIdentity {
  name: string;
  personality?: string;
  instructions?: string;
}

export interface AgentToolPolicy {
  allowed?: string[];
  denied?: string[];
}

export interface AgentFile {
  name: string;
  content: string;
  updatedAt: number;
}

// ─── Config ─────────────────────────────────────────────────────
export interface ConfigGetResult {
  config: Record<string, unknown>;
  baseHash: string;
  schema?: Record<string, unknown>;
}

export interface ConfigPatchParams {
  path: string;
  value: unknown;
  baseHash: string;
}

export interface ConfigSetParams {
  config: Record<string, unknown>;
  baseHash: string;
}

// ─── Cron ───────────────────────────────────────────────────────
export interface CronJob {
  id: string;
  schedule: string;
  agentId?: string;
  message: string;
  sessionTarget?: string;
  deliveryContext?: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
}

export interface CronRun {
  id: string;
  jobId: string;
  startedAt: number;
  completedAt?: number;
  status: "running" | "completed" | "error";
  result?: string;
  error?: string;
}

export interface CronAddParams {
  schedule: string;
  agentId?: string;
  message: string;
  sessionTarget?: string;
  deliveryContext?: string;
  enabled?: boolean;
}

// ─── Nodes & Devices ────────────────────────────────────────────
export interface Node {
  id: string;
  name: string;
  platform: string;
  capabilities: string[];
  status: "online" | "offline";
  lastSeen: number;
}

export interface Device {
  publicKey: string;
  name?: string;
  platform: string;
  deviceFamily: string;
  lastSeen: number;
  approved: boolean;
}

export interface ExecApproval {
  id: string;
  command: string;
  agentId?: string;
  sessionId?: string;
  requestedAt: number;
  expiresAt: number;
  status: "pending" | "approved" | "denied";
}

export interface ExecApprovalPolicy {
  gateway: string[];
  node: string[];
}

// ─── Channels ───────────────────────────────────────────────────
export interface ChannelStatus {
  id: string;
  type: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  error?: string;
  config?: Record<string, unknown>;
}

// ─── Skills ─────────────────────────────────────────────────────
export interface Skill {
  id: string;
  name: string;
  description?: string;
  version?: string;
  enabled: boolean;
  source: string;
  requiredConfig?: string[];
}

// ─── Health ─────────────────────────────────────────────────────
export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  version: string;
  uptime: number;
  activeSessions: number;
  connectedNodes: number;
  connectedClients: number;
  memory?: { used: number; total: number };
  updateAvailable?: string;
}

// ─── Presence ───────────────────────────────────────────────────
export interface PresenceEntry {
  deviceId: string;
  deviceName?: string;
  platform: string;
  type: "operator" | "node";
  connectedAt: number;
}

// ─── Models ─────────────────────────────────────────────────────
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxOutput?: number;
}

// ─── Logs ───────────────────────────────────────────────────────
export interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  source?: string;
  data?: Record<string, unknown>;
}

// ─── Usage ──────────────────────────────────────────────────────
export interface UsageSummary {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestCount: number;
}
