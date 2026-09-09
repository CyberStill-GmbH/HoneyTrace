import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState, EmptyState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { api } from "../lib/api";
import { analysisSeverity, eventLabel, relativeTime } from "../lib/format";

export function Dashboard() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats, refetchInterval: 15_000 });
  const recent = useQuery({ queryKey: ["analyses", "recent"], queryFn: () => api.analyses(new URLSearchParams({ limit: "8" })), refetchInterval: 10_000 });
  const details = useQueries({ queries: (recent.data?.items.slice(0, 6) ?? []).map((item) => ({ queryKey: ["analysis", item.id], queryFn: () => api.analysis(item.id), staleTime: 30_000 })) });
  if (stats.isLoading || recent.isLoading) return <div className="page"><LoadingState /></div>;
  if (stats.isError || recent.isError) return <div className="page"><ErrorState retry={() => { void stats.refetch(); void recent.refetch(); }} /></div>;
  const feed = details.flatMap((query, index) => {
    const analysis = recent.data!.items[index]!;
    return query.data?.events.slice(-1).map((event) => ({ event, analysis })) ?? [];
  }).sort((a, b) => b.event.timestamp.localeCompare(a.event.timestamp));
  const sources = Object.entries(stats.data?.by_source ?? {}).sort((a, b) => b[1] - a[1]);
  const latestBySource = new Map(recent.data?.items.map((analysis) => [analysis.source_id, analysis]) ?? []);
  return <div className="page">
    <div className="page-heading"><div><h1 className="page-title font-display">Dashboard</h1><p className="page-subtitle">Actividad y resultados del pipeline de reconstrucción.</p></div><Link className="button-secondary" to="/analyses">Ver historial <ArrowRight size={16} /></Link></div>
    <section className="metric-grid" aria-label="Resumen de actividad"><Metric label="Análisis totales" value={String(stats.data?.total ?? 0)} /><Metric label="Últimas 24 horas" value={String(stats.data?.recent_24h ?? 0)} /><Metric label="Confianza promedio" value={`${Math.round((stats.data?.average_confidence ?? 0) * 100)}%`} /><Metric label="Fuentes activas" value={String(sources.length)} /></section>
    <div className="dashboard-grid">
      <section className="card" aria-labelledby="activity-title"><div className="section-header"><div className="flex items-center gap-2"><Radio size={16} className="text-[var(--sev-recon)]" /><h2 id="activity-title" className="section-title">Actividad reciente</h2></div><span className="text-[var(--text-xs)] text-[var(--text-muted)]">Actualiza cada 10 s</span></div>
        {recent.data?.total === 0 ? <EmptyState title="Aún no hay actividad" detail="Configura un token de dispositivo para comenzar a recibir análisis." /> : <div className="feed">{feed.length ? feed.map(({ event, analysis }) => <Link className="feed-row text-inherit no-underline" to={`/analyses/${analysis.id}`} key={event.event_id}><SeverityBadge severity={analysisSeverity(analysis)} /><div className="feed-main"><div className="feed-route"><span>{event.source_ip ?? "IP no registrada"}</span><span className="text-[var(--text-muted)]">→</span><span>{event.path ?? event.event_type}</span></div><div className="feed-meta">{eventLabel(event.event_type)} · {event.outcome ?? "sin resultado adicional"}</div></div><time className="timestamp" dateTime={event.timestamp}>{relativeTime(event.timestamp)}</time></Link>) : (recent.data?.items.map((item) => <Link className="feed-row text-inherit no-underline" to={`/analyses/${item.id}`} key={item.id}><SeverityBadge severity={analysisSeverity(item)} /><div className="feed-main"><div className="feed-route">{item.source_id} · {item.trace_id}</div><div className="feed-meta">{item.stages.join(" · ")}</div></div><time className="timestamp">{relativeTime(item.created_at)}</time></Link>))}</div>}
      </section>
      <section className="card" aria-labelledby="sources-title"><div className="section-header"><div><h2 id="sources-title" className="section-title">Fuentes</h2><p className="mt-1 text-sm text-[var(--text-tertiary)]">Última clasificación reconstruida por cada origen.</p></div></div>{sources.length ? <div className="source-list">{sources.map(([source, count]) => { const latest = latestBySource.get(source); return <div className="source-row" key={source}><div><span className="font-mono text-sm text-[var(--text-secondary)]">{source}</span><span className="source-count">{count} {count === 1 ? "análisis" : "análisis"}</span></div>{latest ? <SeverityBadge severity={analysisSeverity(latest)} /> : <span className="text-xs text-[var(--text-muted)]">Sin actividad reciente</span>}</div>; })}</div> : <EmptyState title="Sin fuentes" detail="Las fuentes aparecerán después de la primera ingestión." />}</section>
    </div>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <article className="metric card"><p className="metric-label">{label}</p><p className="metric-value">{value}</p></article>; }
