import type { IngestInput } from "../src/types.js";

export function analysisPayload(overrides: Partial<IngestInput> = {}): IngestInput {
  const base: IngestInput = {
    source_id: "rpi-lab",
    schema_version: "1.1",
    trace: {
      trace_id: "trace-1",
      started_at: "2026-08-22T10:00:00.000Z",
      ended_at: "2026-08-22T10:00:01.000Z",
      stages: ["auth-brute-force"],
      event_ids: ["evt-1", "evt-2"],
      techniques: ["T1110"],
      confidence: 0.75,
      evidence: [{ event_id: "evt-2", reason: "repeated failures", source: "honeypot" }],
    },
    events: [
      {
        schema_version: "1.1", trace_id: "trace-1", event_id: "evt-1", timestamp: "2026-08-22T10:00:00.000Z", sequence: 1,
        event_type: "HTTP_REQUEST", raw_source: "honeypot", source_ip: "10.0.0.7", method: "POST", path: "/auth", status_code: 401,
        duration_ms: 4.2, user_agent: "test-agent", entities: [{ id: "/auth", kind: "endpoint" }], causes: [], metadata: { username: "analyst" },
      },
      {
        schema_version: "1.1", trace_id: "trace-1", event_id: "evt-2", timestamp: "2026-08-22T10:00:01.000Z", sequence: 2,
        event_type: "AUTH_FAILURE", raw_source: "honeypot", source_ip: "10.0.0.7", session_id: "session-1", user_id: "synthetic-user",
        vulnerability: "brute_force", outcome: "failure", payload_sha256: "a".repeat(64), payload_size: 42,
        entities: [{ id: "synthetic-user", kind: "user", role: "target" }], causes: ["evt-1"], metadata: { attempt: 3 },
      },
    ],
  };
  return { ...base, ...overrides };
}
