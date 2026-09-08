import type { AttackTrace, NormalizedEvent } from "../types.js";

export type AnalysisFinding = {
  stage: string;
  title: string;
  technique?: string;
  explanation: string;
  evidence_event_ids: string[];
};

export type AnalysisInterpretation = {
  overview: string;
  findings: AnalysisFinding[];
  confidence_explanation: string;
  graph_explanation: string;
  limitation: string;
  event_explanations: Record<string, string>;
};

type StageDefinition = {
  title: string;
  technique: string;
  matches: string[];
  explain: (events: NormalizedEvent[]) => string;
};

const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : undefined;
const count = (events: NormalizedEvent[], outcome: string) => events.filter((event) => event.outcome === outcome).length;
const metadataValue = (events: NormalizedEvent[], key: string) => events.map((event) => text(event.metadata[key])).find(Boolean);
const endpoint = (event: NormalizedEvent) => [event.method, event.path].filter(Boolean).join(" ") || event.event_type;
const canonical = (value?: string | null) => value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";

const definitions: Record<string, StageDefinition> = {
  "auth-brute-force": {
    title: "Fuerza bruta contra autenticación", technique: "T1110", matches: ["brute_force"],
    explain: (events) => {
      const failures = count(events, "invalid_credentials");
      const success = count(events, "authenticated");
      const attempts = failures ? `${failures} ${failures === 1 ? "intento fallido" : "intentos fallidos"}` : "intentos repetidos";
      return success ? `Se observaron ${attempts} seguidos de una autenticación exitosa.` : `Se observaron ${attempts} contra el endpoint de autenticación.`;
    },
  },
  "users-idor": {
    title: "Acceso directo inseguro a un objeto", technique: "HT-IDOR", matches: ["idor"],
    explain: (events) => {
      const actor = metadataValue(events, "actor_user_id");
      const target = metadataValue(events, "target_user_id");
      return actor && target
        ? `La solicitud identificada como usuario ${actor} obtuvo el objeto perteneciente al usuario ${target}.`
        : "Una solicitud obtuvo un objeto de otro usuario sin una comprobación de autorización efectiva.";
    },
  },
  "products-sqli": {
    title: "Inyección SQL en búsqueda de productos", technique: "HT-SQLI", matches: ["sqli"],
    explain: (events) => {
      const rows = metadataValue(events, "row_count");
      return rows
        ? `El parámetro de búsqueda activó una consulta manipulada que devolvió ${rows} filas.`
        : "El parámetro de búsqueda activó el patrón de inyección y la consulta fue ejecutada por el honeypot.";
    },
  },
  "files-path-traversal": {
    title: "Recorrido de rutas de archivos", technique: "HT-PATH-TRAVERSAL", matches: ["path_traversal"],
    explain: (events) => {
      const read = count(events, "decoy_file_returned") > 0;
      const blocked = count(events, "blocked_outside_decoy_root") > 0;
      if (read && blocked) return "La ruta manipulada permitió leer un archivo señuelo y un intento posterior de salir del directorio controlado fue bloqueado.";
      if (read) return "La ruta manipulada permitió leer un archivo señuelo fuera de la ubicación solicitada originalmente.";
      return "Se observó un intento de salir del directorio señuelo mediante segmentos de ruta ascendentes.";
    },
  },
  "orders-stored-xss": {
    title: "XSS almacenado en notas", technique: "HT-STORED-XSS", matches: ["stored_xss", "stored_xss_mediante_note"],
    explain: (events) => {
      const stored = count(events, "payload_stored") > 0;
      const rendered = count(events, "payload_rendered_in_decoy_view") > 0;
      if (stored && rendered) return "El contenido con script fue almacenado como nota y después apareció sin escapar en la vista señuelo.";
      return stored ? "El contenido con script fue persistido como nota sin neutralización." : "La vista señuelo renderizó contenido almacenado sin escapar.";
    },
  },
};

const stageForEvent = (event: NormalizedEvent) => {
  const value = canonical(event.vulnerability);
  return Object.entries(definitions).find(([, definition]) => definition.matches.includes(value))?.[0];
};

function explainEvent(event: NormalizedEvent): string {
  const stage = stageForEvent(event);
  if (stage) {
    const outcome = event.outcome ? ` El resultado registrado fue “${event.outcome}”.` : "";
    return `${definitions[stage]!.title} detectado en ${endpoint(event)}.${outcome}`;
  }
  if (event.event_type === "DB_QUERY") {
    const operation = text(event.metadata.operation) ?? "consulta";
    const table = text(event.metadata.table);
    return `${operation} ejecutado${table ? ` sobre la tabla ${table}` : ""} dentro de la misma traza. Aporta contexto, pero por sí solo no demuestra explotación.`;
  }
  if (event.event_type === "HTTP_REQUEST") {
    return `${endpoint(event)} finalizó${event.status_code ? ` con HTTP ${event.status_code}` : ""}. Este nodo delimita la respuesta observada por el honeypot.`;
  }
  return `${event.event_type} fue observado por ${event.raw_source} dentro de esta traza.`;
}

export function interpretAnalysis(trace: AttackTrace, events: NormalizedEvent[]): AnalysisInterpretation {
  const findings = trace.stages.map((stage) => {
    const definition = definitions[stage];
    const related = events.filter((event) => stageForEvent(event) === stage);
    return {
      stage,
      title: definition?.title ?? stage,
      technique: trace.techniques.find((technique) => technique === definition?.technique),
      explanation: definition?.explain(related) ?? "La etapa fue emitida por el Engine a partir de la evidencia asociada.",
      evidence_event_ids: related.map((event) => event.event_id),
    };
  });
  const overview = findings.length === 1
    ? findings[0]!.explanation
    : `La traza contiene ${findings.length} hallazgos: ${findings.map((finding) => finding.title.toLowerCase()).join(", ")}.`;
  const evidenced = trace.evidence.length;
  const total = events.length;
  return {
    overview,
    findings,
    confidence_explanation: `La confianza de ${Math.round(trace.confidence * 100)}% representa cobertura de evidencia: ${evidenced} ${evidenced === 1 ? "evento sustenta" : "eventos sustentan"} la clasificación entre ${total} eventos observados en la traza.`,
    graph_explanation: "Las flechas conectan eventos en el orden en que fueron observados. Una relación marcada como causal solo existe cuando el evento de origen fue declarado explícitamente como causa.",
    limitation: "La reconstrucción describe lo observado dentro del honeypot. No demuestra impacto en sistemas externos ni atribuye identidad al actor.",
    event_explanations: Object.fromEntries(events.map((event) => [event.event_id, explainEvent(event)])),
  };
}
