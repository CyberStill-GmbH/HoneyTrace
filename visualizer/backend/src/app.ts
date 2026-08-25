import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config.js";
import { createOAuthState, verifyOAuthState } from "./auth/oauth.js";
import { analysisFiltersSchema, historySchema, ingestSchema, ingestTokenSchema } from "./types.js";
import type { AuthTokens, Repository, User } from "./db/repository.js";

type AuthenticatedRequest = Request & { user?: User; accessToken?: string };
const ACCESS_COOKIE = "honeytrace_access";
const REFRESH_COOKIE = "honeytrace_refresh";
const jsonError = (res: Response, status: number, code: string, message: string, details?: unknown) => res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
const bearer = (req: Request) => req.header("authorization")?.replace(/^Bearer\s+/i, "");
const cookieBase = { httpOnly: true, sameSite: config.COOKIE_SAME_SITE, secure: config.COOKIE_SECURE, path: "/" };
const setSessionCookies = (res: Response, tokens: AuthTokens) => {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...cookieBase, maxAge: config.ACCESS_TOKEN_TTL_MINUTES * 60_000 });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...cookieBase, maxAge: config.SESSION_TTL_DAYS * 86_400_000 });
};
const clearSessionCookies = (res: Response) => { res.clearCookie(ACCESS_COOKIE, cookieBase); res.clearCookie(REFRESH_COOKIE, cookieBase); };

