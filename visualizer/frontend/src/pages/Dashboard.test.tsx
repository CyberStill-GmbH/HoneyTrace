import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
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
});
