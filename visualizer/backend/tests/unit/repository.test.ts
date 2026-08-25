import { describe, expect, it } from "vitest";
import { MemoryRepository } from "../../src/db/repository.js";
import { analysisFiltersSchema } from "../../src/types.js";
import { analysisPayload } from "../fixtures.js";

describe("MemoryRepository", () => {
  it("rota sesiones una sola vez y permite revocarlas", async () => {
    const repository = new MemoryRepository();
    const first = await repository.createOAuthSession("42", "analyst");
    const rotated = await repository.rotateSession(first.refreshToken);
    expect(rotated).not.toBeNull();
    expect(await repository.findAccessSession(first.accessToken)).toBeNull();
    expect(await repository.rotateSession(first.refreshToken)).toBeNull();
    await repository.revokeSession(rotated!.accessToken, rotated!.refreshToken);
    expect(await repository.findAccessSession(rotated!.accessToken)).toBeNull();
  });

  it("crea, resuelve y revoca tokens de ingestión por propietario", async () => {
    const repository = new MemoryRepository();
    const session = await repository.createOAuthSession("42", "analyst"); const user = await repository.findAccessSession(session.accessToken);
    const token = await repository.createIngestToken(user!.id, "rpi principal");
    expect(await repository.findIngestOwner(token.token)).toBe(user!.id);
    expect((await repository.listIngestTokens(user!.id))[0]).not.toHaveProperty("token");
    expect(await repository.revokeIngestToken(user!.id, token.id)).toBe(true);
    expect(await repository.findIngestOwner(token.token)).toBeNull();
  });

  it("actualiza duplicados, filtra, ordena y calcula estadísticas", async () => {
    const repository = new MemoryRepository(); const userId = "user-1";
    const first = await repository.ingest(userId, analysisPayload());
    const updated = await repository.ingest(userId, analysisPayload({ trace: { ...analysisPayload().trace, confidence: 0.95 } }));
    expect(updated.id).toBe(first.id);
    const secondPayload = analysisPayload({ source_id: "pc-lab", trace: { ...analysisPayload().trace, trace_id: "trace-2", confidence: 0.4 }, events: analysisPayload().events.map((event) => ({ ...event, trace_id: "trace-2" })) });
    await repository.ingest(userId, secondPayload);
    const filters = analysisFiltersSchema.parse({ source_id: "rpi-lab", min_confidence: ".9", sort: "confidence", order: "desc" });
    expect((await repository.listAnalyses(userId, filters)).items.map((item) => item.trace_id)).toEqual(["trace-1"]);
    const stats = await repository.getStats(userId);
    expect(stats.total).toBe(2); expect(stats.by_source).toEqual({ "rpi-lab": 1, "pc-lab": 1 }); expect(stats.average_confidence).toBeCloseTo(0.675);
  });
});
