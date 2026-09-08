import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { config } from "../config.js";
import type { AnalysisFilters, AttackTrace, HistoryInput, IngestInput, NormalizedEvent } from "../types.js";
import { interpretAnalysis, type AnalysisInterpretation } from "../analysis/interpretation.js";

export type User = { id: string; github_id: string; username: string; avatar_url?: string };
export type AuthTokens = { accessToken: string; refreshToken: string };
export type AnalysisSummary = { id: string; source_id: string; trace_id: string; confidence: number; stages: string[]; techniques: string[]; created_at: string; started_at: string; ended_at: string };
export type AnalysisDetail = AnalysisSummary & { schema_version: string; evidence: unknown[]; events: NormalizedEvent[]; raw_trace: AttackTrace; interpretation: AnalysisInterpretation };
export type Stats = { total: number; recent_24h: number; average_confidence: number; by_source: Record<string, number>; by_stage: Record<string, number>; by_technique: Record<string, number> };
export type IngestTokenView = { id: string; name: string; token_hint: string; created_at: string; last_used_at?: string; revoked_at?: string };

export interface Repository {
  ingest(userId: string, input: IngestInput): Promise<AnalysisDetail>;
  listAnalyses(userId: string, filters: AnalysisFilters): Promise<{ items: AnalysisSummary[]; total: number }>;
  getAnalysis(userId: string, id: string): Promise<AnalysisDetail | null>;
  getStats(userId: string): Promise<Stats>;
  recordHistory(userId: string, input: HistoryInput): Promise<boolean>;
  createOAuthSession(githubId: string, username: string, avatarUrl?: string): Promise<AuthTokens>;
  findAccessSession(token: string): Promise<User | null>;
  rotateSession(refreshToken: string): Promise<AuthTokens | null>;
  revokeSession(accessToken?: string, refreshToken?: string): Promise<void>;
  createIngestToken(userId: string, name: string): Promise<IngestTokenView & { token: string }>;
  listIngestTokens(userId: string): Promise<IngestTokenView[]>;
  revokeIngestToken(userId: string, id: string): Promise<boolean>;
  findIngestOwner(token: string): Promise<string | null>;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = (prefix: string) => `${prefix}_${randomBytes(32).toString("base64url")}`;
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const iso = (value: Date | string) => new Date(value).toISOString();
const userView = (user: { id: string; githubId: string; username: string; avatarUrl: string | null }): User => ({ id: user.id, github_id: user.githubId, username: user.username, ...(user.avatarUrl ? { avatar_url: user.avatarUrl } : {}) });

function eventView(data: unknown): NormalizedEvent { return data as NormalizedEvent; }
function summaryView(row: any): AnalysisSummary {
  return { id: row.id, source_id: row.sourceId, trace_id: row.traceId, confidence: row.confidence, stages: strings(row.stages), techniques: strings(row.techniques), created_at: iso(row.createdAt), started_at: iso(row.startedAt), ended_at: iso(row.endedAt) };
}
function detailView(row: any): AnalysisDetail {
  const rawTrace = row.rawTrace as AttackTrace;
  const events = (row.events ?? []).map((event: any) => eventView(event.data));
  return { ...summaryView(row), schema_version: row.schemaVersion, evidence: Array.isArray(row.evidence) ? row.evidence : [], raw_trace: rawTrace, events, interpretation: interpretAnalysis(rawTrace, events) };
}

export class PrismaRepository implements Repository {
  constructor(private readonly prisma: PrismaClient) {}

