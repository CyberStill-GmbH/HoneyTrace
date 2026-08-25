import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1).default("postgresql://visualizer:change-me@localhost:5433/honeytrace_visualizer"),
  OAUTH_STATE_SECRET: z.string().min(32).default("development-secret-change-me-please-32"),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GITHUB_CALLBACK_URL: z.string().url().default("http://localhost:8080/api/auth/github/callback"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  COOKIE_SECURE: z.string().default("false").transform((value) => value === "true"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
}).refine((value) => value.COOKIE_SAME_SITE !== "none" || value.COOKIE_SECURE, { message: "COOKIE_SECURE must be true when COOKIE_SAME_SITE=none" });

export const config = envSchema.parse(process.env);
