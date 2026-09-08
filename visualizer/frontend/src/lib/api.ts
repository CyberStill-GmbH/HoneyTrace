import type { AnalysisDetail, AnalysisList, GraphData, IngestToken, Stats, User } from "../types";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

let refreshPromise: Promise<boolean> | null = null;
async function refreshSession() {
  refreshPromise ??= fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" })
    .then((response) => response.ok).catch(() => false).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
  });
  if (response.status === 401 && retry && path !== "/api/auth/refresh" && await refreshSession()) return request<T>(path, init, false);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(response.status, body?.error?.code ?? "REQUEST_FAILED", body?.error?.message ?? "No se pudo completar la solicitud");
  }
  if (response.status === 204) return undefined as T;
  return (await response.json() as { data: T }).data;
}

export const api = {
  me: () => request<User>("/api/v1/me"),
  stats: () => request<Stats>("/api/v1/stats"),
  analyses: (params = new URLSearchParams()) => request<AnalysisList>(`/api/v1/analyses?${params}`),
  analysis: (id: string) => request<AnalysisDetail>(`/api/v1/analyses/${encodeURIComponent(id)}`),
  graph: (id: string) => request<GraphData>(`/api/v1/analyses/${encodeURIComponent(id)}/graph`),
  record: (analysisId: string, action: "opened" | "filtered" | "exported", metadata: Record<string, unknown> = {}) => request<{ recorded: true }>("/api/v1/visualization-history", { method: "POST", body: JSON.stringify({ analysis_id: analysisId, action, metadata }) }),
  tokens: () => request<IngestToken[]>("/api/v1/ingest-tokens"),
  createToken: (name: string) => request<IngestToken>("/api/v1/ingest-tokens", { method: "POST", body: JSON.stringify({ name }) }),
  revokeToken: (id: string) => request<void>(`/api/v1/ingest-tokens/${encodeURIComponent(id)}`, { method: "DELETE" }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }, false),
  loginUrl: (returnTo = "/") => `${API_URL}/api/auth/github/redirect?returnTo=${encodeURIComponent(returnTo)}`,
  exportUrl: (id: string, format: "json" | "ndjson") => `${API_URL}/api/v1/analyses/${encodeURIComponent(id)}/export?format=${format}`,
};