export function createApp(repository: Repository) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.FRONTEND_URL, credentials: true, methods: ["GET", "POST", "DELETE", "OPTIONS"] }));
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.header("origin");
    if (origin && origin !== new URL(config.FRONTEND_URL).origin) return jsonError(res, 403, "INVALID_ORIGIN", "request origin is not allowed");
    next();
  });
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "visualizer-api" }));

  app.post("/api/v1/analyses/ingest", async (req, res, next) => { try {
    const token = bearer(req); const userId = token ? await repository.findIngestOwner(token) : null;
    if (!userId) return jsonError(res, 401, "UNAUTHORIZED", "a valid account ingest token is required");
    const parsed = ingestSchema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 400, "INVALID_ANALYSIS", "analysis payload does not match the contract", parsed.error.flatten());
    return res.status(201).json({ data: await repository.ingest(userId, parsed.data) });
  } catch (error) { next(error); } });

  app.get("/api/auth/github/redirect", (req, res) => {
    if (!config.GITHUB_CLIENT_ID) return jsonError(res, 503, "OAUTH_NOT_CONFIGURED", "GitHub OAuth is not configured");
    const state = createOAuthState(typeof req.query.returnTo === "string" ? req.query.returnTo : undefined);
    res.cookie("honeytrace_oauth_state", state, { ...cookieBase, maxAge: 10 * 60_000 });
    const params = new URLSearchParams({ client_id: config.GITHUB_CLIENT_ID, redirect_uri: config.GITHUB_CALLBACK_URL, scope: "read:user user:email", state });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  app.get("/api/auth/github/callback", async (req, res, next) => { try {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const { returnTo } = verifyOAuthState(state, req.cookies.honeytrace_oauth_state ?? "");
    res.clearCookie("honeytrace_oauth_state", cookieBase);
    if (!config.GITHUB_CLIENT_SECRET) return jsonError(res, 503, "OAUTH_NOT_CONFIGURED", "GitHub OAuth is not configured");
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ client_id: config.GITHUB_CLIENT_ID, client_secret: config.GITHUB_CLIENT_SECRET, code: req.query.code }) });
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return jsonError(res, 401, "OAUTH_FAILED", "GitHub token exchange failed");
    const profileResponse = await fetch("https://api.github.com/user", { headers: { authorization: `Bearer ${token.access_token}`, accept: "application/vnd.github+json", "user-agent": "honeytrace-visualizer" } });
    if (!profileResponse.ok) return jsonError(res, 401, "OAUTH_FAILED", "GitHub profile lookup failed");
    const profile = await profileResponse.json() as { id: number; login: string; avatar_url?: string };
    setSessionCookies(res, await repository.createOAuthSession(String(profile.id), profile.login, profile.avatar_url));
    return res.redirect(new URL(returnTo, config.FRONTEND_URL).toString());
  } catch (error) { if (error instanceof Error && error.message === "INVALID_OAUTH_STATE") return jsonError(res, 400, "INVALID_OAUTH_STATE", "OAuth state is invalid or expired"); next(error); } });

  app.post("/api/auth/refresh", async (req, res, next) => { try {
    const refreshToken = req.cookies[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) return jsonError(res, 401, "UNAUTHORIZED", "refresh session is required");
    const tokens = await repository.rotateSession(refreshToken);
    if (!tokens) { clearSessionCookies(res); return jsonError(res, 401, "SESSION_EXPIRED", "session has expired"); }
    setSessionCookies(res, tokens); return res.json({ data: { refreshed: true } });
  } catch (error) { next(error); } });

  app.post("/api/auth/logout", async (req, res, next) => { try {
    await repository.revokeSession(bearer(req) ?? req.cookies[ACCESS_COOKIE], req.cookies[REFRESH_COOKIE]); clearSessionCookies(res); return res.status(204).send();
  } catch (error) { next(error); } });

  app.use("/api/v1", async (req: AuthenticatedRequest, res, next) => { try {
    req.accessToken = bearer(req) ?? req.cookies[ACCESS_COOKIE];
    req.user = req.accessToken ? (await repository.findAccessSession(req.accessToken)) ?? undefined : undefined;
    if (!req.user) return jsonError(res, 401, "UNAUTHORIZED", "login required");
    next();
  } catch (error) { next(error); } });

  app.get("/api/v1/me", (req: AuthenticatedRequest, res) => res.json({ data: req.user }));
  app.get("/api/v1/analyses", async (req: AuthenticatedRequest, res, next) => { try {
    const parsed = analysisFiltersSchema.safeParse(req.query);
    if (!parsed.success) return jsonError(res, 400, "INVALID_FILTERS", "invalid analysis filters", parsed.error.flatten());
    return res.json({ data: await repository.listAnalyses(req.user!.id, parsed.data) });
  } catch (error) { next(error); } });
  app.get("/api/v1/stats", async (req: AuthenticatedRequest, res, next) => { try { return res.json({ data: await repository.getStats(req.user!.id) }); } catch (error) { next(error); } });
  app.get("/api/v1/analyses/:id", async (req: AuthenticatedRequest, res, next) => { try { const detail = await repository.getAnalysis(req.user!.id, req.params.id as string); return detail ? res.json({ data: detail }) : jsonError(res, 404, "NOT_FOUND", "analysis not found"); } catch (error) { next(error); } });
  app.get("/api/v1/analyses/:id/graph", async (req: AuthenticatedRequest, res, next) => { try {
    const detail = await repository.getAnalysis(req.user!.id, req.params.id as string); if (!detail) return jsonError(res, 404, "NOT_FOUND", "analysis not found");
    const ids = new Set(detail.events.map((event) => event.event_id));
    const nodes = detail.events.map((event) => ({ id: event.event_id, type: event.event_type, sequence: event.sequence, timestamp: event.timestamp, stage: event.vulnerability ?? null, source: event.raw_source }));
    const causalEdges = detail.events.flatMap((event) => event.causes.filter((cause) => ids.has(cause)).map((cause) => ({ id: `${cause}->${event.event_id}`, source: cause, target: event.event_id, relationship: "causes" })));
    const causalTargets = new Set(causalEdges.map((edge) => edge.target));
    const sequenceEdges = detail.events.slice(1).map((event, index) => ({ id: `${detail.events[index]!.event_id}->${event.event_id}`, source: detail.events[index]!.event_id, target: event.event_id, relationship: "sequence" })).filter((edge) => !causalTargets.has(edge.target));
    return res.json({ data: { analysis_id: detail.id, nodes, edges: [...causalEdges, ...sequenceEdges] } });
  } catch (error) { next(error); } });
  app.get("/api/v1/analyses/:id/export", async (req: AuthenticatedRequest, res, next) => { try {
    const detail = await repository.getAnalysis(req.user!.id, req.params.id as string); if (!detail) return jsonError(res, 404, "NOT_FOUND", "analysis not found");
    const format = req.query.format === "ndjson" ? "ndjson" : "json"; const filename = `honeytrace-${detail.trace_id}.${format}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`);
    if (format === "ndjson") { res.type("application/x-ndjson"); return res.send([JSON.stringify({ type: "attack_trace", data: detail.raw_trace }), ...detail.events.map((event) => JSON.stringify({ type: "event", data: event }))].join("\n") + "\n"); }
    return res.type("application/json").send(JSON.stringify({ schema_version: detail.schema_version, exported_at: new Date().toISOString(), analysis: detail }, null, 2));
  } catch (error) { next(error); } });
  app.post("/api/v1/visualization-history", async (req: AuthenticatedRequest, res, next) => { try {
    const parsed = historySchema.safeParse(req.body); if (!parsed.success) return jsonError(res, 400, "INVALID_HISTORY", "invalid visualization history", parsed.error.flatten());
    if (!await repository.recordHistory(req.user!.id, parsed.data)) return jsonError(res, 404, "NOT_FOUND", "analysis not found");
    return res.status(201).json({ data: { recorded: true } });
  } catch (error) { next(error); } });
  app.get("/api/v1/ingest-tokens", async (req: AuthenticatedRequest, res, next) => { try { return res.json({ data: await repository.listIngestTokens(req.user!.id) }); } catch (error) { next(error); } });
  app.post("/api/v1/ingest-tokens", async (req: AuthenticatedRequest, res, next) => { try { const parsed = ingestTokenSchema.safeParse(req.body); if (!parsed.success) return jsonError(res, 400, "INVALID_TOKEN", "invalid ingest token name", parsed.error.flatten()); return res.status(201).json({ data: await repository.createIngestToken(req.user!.id, parsed.data.name) }); } catch (error) { next(error); } });
  app.delete("/api/v1/ingest-tokens/:id", async (req: AuthenticatedRequest, res, next) => { try { return await repository.revokeIngestToken(req.user!.id, req.params.id as string) ? res.status(204).send() : jsonError(res, 404, "NOT_FOUND", "ingest token not found"); } catch (error) { next(error); } });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error(error); return jsonError(res, 500, "INTERNAL_ERROR", "internal server error"); });
  return app;
}
