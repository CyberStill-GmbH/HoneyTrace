# Diagrama de componentes (C4 - Nivel 2/3)

## Descripción

Vista interna de HoneyTrace, mostrando los componentes definidos en `docs/arquitectura/arquitectura.md` y sus interfaces.
```mermaid
flowchart TD
    B["Web Honeypot<br/>(FastAPI + PostgreSQL)"] -->|RawEvent| C[Event Collector]
    C -->|NormalizedEvent| D[Normalizer]
    D -->|grupo correlacionado| E[Correlation Engine]
    E -->|AttackTrace| F[Attack Reconstruction]
    F --> G[Attack Trace]
    G --> H[API / Backend]
    H -->|REST| I["Frontend (React + Three.js)"]
 
    B -.->|telemetría en paralelo| W[Wazuh SIEM]
 
    classDef pipeline fill:#EEEDFE,stroke:#534AB7,color:#26215C;
    classDef entry fill:#FAECE7,stroke:#D85A30,color:#4A1B0C;
    classDef output fill:#E1F5EE,stroke:#0F6E56,color:#04342C;
    classDef ui fill:#E6F1FB,stroke:#185FA5,color:#042C53;
    classDef siem fill:#FAEEDA,stroke:#854F0B,color:#412402;
 
    class B entry
    class C,D,E,F pipeline
    class G output
    class H,I ui
    class W siem
```

## Interfaces principales

| Origen | Destino | Contrato |
|--------|---------|----------|
| Web Honeypot | Event Collector | Logs estructurados NDJSON |
| Event Collector | Normalizer | `RawEvent` (formato de la fuente) |
| Normalizer | Correlation Engine | `NormalizedEvent` (`/schemas`) |
| Correlation Engine | Attack Reconstruction | Grupo de eventos correlacionados (mismo `correlation_id`) |
| Attack Reconstruction | API | `AttackTrace` (`/schemas`) |
| API | Frontend | REST JSON (`GET /attacks`, `/attacks/:id`, `/events`, `/stats`, `/attacks/:id/graph`) |
| Web Honeypot / Collector | Wazuh | Telemetría en paralelo (agente Wazuh o forwarding de logs) |

## Notas de diseño

- La API no contiene lógica de correlación/reconstrucción; solo lee resultados ya producidos por el Engine.
- El Correlation Engine y Attack Reconstruction pueden probarse de forma aislada usando fixtures de `tests/fixtures/`, sin necesidad del Honeypot ni del Collector reales.
