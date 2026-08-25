import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { MemoryRepository } from "../../src/db/repository.js";
import { analysisPayload } from "../fixtures.js";

async function account(repository: MemoryRepository, githubId: string) {
  const session = await repository.createOAuthSession(githubId, `user-${githubId}`);
  const user = await repository.findAccessSession(session.accessToken);
  return { session, user: user! };
}

describe("Visualizer API integration", () => {
  it("expone health y errores seguros de autenticación", async () => {
    const app = createApp(new MemoryRepository());
    expect((await request(app).get("/health")).body).toEqual({ status: "ok", service: "visualizer-api" });
    expect((await request(app).get("/api/auth/github/redirect")).status).toBe(503);
    expect((await request(app).get("/api/auth/github/callback?state=invalid")).status).toBe(400);
    expect((await request(app).post("/api/auth/refresh")).status).toBe(401);
    expect((await request(app).post("/api/auth/logout")).status).toBe(204);
  });

  it("exige autenticación en todas las consultas privadas", async () => {
    const app = createApp(new MemoryRepository());
    for (const path of ["/api/v1/me", "/api/v1/stats", "/api/v1/analyses", "/api/v1/ingest-tokens"]) {
      expect((await request(app).get(path)).status, path).toBe(401);
    }
  });

  it("administra tokens de dispositivo y rechaza tokens revocados", async () => {
    const repository = new MemoryRepository(); const app = createApp(repository); const owner = await account(repository, "1");
    const created = await request(app).post("/api/v1/ingest-tokens").set("Authorization", `Bearer ${owner.session.accessToken}`).send({ name: "rpi principal" });
    expect(created.status).toBe(201); expect(created.body.data.token).toMatch(/^ht_ingest_/);
    const listed = await request(app).get("/api/v1/ingest-tokens").set("Authorization", `Bearer ${owner.session.accessToken}`);
    expect(listed.body.data[0]).not.toHaveProperty("token");
    expect((await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${created.body.data.token}`).send(analysisPayload())).status).toBe(201);
    expect((await request(app).delete(`/api/v1/ingest-tokens/${created.body.data.id}`).set("Authorization", `Bearer ${owner.session.accessToken}`)).status).toBe(204);
    expect((await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${created.body.data.token}`).send(analysisPayload())).status).toBe(401);
  });

  it("mantiene privacidad total entre cuentas incluso con IDs conocidos", async () => {
    const repository = new MemoryRepository(); const app = createApp(repository);
    const owner = await account(repository, "1"), stranger = await account(repository, "2");
    const device = await repository.createIngestToken(owner.user.id, "rpi");
    const ingest = await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${device.token}`).send(analysisPayload()); const id = ingest.body.data.id;
    expect((await request(app).get("/api/v1/analyses").set("Authorization", `Bearer ${stranger.session.accessToken}`)).body.data.total).toBe(0);
    for (const suffix of ["", "/graph", "/export"]) expect((await request(app).get(`/api/v1/analyses/${id}${suffix}`).set("Authorization", `Bearer ${stranger.session.accessToken}`)).status).toBe(404);
    expect((await request(app).post("/api/v1/visualization-history").set("Authorization", `Bearer ${stranger.session.accessToken}`).send({ analysis_id: id, action: "opened" })).status).toBe(404);
  });

  it("aplica filtros server-side, paginación y estadísticas de la cuenta", async () => {
    const repository = new MemoryRepository(); const app = createApp(repository); const owner = await account(repository, "1"); const device = await repository.createIngestToken(owner.user.id, "rpi");
    await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${device.token}`).send(analysisPayload());
    const other = analysisPayload({ source_id: "pc-lab", trace: { ...analysisPayload().trace, trace_id: "trace-sqli", stages: ["products-sqli"], techniques: ["HT-SQLI"], confidence: 0.4 }, events: analysisPayload().events.map((event) => ({ ...event, trace_id: "trace-sqli" })) });
    await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${device.token}`).send(other);
    const auth = { Authorization: `Bearer ${owner.session.accessToken}` };
    expect((await request(app).get("/api/v1/analyses?technique=T1110&min_confidence=.7&search=trace-1").set(auth)).body.data.total).toBe(1);
    expect((await request(app).get("/api/v1/analyses?stage=products-sqli&source_id=pc-lab").set(auth)).body.data.items[0].trace_id).toBe("trace-sqli");
    expect((await request(app).get("/api/v1/analyses?limit=1&offset=1").set(auth)).body.data.items).toHaveLength(1);
    const stats = await request(app).get("/api/v1/stats").set(auth);
    expect(stats.body.data).toMatchObject({ total: 2, by_source: { "rpi-lab": 1, "pc-lab": 1 }, by_technique: { T1110: 1, "HT-SQLI": 1 } });
    expect((await request(app).get("/api/v1/analyses?limit=101").set(auth)).status).toBe(400);
    expect((await request(app).get("/api/v1/analyses?min_confidence=.9&max_confidence=.1").set(auth)).status).toBe(400);
  });

  it("construye grafo causal y secuencial, conserva eventos y exporta JSON/NDJSON", async () => {
    const repository = new MemoryRepository(); const app = createApp(repository); const owner = await account(repository, "1"); const device = await repository.createIngestToken(owner.user.id, "rpi");
    const payload = analysisPayload();
    payload.trace.event_ids.push("evt-3"); payload.trace.ended_at = "2026-08-22T10:00:02.000Z";
    payload.events.push({ ...payload.events[1]!, event_id: "evt-3", sequence: 3, timestamp: "2026-08-22T10:00:02.000Z", causes: [] });
    const ingest = await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${device.token}`).send(payload); const id = ingest.body.data.id;
    const auth = { Authorization: `Bearer ${owner.session.accessToken}` };
    const detail = await request(app).get(`/api/v1/analyses/${id}`).set(auth);
    expect(detail.body.data.events[0]).toMatchObject({ source_ip: "10.0.0.7", method: "POST", entities: [{ id: "/auth", kind: "endpoint" }] });
    const graph = await request(app).get(`/api/v1/analyses/${id}/graph`).set(auth);
    expect(graph.body.data.edges).toEqual([
      { id: "evt-1->evt-2", source: "evt-1", target: "evt-2", relationship: "causes" },
      { id: "evt-2->evt-3", source: "evt-2", target: "evt-3", relationship: "sequence" },
    ]);
    const json = await request(app).get(`/api/v1/analyses/${id}/export`).set(auth);
    expect(json.headers["content-disposition"]).toContain("honeytrace-trace-1.json"); expect(json.body.analysis.events).toHaveLength(3);
    const ndjson = await request(app).get(`/api/v1/analyses/${id}/export?format=ndjson`).set(auth);
    expect(ndjson.headers["content-type"]).toContain("application/x-ndjson"); expect(ndjson.text.trim().split("\n")).toHaveLength(4);
  });

  it("valida ingestión, historial, origen y estados inexistentes", async () => {
    const repository = new MemoryRepository(); const app = createApp(repository); const owner = await account(repository, "1"); const device = await repository.createIngestToken(owner.user.id, "rpi");
    expect((await request(app).post("/api/v1/analyses/ingest").send(analysisPayload())).status).toBe(401);
    expect((await request(app).post("/api/v1/analyses/ingest").set("Authorization", `Bearer ${device.token}`).send({})).status).toBe(400);
    expect((await request(app).post("/api/v1/ingest-tokens").set("Authorization", `Bearer ${owner.session.accessToken}`).send({ name: "" })).status).toBe(400);
    expect((await request(app).post("/api/v1/visualization-history").set("Authorization", `Bearer ${owner.session.accessToken}`).send({ analysis_id: "bad", action: "unknown" })).status).toBe(400);
    expect((await request(app).post("/api/auth/refresh").set("Origin", "https://attacker.example").set("Cookie", `honeytrace_refresh=${owner.session.refreshToken}`)).status).toBe(403);
    expect((await request(app).get("/api/v1/analyses/00000000-0000-0000-0000-000000000000").set("Authorization", `Bearer ${owner.session.accessToken}`)).status).toBe(404);
  });

  it("renueva la sesión, invalida el refresh anterior y cierra sesión", async () => {
    const repository = new MemoryRepository(); const app = createApp(repository); const owner = await account(repository, "1");
    const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", `honeytrace_refresh=${owner.session.refreshToken}`);
    expect(refreshed.status).toBe(200); expect(refreshed.headers["set-cookie"]?.join(";")).toContain("HttpOnly");
    expect((await request(app).post("/api/auth/refresh").set("Cookie", `honeytrace_refresh=${owner.session.refreshToken}`)).status).toBe(401);
    const accessCookie = (refreshed.headers["set-cookie"] as unknown as string[]).find((cookie) => cookie.startsWith("honeytrace_access="))!;
    expect((await request(app).get("/api/v1/me").set("Cookie", accessCookie)).body.data.username).toBe("user-1");
    expect((await request(app).post("/api/auth/logout").set("Cookie", refreshed.headers["set-cookie"] as unknown as string[])).status).toBe(204);
    expect((await request(app).get("/api/v1/me").set("Cookie", accessCookie)).status).toBe(401);
  });
});
