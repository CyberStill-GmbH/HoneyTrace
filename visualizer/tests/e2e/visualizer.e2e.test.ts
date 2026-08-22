import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { MemoryRepository } from "../../src/db/repository.js";

describe("flujo E2E del visualizador", () => {
  it("ingesta, consulta grafo, registra historial y revoca sesión", async () => {
    const repository = new MemoryRepository();
    const app = createApp(repository);
    const session = await repository.createOAuthSession("42", "analyst");
    const body = { source_id: "engine-rpi", schema_version: "1.1", trace: { trace_id: "e2e-trace", started_at: "2026-08-22T10:00:00.000Z", ended_at: "2026-08-22T10:00:02.000Z", stages: ["products-sqli"], event_ids: ["e1"], techniques: ["HT-SQLI"], confidence: 0.9, evidence: [{ event_id: "e1", reason: "decoy rows" }] }, events: [{ event_id: "e1", timestamp: "2026-08-22T10:00:00.000Z", sequence: 1, event_type: "SQLI_ATTEMPT", raw_source: "engine", payload: { rows: 3 } }] };
    const ingested = await request(app).post("/api/v1/analyses/ingest").set("Authorization", "Bearer development-ingest-token-change-me").send(body);
    const id = ingested.body.data.id as string;
    expect((await request(app).get(`/api/v1/analyses/${id}/graph`)).body.data.nodes).toHaveLength(1);
    expect((await request(app).post("/api/v1/visualization-history").set("Authorization", `Bearer ${session}`).send({ analysis_id: id, action: "opened" })).status).toBe(201);
    expect((await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${session}`)).status).toBe(204);
    expect((await request(app).post("/api/v1/visualization-history").set("Authorization", `Bearer ${session}`).send({ analysis_id: id, action: "opened" })).status).toBe(401);
  });
});
