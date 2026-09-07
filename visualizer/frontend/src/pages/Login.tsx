import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

export function Login() {
  const location = useLocation(); const destination = (location.state as { from?: string } | null)?.from ?? "/";
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
  if (data) return <Navigate to={destination} replace />;
  return <main className="auth-page"><section className="auth-card surface" aria-labelledby="login-title"><span className="brand-mark mx-auto"><ShieldCheck size={18} /></span><h1 id="login-title">Autenticación requerida</h1><p>Accede para consultar únicamente los análisis asociados a tu cuenta.</p>{isLoading ? <div className="flex min-h-11 items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]"><LoaderCircle className="animate-spin" size={17} />Verificando sesión…</div> : <a className="button-primary" href={api.loginUrl(destination)}><GithubMark />Continuar con GitHub</a>}<div className="mt-5 text-[var(--text-xs)] text-[var(--text-muted)]">La sesión se conserva en una cookie HttpOnly local.</div></section></main>;
}
function GithubMark() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.4-5.29 5.69.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>; }
