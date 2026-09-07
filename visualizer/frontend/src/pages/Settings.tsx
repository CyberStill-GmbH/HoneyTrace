import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Database, Server } from "lucide-react";
import { api, API_URL } from "../lib/api";
import { LoadingState } from "../components/States";

export function SettingsPage() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: api.me });
  if (isLoading) return <div className="page"><LoadingState /></div>;
  return <div className="page"><div className="page-heading"><div><h1 className="page-title font-display">Configuración</h1><p className="page-subtitle">No hay ajustes remotos: esta instalación funciona exclusivamente en local.</p></div></div><div className="dashboard-grid"><section className="card"><div className="section-header"><h2 className="section-title">Cuenta</h2></div><dl className="detail-grid p-5 !mt-0"><div className="contents"><dt>Usuario</dt><dd>{user?.username}</dd></div><div className="contents"><dt>GitHub ID</dt><dd>{user?.github_id}</dd></div><div className="contents"><dt>Privacidad</dt><dd>Datos aislados por cuenta</dd></div></dl></section><section className="card"><div className="section-header"><h2 className="section-title">Entorno local</h2></div><div className="space-y-4 p-5"><Status icon={Server} label="API" value={API_URL} /><Status icon={Database} label="Persistencia" value="PostgreSQL + Prisma" /><Status icon={CheckCircle2} label="Sesión" value="Activa con GitHub" /></div></section></div></div>;
}
function Status({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) { return <div className="flex items-start gap-3"><Icon size={17} className="mt-0.5 text-[var(--sev-recon)]" /><div><div className="text-sm text-[var(--text-secondary)]">{label}</div><div className="font-mono text-[var(--text-xs)] text-[var(--text-muted)]">{value}</div></div></div>; }