  async ingest(userId: string, input: IngestInput) {
    const row = await this.prisma.$transaction(async (tx) => {
      const analysis = await tx.analysis.upsert({
        where: { userId_sourceId_traceId: { userId, sourceId: input.source_id, traceId: input.trace.trace_id } },
        create: { userId, sourceId: input.source_id, traceId: input.trace.trace_id, schemaVersion: input.schema_version, startedAt: new Date(input.trace.started_at), endedAt: new Date(input.trace.ended_at), stages: json(input.trace.stages), techniques: json(input.trace.techniques), confidence: input.trace.confidence, evidence: json(input.trace.evidence), rawTrace: json(input.trace) },
        update: { schemaVersion: input.schema_version, startedAt: new Date(input.trace.started_at), endedAt: new Date(input.trace.ended_at), stages: json(input.trace.stages), techniques: json(input.trace.techniques), confidence: input.trace.confidence, evidence: json(input.trace.evidence), rawTrace: json(input.trace) },
      });
      await tx.analysisEvent.deleteMany({ where: { analysisId: analysis.id } });
      if (input.events.length) await tx.analysisEvent.createMany({ data: input.events.map((event) => ({ analysisId: analysis.id, eventId: event.event_id, sequence: BigInt(event.sequence), eventType: event.event_type, timestamp: new Date(event.timestamp), data: json(event) })) });
      return tx.analysis.findUniqueOrThrow({ where: { id: analysis.id }, include: { events: { orderBy: { sequence: "asc" } } } });
    });
    return detailView(row);
  }

  async listAnalyses(userId: string, filters: AnalysisFilters) {
    const where: Prisma.AnalysisWhereInput = { userId };
    if (filters.source_id) where.sourceId = filters.source_id;
    if (filters.stage) where.stages = { array_contains: [filters.stage] };
    if (filters.technique) where.techniques = { array_contains: [filters.technique] };
    if (filters.min_confidence !== undefined || filters.max_confidence !== undefined) where.confidence = { ...(filters.min_confidence !== undefined ? { gte: filters.min_confidence } : {}), ...(filters.max_confidence !== undefined ? { lte: filters.max_confidence } : {}) };
    if (filters.from || filters.to) where.startedAt = { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) };
    if (filters.search) where.OR = [{ traceId: { contains: filters.search, mode: "insensitive" } }, { sourceId: { contains: filters.search, mode: "insensitive" } }];
    const orderField = filters.sort === "created_at" ? "createdAt" : filters.sort === "started_at" ? "startedAt" : "confidence";
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.analysis.findMany({ where, skip: filters.offset, take: filters.limit, orderBy: { [orderField]: filters.order } }),
      this.prisma.analysis.count({ where }),
    ]);
    return { items: rows.map(summaryView), total };
  }

  async getAnalysis(userId: string, id: string) {
    const row = await this.prisma.analysis.findFirst({ where: { id, userId }, include: { events: { orderBy: { sequence: "asc" } } } });
    return row ? detailView(row) : null;
  }

  async getStats(userId: string): Promise<Stats> {
    const [aggregate, recent, rows] = await this.prisma.$transaction([
      this.prisma.analysis.aggregate({ where: { userId }, _count: true, _avg: { confidence: true } }),
      this.prisma.analysis.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
      this.prisma.analysis.findMany({ where: { userId }, select: { sourceId: true, stages: true, techniques: true } }),
    ]);
    const count = (target: Record<string, number>, values: string[]) => values.forEach((value) => { target[value] = (target[value] ?? 0) + 1; });
    const stats: Stats = { total: aggregate._count, recent_24h: recent, average_confidence: aggregate._avg.confidence ?? 0, by_source: {}, by_stage: {}, by_technique: {} };
    rows.forEach((row) => { count(stats.by_source, [row.sourceId]); count(stats.by_stage, strings(row.stages)); count(stats.by_technique, strings(row.techniques)); });
    return stats;
  }

  async recordHistory(userId: string, input: HistoryInput) {
    const exists = await this.prisma.analysis.findFirst({ where: { id: input.analysis_id, userId }, select: { id: true } });
    if (!exists) return false;
    await this.prisma.visualizationHistory.create({ data: { userId, analysisId: input.analysis_id, action: input.action, metadata: json(input.metadata) } });
    return true;
  }

  async createOAuthSession(githubId: string, username: string, avatarUrl?: string) {
    const user = await this.prisma.user.upsert({ where: { githubId }, create: { githubId, username, avatarUrl }, update: { username, avatarUrl, lastLoginAt: new Date() } });
    const tokens = this.makeTokens();
    await this.prisma.userSession.create({ data: { userId: user.id, accessTokenHash: hashToken(tokens.accessToken), refreshTokenHash: hashToken(tokens.refreshToken), accessExpiresAt: new Date(Date.now() + config.ACCESS_TOKEN_TTL_MINUTES * 60_000), refreshExpiresAt: new Date(Date.now() + config.SESSION_TTL_DAYS * 86_400_000) } });
    return tokens;
  }

  async findAccessSession(token: string) {
    const session = await this.prisma.userSession.findFirst({ where: { accessTokenHash: hashToken(token), accessExpiresAt: { gt: new Date() }, refreshExpiresAt: { gt: new Date() } }, include: { user: true } });
    return session ? userView(session.user) : null;
  }

  async rotateSession(refreshToken: string) {
    const session = await this.prisma.userSession.findFirst({ where: { refreshTokenHash: hashToken(refreshToken), refreshExpiresAt: { gt: new Date() } } });
    if (!session) return null;
    const tokens = this.makeTokens();
    await this.prisma.userSession.update({ where: { id: session.id }, data: { accessTokenHash: hashToken(tokens.accessToken), refreshTokenHash: hashToken(tokens.refreshToken), accessExpiresAt: new Date(Date.now() + config.ACCESS_TOKEN_TTL_MINUTES * 60_000), refreshExpiresAt: new Date(Date.now() + config.SESSION_TTL_DAYS * 86_400_000) } });
    return tokens;
  }

  async revokeSession(accessToken?: string, refreshToken?: string) {
    if (!accessToken && !refreshToken) return;
    await this.prisma.userSession.deleteMany({ where: { OR: [...(accessToken ? [{ accessTokenHash: hashToken(accessToken) }] : []), ...(refreshToken ? [{ refreshTokenHash: hashToken(refreshToken) }] : [])] } });
  }

  async createIngestToken(userId: string, name: string) {
    const token = newToken("ht_ingest");
    const row = await this.prisma.ingestToken.create({ data: { userId, name, tokenHash: hashToken(token), tokenHint: token.slice(-8) } });
    return { ...this.tokenView(row), token };
  }
  async listIngestTokens(userId: string) { return (await this.prisma.ingestToken.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })).map((row) => this.tokenView(row)); }
  async revokeIngestToken(userId: string, id: string) { return (await this.prisma.ingestToken.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } })).count > 0; }
  async findIngestOwner(token: string) {
    const row = await this.prisma.ingestToken.findFirst({ where: { tokenHash: hashToken(token), revokedAt: null } });
    if (!row) return null;
    await this.prisma.ingestToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
    return row.userId;
  }
  private makeTokens(): AuthTokens { return { accessToken: newToken("ht_access"), refreshToken: newToken("ht_refresh") }; }
  private tokenView(row: { id: string; name: string; tokenHint: string; createdAt: Date; lastUsedAt: Date | null; revokedAt: Date | null }): IngestTokenView { return { id: row.id, name: row.name, token_hint: row.tokenHint, created_at: iso(row.createdAt), ...(row.lastUsedAt ? { last_used_at: iso(row.lastUsedAt) } : {}), ...(row.revokedAt ? { revoked_at: iso(row.revokedAt) } : {}) }; }
}

