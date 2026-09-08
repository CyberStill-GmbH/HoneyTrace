import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState, EmptyState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { api } from "../lib/api";
import { analysisSeverity, duration, formatDate } from "../lib/format";

const filters = [
  { label: "Todos", value: "" }, { label: "Fuerza bruta", value: "auth-brute-force" },
  { label: "IDOR", value: "users-idor" }, { label: "Inyección SQL", value: "products-sqli" },
  { label: "Path traversal", value: "files-path-traversal" }, { label: "XSS almacenado", value: "orders-stored-xss" },
];
export function Analyses() {
  const [stage, setStage] = useState(""); const [search, setSearch] = useState(""); const [offset, setOffset] = useState(0); const limit = 20;
  const params = useMemo(() => { const value = new URLSearchParams({ limit: String(limit), offset: String(offset) }); if (stage) value.set("stage", stage); if (search.trim()) value.set("search", search.trim()); return value; }, [stage, search, offset]);
  const query = useQuery({ queryKey: ["analyses", params.toString()], queryFn: () => api.analyses(params) });
  const selectStage = (value: string) => { setStage(value); setOffset(0); };
  return <div className="page"><div className="page-heading"><div><h1 className="page-title font-display">Historial de análisis</h1><p className="page-subtitle">Reconstrucciones almacenadas para esta cuenta.</p></div><label className="relative block min-w-64"><Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none" /><input className="input input-search" value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} placeholder="Buscar ID o fuente" aria-label="Buscar análisis" /></label></div>
    <div className="filters" aria-label="Filtrar por clasificación">{filters.map((filter) => <button key={filter.value} className="chip" data-active={stage === filter.value} onClick={() => selectStage(filter.value)}>{filter.label}</button>)}</div>
    <section className="card">{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState retry={() => void query.refetch()} /> : !query.data?.items.length ? <EmptyState title="No hay coincidencias" detail="Ajusta los filtros o espera una nueva ingestión." /> : <><div className="table-wrap"><table className="data-table"><thead><tr><th>ID de traza</th><th>Fuente</th><th>Clasificación</th><th>Inicio</th><th>Duración</th><th>Confianza</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{query.data.items.map((item) => { const severity = analysisSeverity(item); return <tr key={item.id}><td className="font-mono text-[var(--text-primary)]">{item.trace_id}</td><td className="font-mono">{item.source_id}</td><td><SeverityBadge severity={severity} /></td><td className="font-mono whitespace-nowrap">{formatDate(item.started_at)}</td><td className="font-mono">{duration(item.started_at, item.ended_at)}</td><td><Confidence value={item.confidence} severity={severity} /></td><td><Link className="button-ghost min-h-8 min-w-8" to={`/analyses/${item.id}`} aria-label={`Ver reconstrucción ${item.trace_id}`}><Eye size={16} /></Link></td></tr>; })}</tbody></table></div><div className="pagination"><span className="text-sm text-[var(--text-tertiary)]">{offset + 1}–{Math.min(offset + limit, query.data.total)} de {query.data.total}</span><div className="flex gap-2"><button className="button-secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Anterior</button><button className="button-secondary" disabled={offset + limit >= query.data.total} onClick={() => setOffset(offset + limit)}>Siguiente</button></div></div></>}</section>
  </div>;
}
function Confidence({ value, severity }: { value: number; severity: string }) { return <div className={`confidence severity-${severity} !border-0 !bg-transparent !p-0`}><div className="confidence-track"><div className="confidence-fill" style={{ width: `${Math.round(value * 100)}%` }} /></div><span className="font-mono text-[var(--text-secondary)]">{Math.round(value * 100)}%</span></div>; }
