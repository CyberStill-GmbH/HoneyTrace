import { describe, expect, it } from "vitest";
import { analysisFiltersSchema, ingestSchema } from "../../src/types.js";
import { analysisPayload } from "../fixtures.js";

describe("contratos del visualizador", () => {
  it("acepta y conserva todos los campos de NormalizedEvent", () => {
    const parsed = ingestSchema.parse(analysisPayload());
    expect(parsed.events[0]).toMatchObject({ method: "POST", path: "/auth", status_code: 401, duration_ms: 4.2 });
    expect(parsed.events[1]).toMatchObject({ session_id: "session-1", user_id: "synthetic-user", causes: ["evt-1"], payload_size: 42 });
  });

  it("rechaza referencias a eventos inexistentes y trace_id inconsistente", () => {
    const missing = analysisPayload(); missing.trace.event_ids.push("missing");
    expect(ingestSchema.safeParse(missing).success).toBe(false);
    const mismatch = analysisPayload(); mismatch.events[0]!.trace_id = "another-trace";
    expect(ingestSchema.safeParse(mismatch).success).toBe(false);
  });

  it("rechaza hashes, estados HTTP y límites inválidos", () => {
    const invalid = analysisPayload(); invalid.events[1]!.payload_sha256 = "not-a-hash"; invalid.events[0]!.status_code = 99;
    expect(ingestSchema.safeParse(invalid).success).toBe(false);
    expect(ingestSchema.safeParse({ ...analysisPayload(), events: Array.from({ length: 10_001 }, () => analysisPayload().events[0]) }).success).toBe(false);
  });

  it("normaliza filtros y valida rangos", () => {
    expect(analysisFiltersSchema.parse({ limit: "25", offset: "3" })).toMatchObject({ limit: 25, offset: 3, sort: "created_at", order: "desc" });
    expect(analysisFiltersSchema.safeParse({ limit: "1000" }).success).toBe(false);
    expect(analysisFiltersSchema.safeParse({ min_confidence: ".9", max_confidence: ".2" }).success).toBe(false);
    expect(analysisFiltersSchema.safeParse({ from: "not-a-date" }).success).toBe(false);
  });
});
