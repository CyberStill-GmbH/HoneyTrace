export type User = { id: string; github_id: string; username: string; avatar_url?: string };
export type Severity = "recon" | "brute-force" | "auth-success" | "admin-access" | "info";

export type AnalysisSummary = {
  id: string; source_id: string; trace_id: string; confidence: number; stages: string[]; techniques: string[];
  created_at: string; started_at: string; ended_at: string;
};
export type Evidence = { event_id: string; reason: string; source?: string };
export type Entity = { id: string; kind: string; role?: string };
export type NormalizedEvent = {
  schema_version: string; event_id: string; timestamp: string; ingest_timestamp?: string | null; trace_id?: string;
  sequence: number; event_type: string; raw_source: string; source_ip?: string | null; session_id?: string | null;
  method?: string | null; path?: string | null; status_code?: number | null; user_id?: string | null; duration_ms?: number | null;
  user_agent?: string | null; vulnerability?: string | null; outcome?: string | null; payload_sha256?: string | null;
  payload_size?: number | null; entities: Entity[]; causes: string[]; metadata: Record<string, unknown>;
};
export type AttackTrace = { trace_id: string; started_at: string; ended_at: string; stages: string[]; event_ids: string[]; techniques: string[]; confidence: number; evidence: Evidence[] };
export type AnalysisDetail = AnalysisSummary & { schema_version: string; evidence: Evidence[]; events: NormalizedEvent[]; raw_trace: AttackTrace };
export type AnalysisList = { items: AnalysisSummary[]; total: number };
export type Stats = { total: number; recent_24h: number; average_confidence: number; by_source: Record<string, number>; by_stage: Record<string, number>; by_technique: Record<string, number> };
export type GraphNode = { id: string; type: string; sequence: number; timestamp: string; stage?: string | null; source: string };
export type GraphEdge = { id: string; source: string; target: string; relationship: "causes" | "sequence" };
export type GraphData = { analysis_id: string; nodes: GraphNode[]; edges: GraphEdge[] };
export type IngestToken = { id: string; name: string; token_hint: string; created_at: string; last_used_at?: string; revoked_at?: string; token?: string };
