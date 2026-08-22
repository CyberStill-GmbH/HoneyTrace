# Sprint 2 — Collector, Normalizer y primer AttackTrace

## Duración

26–31 de agosto de 2026.

## Objetivo

Completar el flujo Honeypot → Collector → Normalizer → correlación básica → `AttackTrace` para el escenario de fuerza bruta.

## Backlog

- [x] **LT** — definir interfaces, límites de recursos, deduplicación y fallo seguro del Engine.
- [x] **LT** — construir el núcleo determinista del Correlation Engine y Attack Reconstruction; priorizar reglas explicables.
- [x] **IA** — implementar parsers del Collector en Python con pruebas unitarias e integración NDJSON.
- [ ] **IA** — crear `bruteforce.json` y su ground truth.
- [x] **IB** — instrumentar métricas de disponibilidad, latencia, eventos, CPU, RAM y disco en el contrato de observabilidad.
- [x] **IB** — documentar el runbook de ejecución del pipeline.
- [x] **Equipo** — crear pruebas unitarias de Normalizer y pruebas de integración del Engine; la comparación completa contra ground truth queda pendiente.
- [ ] **LT** — medir precisión, recall, F1, cobertura y latencia para fuerza bruta.
- [ ] **Equipo** — ejecutar reinicio, duplicados, evento inválido y almacenamiento lleno.

## Criterio de salida

El núcleo produce un `AttackTrace` reproducible desde eventos normalizados en Rust. La integración completa Collector → Normalizer → Engine y la evaluación contra ground truth permanecen como criterio pendiente.
