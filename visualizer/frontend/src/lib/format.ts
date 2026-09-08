import type { AnalysisSummary, NormalizedEvent, Severity } from "../types";

export const severityFrom = (value?: string | null): Severity => {
  const normalized = value?.trim().toLowerCase().replace(/[\s_]+/g, "-") ?? "";
  if (normalized.includes("stored-xss")) return "stored-xss";
  if (normalized.includes("path-traversal")) return "path-traversal";
  if (normalized.includes("sqli") || normalized.includes("sql-injection")) return "sqli";
  if (normalized.includes("idor")) return "idor";
  if (normalized.includes("admin")) return "admin-access";
  if (normalized.includes("auth-success") || normalized.includes("login-success")) return "auth-success";
  if (normalized.includes("brute") || normalized.includes("auth-failure")) return "brute-force";
  if (normalized.includes("recon") || normalized.includes("probe") || normalized.includes("scan")) return "recon";
  return "info";
};
export const analysisSeverity = (analysis: Pick<AnalysisSummary, "stages">) => analysis.stages.reduce<Severity>((current, stage) => {
  const order: Severity[] = ["info", "recon", "brute-force", "idor", "path-traversal", "sqli", "stored-xss", "auth-success", "admin-access"];
  const next = severityFrom(stage); return order.indexOf(next) > order.indexOf(current) ? next : current;
}, "info");
export const analysisClassifications = (analysis: Pick<AnalysisSummary, "stages">): Severity[] => {
  const values = [...new Set(analysis.stages.map(severityFrom).filter((value) => value !== "info"))];
  return values.length ? values : ["info"];
};
export const eventSeverity = (event: NormalizedEvent) => severityFrom(event.vulnerability ?? event.event_type);
export const formatDate = (value: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
export const relativeTime = (value: string) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000); const abs = Math.abs(seconds);
  const [amount, unit] = abs < 60 ? [seconds, "second"] : abs < 3600 ? [Math.round(seconds / 60), "minute"] : abs < 86400 ? [Math.round(seconds / 3600), "hour"] : [Math.round(seconds / 86400), "day"];
  return new Intl.RelativeTimeFormat("es", { numeric: "auto" }).format(amount, unit as Intl.RelativeTimeFormatUnit);
};
export const duration = (start: string, end: string) => { const ms = Math.max(0, new Date(end).getTime() - new Date(start).getTime()); return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`; };
