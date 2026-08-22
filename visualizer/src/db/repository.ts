import { randomUUID, createHash } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { AttackTrace, HistoryInput, IngestInput } from "../types.js";

export type AnalysisSummary = { id: string; source_id: string; trace_id: string; confidence: number; stages: string[]; techniques: string[]; created_at: string };
export type AnalysisDetail = AnalysisSummary & { started_at: string; ended_at: string; evidence: unknown[]; events: unknown[]; raw_trace: AttackTrace };
export type User = { id: string; github_id: string; username: string; avatar_url?: string };

export interface Repository {
  ingest(input: IngestInput): Promise<AnalysisDetail>;
  listAnalyses(limit: number, offset: number): Promise<{ items: AnalysisSummary[]; total: number }>;
  getAnalysis(id: string): Promise<AnalysisDetail | null>;
  recordHistory(userId: string, input: HistoryInput): Promise<void>;
  createOAuthSession(githubId: string, username: string, avatarUrl?: string): Promise<string>;
  findSession(token: string): Promise<User | null>;
  revokeSession(token: string): Promise<void>;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export class PgRepository implements Repository {
  constructor(private readonly pool: Pool) {}

  async ingest(input: IngestInput): Promise<AnalysisDetail> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const id = randomUUID();
      const existing = await client.query("SELECT id FROM analysis WHERE source_id=$1 AND trace_id=$2", [input.source_id, input.trace.trace_id]);
      const analysisId = existing.rows[0]?.id ?? id;
      await client.query(`INSERT INTO analysis (id,source_id,trace_id,schema_version,started_at,ended_at,stages,techniques,confidence,evidence,raw_trace) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (source_id,trace_id) DO UPDATE SET ended_at=EXCLUDED.ended_at, stages=EXCLUDED.stages, techniques=EXCLUDED.techniques, confidence=EXCLUDED.confidence, evidence=EXCLUDED.evidence, raw_trace=EXCLUDED.raw_trace`, [analysisId, input.source_id, input.trace.trace_id, input.schema_version, input.trace.started_at, input.trace.ended_at, JSON.stringify(input.trace.stages), JSON.stringify(input.trace.techniques), input.trace.confidence, JSON.stringify(input.trace.evidence), JSON.stringify(input.trace)]);
      await client.query("DELETE FROM analysis_event WHERE analysis_id=$1", [analysisId]);
      for (const event of input.events) await client.query("INSERT INTO analysis_event (analysis_id,event_id,sequence,event_type,event_timestamp,payload) VALUES ($1,$2,$3,$4,$5,$6)", [analysisId, event.event_id, event.sequence, event.event_type, event.timestamp, JSON.stringify(event.payload)]);
      await client.query("COMMIT");
      return detailFromInput(analysisId, input);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async listAnalyses(limit: number, offset: number) { const result = await this.pool.query("SELECT id,source_id,trace_id,confidence,stages,techniques,created_at FROM analysis ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]); const count = await this.pool.query("SELECT count(*)::int AS total FROM analysis"); return { items: result.rows, total: count.rows[0]?.total ?? 0 }; }
  async getAnalysis(id: string) { const result = await this.pool.query("SELECT id,source_id,trace_id,confidence,stages,techniques,created_at,started_at,ended_at,evidence,raw_trace FROM analysis WHERE id=$1", [id]); if (!result.rows[0]) return null; const events = await this.pool.query("SELECT event_id,sequence,event_type,event_timestamp,payload FROM analysis_event WHERE analysis_id=$1 ORDER BY sequence", [id]); return { ...result.rows[0], events: events.rows }; }
  async recordHistory(userId: string, input: HistoryInput) { await this.pool.query("INSERT INTO visualization_history (user_id,analysis_id,action,metadata) VALUES ($1,$2,$3,$4)", [userId, input.analysis_id, input.action, JSON.stringify(input.metadata)]); }
  async createOAuthSession(githubId: string, username: string, avatarUrl?: string) { const userId = randomUUID(); const token = randomUUID() + randomUUID(); await this.pool.query("INSERT INTO app_user (id,github_id,username,avatar_url) VALUES ($1,$2,$3,$4) ON CONFLICT (github_id) DO UPDATE SET username=EXCLUDED.username,avatar_url=EXCLUDED.avatar_url,last_login_at=now()", [userId, githubId, username, avatarUrl]); const user = await this.pool.query("SELECT id FROM app_user WHERE github_id=$1", [githubId]); await this.pool.query("INSERT INTO user_session (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '7 days')", [randomUUID(), user.rows[0].id, hashToken(token)]); return token; }
  async findSession(token: string) { const result = await this.pool.query("SELECT u.id,u.github_id,u.username,u.avatar_url FROM user_session s JOIN app_user u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()", [hashToken(token)]); return result.rows[0] ?? null; }
  async revokeSession(token: string) { await this.pool.query("DELETE FROM user_session WHERE token_hash=$1", [hashToken(token)]); }
}

export class MemoryRepository implements Repository {
  private readonly analyses = new Map<string, AnalysisDetail>(); private readonly sessions = new Map<string, User>(); private readonly history: HistoryInput[] = [];
  async ingest(input: IngestInput) { const existing = [...this.analyses.values()].find((item) => item.source_id === input.source_id && item.trace_id === input.trace.trace_id); const detail = detailFromInput(existing?.id ?? randomUUID(), input); this.analyses.set(detail.id, detail); return detail; }
  async listAnalyses(limit: number, offset: number) { const all = [...this.analyses.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)); return { items: all.slice(offset, offset + limit).map(({ id, source_id, trace_id, confidence, stages, techniques, created_at }) => ({ id, source_id, trace_id, confidence, stages, techniques, created_at })), total: all.length }; }
  async getAnalysis(id: string) { return this.analyses.get(id) ?? null; }
  async recordHistory(_userId: string, input: HistoryInput) { this.history.push(input); }
  async createOAuthSession(githubId: string, username: string, avatarUrl?: string) { const token = randomUUID(); this.sessions.set(token, { id: randomUUID(), github_id: githubId, username, avatar_url: avatarUrl }); return token; }
  async findSession(token: string) { return this.sessions.get(token) ?? null; }
  async revokeSession(token: string) { this.sessions.delete(token); }
}

function detailFromInput(id: string, input: IngestInput): AnalysisDetail { return { id, source_id: input.source_id, trace_id: input.trace.trace_id, confidence: input.trace.confidence, stages: input.trace.stages, techniques: input.trace.techniques, created_at: new Date().toISOString(), started_at: input.trace.started_at, ended_at: input.trace.ended_at, evidence: input.trace.evidence, events: input.events, raw_trace: input.trace }; }

export type DbClient = Pool | PoolClient;
