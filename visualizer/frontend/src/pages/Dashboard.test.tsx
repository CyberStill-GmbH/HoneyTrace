import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { Dashboard } from "./Dashboard";

vi.mock("../lib/api", () => ({
  api: {
    stats: vi.fn(),
    analyses: vi.fn(),
    analysis: vi.fn(),
  },
}));

describe("Dashboard", () => {
  afterEach(cleanup);
  it("integra estadísticas privadas y el estado sin análisis", async () => {
    vi.mocked(api.stats).mockResolvedValue({
      total: 0,
      recent_24h: 0,
      average_confidence: 0,
      by_source: {},
      by_stage: {},
      by_technique: {},
    });
    vi.mocked(api.analyses).mockResolvedValue({ items: [], total: 0 });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Aún no hay actividad")).toBeInTheDocument();
    expect(screen.getByText("Sin fuentes")).toBeInTheDocument();
    expect(api.stats).toHaveBeenCalledOnce();
    expect(api.analyses).toHaveBeenCalledOnce();
  });

  it("hereda la clasificación del análisis aunque el último evento sea HTTP genérico", async () => {
    const summary = {
      id: "analysis-sqli", source_id: "pc-laboratorio", trace_id: "trace-sqli", confidence: 0.5,
      stages: ["products-sqli"], techniques: ["HT-SQLI"], created_at: "2026-09-09T17:00:00Z",
      started_at: "2026-09-09T17:00:00Z", ended_at: "2026-09-09T17:00:01Z",
    };
    vi.mocked(api.stats).mockResolvedValue({ total: 1, recent_24h: 1, average_confidence: 0.5, by_source: { "pc-laboratorio": 1 }, by_stage: { "products-sqli": 1 }, by_technique: { "HT-SQLI": 1 } });
    vi.mocked(api.analyses).mockResolvedValue({ items: [summary], total: 1 });
    vi.mocked(api.analysis).mockResolvedValue({
      ...summary, schema_version: "1.1", evidence: [], raw_trace: { trace_id: "trace-sqli", started_at: summary.started_at, ended_at: summary.ended_at, stages: summary.stages, techniques: summary.techniques, confidence: .5, event_ids: ["evt-http"], evidence: [] },
      events: [{ schema_version: "1.1", event_id: "evt-http", trace_id: "trace-sqli", timestamp: summary.ended_at, sequence: 2, event_type: "HTTP_REQUEST", raw_source: "honeypot-api", source_ip: "172.22.0.1", path: "/products", entities: [], causes: [], metadata: {} }],
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><Dashboard /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findAllByText("Inyección SQL")).toHaveLength(2);
    expect(screen.getByText("Respuesta HTTP · sin resultado adicional")).toBeInTheDocument();
    expect(screen.queryByText("Sin clasificar")).not.toBeInTheDocument();
  });
});
