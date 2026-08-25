import type { AddressInfo } from "node:net";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../visualizer/backend/src/app.js";
import { PrismaRepository } from "../../visualizer/backend/src/db/repository.js";

const databaseUrl = process.env.VISUALIZER_E2E_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("Visualizer API E2E con PostgreSQL", () => {
  let prisma: PrismaClient;
  let repository: PrismaRepository;
  let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
  let baseUrl: string;
  let userId: string;

  beforeAll(async () => {
    const databaseName = new URL(databaseUrl!).pathname.toLowerCase();
    if (!databaseName.includes("e2e")) throw new Error("VISUALIZER_E2E_DATABASE_URL must point to a dedicated database whose name contains 'e2e'");
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    repository = new PrismaRepository(prisma);
    await prisma.$queryRaw`SELECT 1`;
    const app = createApp(repository);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  });

  it("recorre sesión, token de dispositivo, ingestión, consulta, grafo, stats, exportación y persistencia", async () => {
    const session = await repository.createOAuthSession(`e2e-${Date.now()}`, "e2e-analyst");
    const user = await repository.findAccessSession(session.accessToken); userId = user!.id;

    const tokenResponse = await fetch(`${baseUrl}/api/v1/ingest-tokens`, { method: "POST", headers: { authorization: `Bearer ${session.accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ name: "e2e-device" }) });
    expect(tokenResponse.status).toBe(201); const device = (await tokenResponse.json() as any).data;
    const body = {
      source_id: "e2e-rpi", schema_version: "1.1",
      trace: { trace_id: "e2e-trace", started_at: "2026-08-25T10:00:00.000Z", ended_at: "2026-08-25T10:00:01.000Z", stages: ["products-sqli"], event_ids: ["e1", "e2"], techniques: ["HT-SQLI"], confidence: 0.9, evidence: [{ event_id: "e2", reason: "SQL injection signal" }] },
      events: [
        { schema_version: "1.1", trace_id: "e2e-trace", event_id: "e1", timestamp: "2026-08-25T10:00:00.000Z", sequence: 1, event_type: "HTTP_REQUEST", raw_source: "honeypot", method: "GET", path: "/products", entities: [], causes: [], metadata: {} },
        { schema_version: "1.1", trace_id: "e2e-trace", event_id: "e2", timestamp: "2026-08-25T10:00:01.000Z", sequence: 2, event_type: "SQLI_ATTEMPT", raw_source: "honeypot", vulnerability: "sqli", entities: [], causes: ["e1"], metadata: { query: "redacted" } },
      ],
    };
    const ingest = await fetch(`${baseUrl}/api/v1/analyses/ingest`, { method: "POST", headers: { authorization: `Bearer ${device.token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    expect(ingest.status).toBe(201); const analysis = (await ingest.json() as any).data;
    const auth = { authorization: `Bearer ${session.accessToken}` };
    expect((await fetch(`${baseUrl}/api/v1/me`, { headers: auth })).status).toBe(200);
    const list = await fetch(`${baseUrl}/api/v1/analyses?technique=HT-SQLI&source_id=e2e-rpi`, { headers: auth }); expect((await list.json() as any).data.total).toBe(1);
    const graph = await fetch(`${baseUrl}/api/v1/analyses/${analysis.id}/graph`, { headers: auth }); expect((await graph.json() as any).data.edges[0].relationship).toBe("causes");
    const stats = await fetch(`${baseUrl}/api/v1/stats`, { headers: auth }); expect((await stats.json() as any).data.by_technique["HT-SQLI"]).toBe(1);
    const exported = await fetch(`${baseUrl}/api/v1/analyses/${analysis.id}/export?format=ndjson`, { headers: auth }); expect(exported.headers.get("content-type")).toContain("application/x-ndjson");
    expect(await prisma.analysis.count({ where: { userId, traceId: "e2e-trace" } })).toBe(1);
  });
});
