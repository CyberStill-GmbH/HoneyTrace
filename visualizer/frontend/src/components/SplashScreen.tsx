import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/** Covers initial entry, including the full-page return from GitHub OAuth. */
export function SplashScreen({ children }: { children: ReactNode }) {
  const { isPending } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false, staleTime: 5 * 60_000 });
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [deadlineElapsed, setDeadlineElapsed] = useState(false);
  const [finished, setFinished] = useState(false);
  const leaving = minimumElapsed && (!isPending || deadlineElapsed);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimum = window.setTimeout(() => setMinimumElapsed(true), reduced ? 0 : 950);
    const deadline = window.setTimeout(() => setDeadlineElapsed(true), 4500);
    return () => { window.clearTimeout(minimum); window.clearTimeout(deadline); };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const exit = window.setTimeout(() => setFinished(true), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300);
    return () => window.clearTimeout(exit);
  }, [leaving]);

  if (finished) return children;
  return <div className="brand-splash" data-leaving={leaving} role="status" aria-label="Cargando HoneyTrace">
    <div className="splash-identity" aria-hidden="true">
      <svg className="splash-mark" viewBox="-40 -40 80 80" fill="none">
        <polygon className="splash-hex" points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13" pathLength="1" />
        <path className="splash-trace" d="M -11,-5 L -3,-5 L 1,7 L 9,-9 L 15,5" pathLength="1" />
        <circle className="splash-node" cx="15" cy="5" r="2.5" />
      </svg>
      <div className="splash-wordmark">honey<span>trace</span></div>
      <p className="splash-caption">Conectando las evidencias</p>
      <div className="splash-track"><span /></div>
    </div>
  </div>;
}
