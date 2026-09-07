import { clsx } from "clsx";
import type { Severity } from "../types";

const labels: Record<Severity, string> = { recon: "Reconocimiento", "brute-force": "Fuerza bruta", "auth-success": "Acceso confirmado", "admin-access": "Acceso administrador", info: "Sin clasificar" };
export function SeverityBadge({ severity }: { severity: Severity }) { return <span className={clsx("severity", `severity-${severity}`)}>{labels[severity]}</span>; }
export const severityLabel = (severity: Severity) => labels[severity];
