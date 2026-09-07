import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { Login } from "./Login";

vi.mock("../lib/api", () => ({
  api: {
    me: vi.fn(),
    loginUrl: vi.fn(() => "http://localhost:8080/api/auth/github/redirect?returnTo=%2F"),
  },
}));

describe("Login", () => {
  it("presenta la marca y el acceso con GitHub sin detalles técnicos de sesión", async () => {
    vi.mocked(api.me).mockRejectedValue(new Error("sin sesión"));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/login"]}>
          <Login />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("img", { name: "HoneyTrace" })).toHaveAttribute("src", "/honeytrace-logo.svg");
    expect(await screen.findByRole("link", { name: /continuar con github/i })).toHaveAttribute("href", expect.stringContaining("/api/auth/github/redirect"));
    expect(screen.queryByText(/httponly/i)).not.toBeInTheDocument();
  });
});
