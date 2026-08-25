import { z } from "zod";

const nullableText = (max: number) => z.string().max(max).nullable().optional();
const entitySchema = z.object({
  id: z.string().min(1).max(128),
  kind: z.enum(["actor", "session", "endpoint", "user", "order", "product", "file", "database", "process", "socket"]),
  role: z.string().max(64).optional(),
});

export const evidenceSchema = z.object({ event_id: z.string().min(1), reason: z.string().min(1), source: z.string().optional() }).passthrough();
export const eventSchema = z.object({
  schema_version: z.string().default("1.1"), event_id: z.string().min(1).max(128), timestamp: z.string().datetime({ offset: true }),
  ingest_timestamp: z.string().datetime({ offset: true }).nullable().optional(), trace_id: z.string().min(1).max(128).optional(),
  sequence: z.number().int().nonnegative(), event_type: z.string().min(1).max(64), raw_source: z.string().min(1).max(64),
  source_ip: nullableText(128), session_id: nullableText(128), method: nullableText(16), path: nullableText(256),
  status_code: z.number().int().min(100).max(599).nullable().optional(), user_id: nullableText(128), duration_ms: z.number().nonnegative().nullable().optional(),
  user_agent: nullableText(256), vulnerability: nullableText(64), outcome: nullableText(128),
  payload_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(), payload_size: z.number().int().nonnegative().nullable().optional(),
  entities: z.array(entitySchema).max(16).default([]), causes: z.array(z.string().min(1).max(128)).max(16).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export const attackTraceSchema = z.object({
  trace_id: z.string().min(1), started_at: z.string().datetime({ offset: true }), ended_at: z.string().datetime({ offset: true }),
  stages: z.array(z.string().min(1)).min(1), event_ids: z.array(z.string().min(1)).min(1), techniques: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1), evidence: z.array(evidenceSchema).default([]),
});
export const ingestSchema = z.object({ source_id: z.string().min(1).max(128), schema_version: z.string().min(1), trace: attackTraceSchema, events: z.array(eventSchema).max(10_000) }).superRefine((input, ctx) => {
  const ids = new Set(input.events.map((event) => event.event_id));
  input.trace.event_ids.forEach((id) => { if (!ids.has(id)) ctx.addIssue({ code: "custom", path: ["trace", "event_ids"], message: `event ${id} is missing` }); });
  input.events.forEach((event, index) => { if (event.trace_id && event.trace_id !== input.trace.trace_id) ctx.addIssue({ code: "custom", path: ["events", index, "trace_id"], message: "trace_id does not match trace" }); });
});
export const historySchema = z.object({ analysis_id: z.string().uuid(), action: z.enum(["opened", "filtered", "exported"]), metadata: z.record(z.string(), z.unknown()).default({}) });
export const analysisFiltersSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25), offset: z.coerce.number().int().min(0).default(0), source_id: z.string().max(128).optional(),
  stage: z.string().max(128).optional(), technique: z.string().max(128).optional(), min_confidence: z.coerce.number().min(0).max(1).optional(), max_confidence: z.coerce.number().min(0).max(1).optional(),
  from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional(), search: z.string().max(128).optional(),
  sort: z.enum(["created_at", "started_at", "confidence"]).default("created_at"), order: z.enum(["asc", "desc"]).default("desc"),
}).refine((value) => value.min_confidence === undefined || value.max_confidence === undefined || value.min_confidence <= value.max_confidence, { message: "min_confidence must be <= max_confidence" });
export const ingestTokenSchema = z.object({ name: z.string().trim().min(1).max(80) });
export type IngestInput = z.infer<typeof ingestSchema>;
export type NormalizedEvent = z.infer<typeof eventSchema>;
export type AttackTrace = z.infer<typeof attackTraceSchema>;
export type HistoryInput = z.infer<typeof historySchema>;
export type AnalysisFilters = z.infer<typeof analysisFiltersSchema>;
