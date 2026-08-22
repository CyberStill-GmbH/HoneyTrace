import { z } from "zod";

export const evidenceSchema = z.object({ event_id: z.string().min(1), reason: z.string().min(1), source: z.string().optional() });
export const eventSchema = z.object({
  event_id: z.string().min(1), timestamp: z.string().datetime({ offset: true }), sequence: z.number().int().nonnegative(),
  event_type: z.string().min(1), raw_source: z.string().min(1), payload: z.record(z.string(), z.unknown()).default({}),
});
export const attackTraceSchema = z.object({
  trace_id: z.string().min(1), started_at: z.string().datetime({ offset: true }), ended_at: z.string().datetime({ offset: true }),
  stages: z.array(z.string()), event_ids: z.array(z.string()), techniques: z.array(z.string()), confidence: z.number().min(0).max(1), evidence: z.array(evidenceSchema),
});
export const ingestSchema = z.object({ source_id: z.string().min(1).max(128), schema_version: z.string().min(1), trace: attackTraceSchema, events: z.array(eventSchema).max(10_000) });
export const historySchema = z.object({ analysis_id: z.string().uuid(), action: z.enum(["opened", "filtered", "exported"]), metadata: z.record(z.string(), z.unknown()).default({}) });
export type IngestInput = z.infer<typeof ingestSchema>;
export type AttackTrace = z.infer<typeof attackTraceSchema>;
export type HistoryInput = z.infer<typeof historySchema>;
