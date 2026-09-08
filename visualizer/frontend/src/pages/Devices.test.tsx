import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { Devices } from "./Devices";

vi.mock("../lib/api", () => ({
  api: {
    tokens: vi.fn(),
    createToken: vi.fn(),
    revokeToken: vi.fn(),
  },
}));

const token = { id: "token-1", name: "Raspberry laboratorio", token_hint: "ab12", created_at: "2026-09-08T10:00:00Z" };
const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><Devices /></QueryClientProvider>);
};

describe("Devices", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.tokens).mockResolvedValue([token]);
    vi.mocked(api.revokeToken).mockResolvedValue(undefined);
  });

  it("exige escribir el nombre exacto antes de permitir eliminar", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: `Eliminar ${token.name}` }));

    const confirm = screen.getByRole("button", { name: "Eliminar token" });
    const input = screen.getByLabelText("Nombre del token");
    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: "Raspberry" } });
    expect(confirm).toBeDisabled();
    expect(screen.getByText("El nombre todavía no coincide.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: token.name } });
    expect(confirm).toBeEnabled();
    expect(api.revokeToken).not.toHaveBeenCalled();
  });

  it("confirma visualmente que el token recién creado fue copiado", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.mocked(api.createToken).mockResolvedValue({ ...token, token: "ht_ingest_demo" });
    renderPage();

    fireEvent.change(screen.getByLabelText("Nombre del dispositivo"), { target: { value: "Engine local" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear token" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copiar token" }));

    expect(await screen.findByRole("button", { name: "Token copiado" })).toHaveTextContent("Copiada");
    expect(writeText).toHaveBeenCalledWith("ht_ingest_demo");
  });
});
