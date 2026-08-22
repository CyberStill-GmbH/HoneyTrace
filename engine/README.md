# Correlation Engine y Attack Reconstruction (Rust)

Este directorio contiene la **preparación contractual** del motor que desarrollarás en Rust. No contiene todavía algoritmos de correlación, aprendizaje, atribución ni reconstrucción: los puertos sin implementación devuelven `EngineError::NotImplemented` de forma explícita.

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
- `correlate.rs`: puerto `CorrelationEngine::correlate`; aquí entrará la agrupación por ventana temporal, identidad, entidades y causas.
- `provenance.rs`: nodos y aristas para un grafo de procedencia temporal/causal. `from_events` es sólo un punto de extensión.
- `reconstruct.rs`: puerto `AttackReconstructor::reconstruct`; producirá una narrativa ordenada y auditable a partir de un grupo.
- `scoring.rs`: puerto `AttributionScorer::score`; separará evidencia observada de inferencias y permitirá calibrar confianza.
- `error.rs`: errores tipados para que los consumidores no confundan ausencia de algoritmo con resultado vacío.
- `main.rs`: ejecutable de verificación del scaffold, no un servicio de producción.
- `tests/contracts.rs`: garantiza que los puertos aún no implementados fallan explícitamente.

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

La integración continua ejecuta `fmt`, `check` y `test`. El siguiente paso es implementar un módulo por vez, comenzando por validación del contrato y después correlación determinista; no se debe mezclar el motor con `collector/` ni `normalizer/`.

La evaluación comparativa y el método seleccionado están documentados en [`metodo-seleccionado.md`](metodo-seleccionado.md). Ese documento es la especificación de diseño antes de implementar.