export class MemoryRepository implements Repository {
  private users = new Map<string, User>(); private sessions = new Map<string, { user: User; refresh: string }>(); private ingestTokens = new Map<string, { id: string; userId: string; view: IngestTokenView }>(); private analyses = new Map<string, { userId: string; detail: AnalysisDetail }>();
  async ingest(userId: string, input: IngestInput) { const existing = [...this.analyses.values()].find((item) => item.userId === userId && item.detail.source_id === input.source_id && item.detail.trace_id === input.trace.trace_id); const detail: AnalysisDetail = { id: existing?.detail.id ?? randomUUID(), source_id: input.source_id, trace_id: input.trace.trace_id, confidence: input.trace.confidence, stages: input.trace.stages, techniques: input.trace.techniques, created_at: existing?.detail.created_at ?? new Date().toISOString(), started_at: input.trace.started_at, ended_at: input.trace.ended_at, schema_version: input.schema_version, evidence: input.trace.evidence, events: input.events, raw_trace: input.trace, interpretation: interpretAnalysis(input.trace, input.events) }; this.analyses.set(detail.id, { userId, detail }); return detail; }
  async listAnalyses(userId: string, filters: AnalysisFilters) { let rows = [...this.analyses.values()].filter((row) => row.userId === userId).map((row) => row.detail); rows = rows.filter((row) => (!filters.source_id || row.source_id === filters.source_id) && (!filters.stage || row.stages.includes(filters.stage)) && (!filters.technique || row.techniques.includes(filters.technique)) && (filters.min_confidence === undefined || row.confidence >= filters.min_confidence) && (filters.max_confidence === undefined || row.confidence <= filters.max_confidence) && (!filters.from || row.started_at >= filters.from) && (!filters.to || row.started_at <= filters.to) && (!filters.search || `${row.trace_id} ${row.source_id}`.toLowerCase().includes(filters.search.toLowerCase()))); const key = filters.sort === "created_at" ? "created_at" : filters.sort === "started_at" ? "started_at" : "confidence"; rows.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (filters.order === "asc" ? 1 : -1)); return { total: rows.length, items: rows.slice(filters.offset, filters.offset + filters.limit).map(({ evidence: _e, events: _ev, raw_trace: _r, schema_version: _s, ...summary }) => summary) }; }
  async getAnalysis(userId: string, id: string) { const row = this.analyses.get(id); return row?.userId === userId ? row.detail : null; }
  async getStats(userId: string) { const rows = [...this.analyses.values()].filter((row) => row.userId === userId).map((row) => row.detail); const stats: Stats = { total: rows.length, recent_24h: rows.filter((row) => Date.parse(row.created_at) >= Date.now() - 86_400_000).length, average_confidence: rows.reduce((sum, row) => sum + row.confidence, 0) / (rows.length || 1), by_source: {}, by_stage: {}, by_technique: {} }; const add = (target: Record<string, number>, values: string[]) => values.forEach((value) => target[value] = (target[value] ?? 0) + 1); rows.forEach((row) => { add(stats.by_source, [row.source_id]); add(stats.by_stage, row.stages); add(stats.by_technique, row.techniques); }); return stats; }
  async recordHistory(userId: string, input: HistoryInput) { return Boolean(await this.getAnalysis(userId, input.analysis_id)); }
  async createOAuthSession(githubId: string, username: string, avatarUrl?: string) { let user = [...this.users.values()].find((item) => item.github_id === githubId); if (!user) { user = { id: randomUUID(), github_id: githubId, username, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) }; this.users.set(user.id, user); } const accessToken = newToken("ht_access"); const refreshToken = newToken("ht_refresh"); this.sessions.set(accessToken, { user, refresh: refreshToken }); return { accessToken, refreshToken }; }
  async findAccessSession(token: string) { return this.sessions.get(token)?.user ?? null; }
  async rotateSession(refreshToken: string) { const old = [...this.sessions.entries()].find(([, value]) => value.refresh === refreshToken); if (!old) return null; this.sessions.delete(old[0]); const accessToken = newToken("ht_access"), nextRefresh = newToken("ht_refresh"); this.sessions.set(accessToken, { user: old[1].user, refresh: nextRefresh }); return { accessToken, refreshToken: nextRefresh }; }
  async revokeSession(accessToken?: string, refreshToken?: string) { if (accessToken) this.sessions.delete(accessToken); if (refreshToken) for (const [key, value] of this.sessions) if (value.refresh === refreshToken) this.sessions.delete(key); }
  async createIngestToken(userId: string, name: string) { const token = newToken("ht_ingest"), id = randomUUID(); const view = { id, name, token_hint: token.slice(-8), created_at: new Date().toISOString() }; this.ingestTokens.set(token, { id, userId, view }); return { ...view, token }; }
  async listIngestTokens(userId: string) { return [...this.ingestTokens.values()].filter((row) => row.userId === userId).map((row) => row.view); }
  async revokeIngestToken(userId: string, id: string) { const found = [...this.ingestTokens.entries()].find(([, row]) => row.userId === userId && row.id === id); if (!found) return false; this.ingestTokens.delete(found[0]); return true; }
  async findIngestOwner(token: string) { return this.ingestTokens.get(token)?.userId ?? null; }
}
