import { Activity, GitBranch, LoaderCircle, LockKeyhole } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

export function Login() {
  const location = useLocation(); const destination = (location.state as { from?: string } | null)?.from ?? "/";
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
  if (data) return <Navigate to={destination} replace />;
  return <main className="auth-page">
    <section className="auth-shell" aria-labelledby="login-title">
      <div className="auth-brand-panel">
        <img className="auth-logo" src="/honeytrace-logo.svg" alt="HoneyTrace" />
        <div className="auth-brand-copy">
          <p className="auth-eyebrow"><Activity size={14} />Reconstrucción de ataques</p>
          <h1 className="font-display">Observa la secuencia.<br />Encuentra la causa.</h1>
          <p>Explora eventos correlacionados, evidencias y relaciones causales desde un único espacio privado.</p>
        </div>
        <div className="auth-signal" aria-hidden="true"><span /><span /><span /><span /></div>
      </div>
      <div className="auth-access-panel">
        <div className="auth-access-copy">
          <span className="auth-icon"><LockKeyhole size={19} /></span>
          <p className="auth-kicker">Acceso seguro</p>
          <h2 id="login-title" className="font-display">Bienvenido de nuevo</h2>
          <p>Continúa con tu cuenta de GitHub para consultar los análisis asociados a tu perfil.</p>
        </div>
        {isLoading ? <div className="auth-loading"><LoaderCircle className="animate-spin" size={18} />Verificando sesión…</div> : <a className="auth-github-button" href={api.loginUrl(destination)}><GithubMark /><span>Continuar con GitHub</span><span className="auth-button-arrow">→</span></a>}
        <div className="auth-private"><GitBranch size={14} /><span>Datos aislados por cuenta</span></div>
      </div>
    </section>
  </main>;
}
function GithubMark() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.4-5.29 5.69.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>; }
