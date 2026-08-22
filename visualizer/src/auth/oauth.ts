import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

type StatePayload = { provider: "github"; nonce: string; createdAt: number; returnTo?: string };
const encode = (value: string) => Buffer.from(value).toString("base64url");
const sign = (value: string) => createHmac("sha256", config.OAUTH_STATE_SECRET).update(value).digest("base64url");
const safeEqual = (a: string, b: string) => { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); };
const safeReturnTo = (value?: string) => value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export function createOAuthState(returnTo?: string) { const payload: StatePayload = { provider: "github", nonce: randomBytes(24).toString("base64url"), createdAt: Date.now(), ...(safeReturnTo(returnTo) ? { returnTo: safeReturnTo(returnTo) } : {}) }; const encoded = encode(JSON.stringify(payload)); return `${encoded}.${sign(encoded)}`; }
export function verifyOAuthState(state: string, expectedState: string) { const [encoded, signature] = state.split("."); if (!encoded || !signature || !safeEqual(state, expectedState) || !safeEqual(signature, sign(encoded))) throw new Error("INVALID_OAUTH_STATE"); const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StatePayload; if (payload.provider !== "github" || Date.now() - payload.createdAt > 10 * 60 * 1000 || !payload.nonce) throw new Error("INVALID_OAUTH_STATE"); return { returnTo: safeReturnTo(payload.returnTo) }; }
