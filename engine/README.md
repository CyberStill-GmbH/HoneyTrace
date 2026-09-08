# Correlation Engine y Attack Reconstruction (Rust)

Este directorio contiene el primer núcleo funcional del motor que desarrollarás en Rust. La correlación determinista, el grafo de procedencia acotado, la reconstrucción por reglas y el scoring de cobertura ya tienen una implementación mínima y verificable. Los algoritmos de aprendizaje y las estrategias avanzadas siguen fuera del camino crítico.

## Flujo y límites

```text
honeypot -> collector -> normalizer -> engine (Rust) -> Wazuh/visor
                                      |-> correlación
                                      |-> procedencia
                                      |-> reconstrucción
                                      |-> scoring auditable
```

- `ingest.rs`: lee NDJSON y deserializa el contrato `schemas/normalized_event.schema.json`. No agrupa ni infiere.
- `model.rs`: tipos serializables `NormalizedEvent`, `CorrelationGroup`, `AttackTrace` y `Evidence`.
- `correlate.rs`: puerto `CorrelationEngine::correlate` y agrupación determinista por identidad, ventana temporal y secuencia.
- `provenance.rs`: nodos y aristas de causas y entidades compartidas, con límite explícito para evitar explosión del grafo.
- `reconstruct.rs`: puerto `AttackReconstructor::reconstruct` y reconstrucción por reglas de las cinco señales del honeypot.
- `scoring.rs`: puerto `AttributionScorer::score` y puntuación inicial interpretable basada en cobertura de evidencia.
- `error.rs`: errores tipados para que los consumidores no confundan ausencia de algoritmo con resultado vacío.
- `main.rs`: agente continuo que sigue el NDJSON, conserva offset y trazas pendientes en disco, espera el cierre lógico de cada traza y reintenta la publicación con backoff.
- `pipeline.rs`: ejecuta correlación, reconstrucción y scoring y crea el contrato de ingestión.
- `uploader.rs`: publica el contrato en la API privada con un token de dispositivo, timeout y clasificación de errores reintentables.
- `tests/contracts.rs`: garantiza que los puertos deliberadamente no implementados fallan explícitamente.
- `tests/pipeline.rs`: integración completa desde eventos hasta `AttackTrace` auditable.

## Funciones que debe implementar el desarrollo posterior

1. `EventReader::read_ndjson`: validar contra el JSON Schema, rechazar líneas inválidas y preservar `event_id`, `trace_id`, `sequence` y timestamps.
2. `CorrelationEngine::correlate`: construir grupos reproducibles; documentar ventana temporal, claves de unión, deduplicación, límites de memoria y política ante eventos fuera de orden.
3. `ProvenanceGraph::from_events`: representar dependencias de proceso, socket, archivo, usuario, sesión y endpoint; conservar orden parcial y la procedencia de cada arista.
4. `AttackReconstructor::reconstruct`: convertir el grafo en etapas, técnicas ATT&CK, eventos de evidencia y una confianza calibrada; no inventar pasos no observados.
5. `AttributionScorer::score`: medir precisión, cobertura, falsos positivos, latencia y tamaño de salida frente a ground truth; publicar intervalos de confianza y versión del modelo.

## Metodología derivada de papers

- **SLEUTH** propone reconstrucción en tiempo real mediante grafos de dependencias/procedencia y etiquetado de fuentes; inspira `ProvenanceGraph`, pero no se copia una implementación de forma automática ([Hossain et al., USENIX Security 2017](https://www.usenix.org/system/files/conference/usenixsecurity17/sec17-hossain.pdf)).
- **ORTHRUS** combina poda de aristas conservando el orden de eventos, representación temporal y reconstrucción causal; inspira la separación entre correlación, grafo y reconstrucción ([Jiang et al., USENIX Security 2025](https://www.usenix.org/system/files/conference/usenixsecurity25/sec25cycle1-prepub-103-jiang-baoxiang.pdf)).
- El trabajo de **Han et al.** formaliza retos de proveniencia: relaciones explícitas, orden parcial, streaming y detección de anomalías ([TaPP 2018](https://www.usenix.org/system/files/conference/tapp2018/tapp2018-paper-han.pdf)).
- **ALchemist** muestra que fusionar logs de aplicación y auditoría requiere controlar dependencias espurias; por eso la evidencia debe conservar su fuente y razón ([NDSS](https://www.ndss-symposium.org/ndss-paper/alchemist-fusing-application-and-audit-logs-for-precise-attack-provenance-without-instrumentation/)).
- **Yu et al.** justifican limitar el costo de captura en hardware restringido, relevante para la Raspberry Pi y el SSD ([USENIX Security 2024](https://www.usenix.org/conference/usenixsecurity24/presentation/yu-le)).

Los resultados de esos papers dependen de sus datasets, instrumentación y amenazas; no se trasladan como un “porcentaje de éxito” universal a HoneyTrace. El engine deberá reportar métricas propias con ataques reproducibles y ground truth.

## Contrato de salida propuesto

`AttackTrace` debe emitirse como JSON/NDJSON con `trace_id`, intervalo temporal, `stages`, `event_ids`, técnicas ATT&CK, `confidence` y `evidence`. Toda inferencia debe poder volver a uno o más `event_id`; si no existe evidencia suficiente, la etapa debe quedar como desconocida o no emitirse.

## Desarrollo local

```powershell
cargo fmt --manifest-path engine/Cargo.toml -- --check
cargo test --manifest-path engine/Cargo.toml
cargo run --manifest-path engine/Cargo.toml
```

El servicio requiere `HONEYTRACE_EVENTS_FILE`, `HONEYTRACE_STATE_FILE`,
`HONEYTRACE_INGEST_TOKEN_FILE`, `HONEYTRACE_API_URL` y `HONEYTRACE_SOURCE_ID`.
El token se lee desde un archivo y nunca se imprime. `HONEYTRACE_RUN_ONCE=true`
permite una ejecución única para diagnóstico; en Raspberry se ejecuta continuamente.

La integración continua ejecuta `fmt`, `check` y `test`. El siguiente paso es implementar un módulo por vez, comenzando por validación del contrato y después correlación determinista; no se debe mezclar el motor con `collector/` ni `normalizer/`.

La evaluación comparativa y el método seleccionado están documentados en [`metodo-seleccionado.md`](metodo-seleccionado.md). Ese documento es la especificación de diseño; la implementación actual cubre el primer camino determinista.
