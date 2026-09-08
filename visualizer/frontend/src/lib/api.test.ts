import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

afterEach(() => vi.restoreAllMocks());
describe("cliente API", () => {
  it("envía cookies y devuelve data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { total: 2 } }), { status: 200, headers: { "content-type": "application/json" } }));
    expect((await api.stats()).total).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/v1/stats"), expect.objectContaining({ credentials: "include" }));
  });
  it("renueva una sesión expirada y repite la consulta una vez", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { refreshed: true } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "u1", github_id: "1", username: "ana" } }), { status: 200 }));
    expect((await api.me()).username).toBe("ana");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("expone errores tipados cuando falla la API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "analysis not found" } }), { status: 404 }));
    await expect(api.analysis("missing")).rejects.toEqual(expect.objectContaining({ status: 404, code: "NOT_FOUND" }));
  });
});
