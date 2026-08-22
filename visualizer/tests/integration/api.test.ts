import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { MemoryRepository } from "../../src/db/repository.js";

const payload = { source_id: "rpi-lab", schema_version: "1.1", trace: { trace_id: "trace-1", started_at: "2026-08-22T10:00:00.000Z", ended_at: "2026-08-22T10:00:01.000Z", stages: ["auth-brute-force"], event_ids: ["evt-1"], techniques: ["T1110"], confidence: 0.75, evidence: [{ event_id: "evt-1", reason: "repeated failures", source: "honeypot" }] }, events: [{ event_id: "evt-1", timestamp: "2026-08-22T10:00:00.000Z", sequence: 1, event_type: "AUTH_FAILURE", raw_source: "honeypot", payload: { username: "analyst" } }] };

describe("Visualizer API", () => {
  it("ingesta de forma autenticada y devuelve análisis para el panel", async () => {
    const app = createApp(new MemoryRepository());
    const ingest = await request(app).post("/api/v1/analyses/ingest").set("Authorization", "Bearer development-ingest-token-change-me").send(payload);
    expect(ingest.status).toBe(201);
    expect(ingest.body.data.raw_trace.trace_id).toBe("trace-1");
    const list = await request(app).get("/api/v1/analyses");
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
  });

  it("rechaza ingestión sin token y payload inválido", async () => {
    const app = createApp(new MemoryRepository());
    expect((await request(app).post("/api/v1/analyses/ingest").send(payload)).status).toBe(401);
    expect((await request(app).post("/api/v1/analyses/ingest").set("Authorization", "Bearer development-ingest-token-change-me").send({})).status).toBe(400);
  });
});
