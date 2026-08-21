# Sprint 2 — Collector, Normalizer y primer AttackTrace

## Duración

26–31 de agosto de 2026.

## Objetivo

Completar el flujo Honeypot → Collector → Normalizer → correlación básica → `AttackTrace` para el escenario de fuerza bruta.

## Backlog

- [ ] **LT** — definir interfaces, manejo de backpressure, deduplicación y fallo seguro.
- [ ] **LT** — construir el núcleo del Correlation Engine y Attack Reconstruction; priorizar reglas explicables.
- [ ] **IA** — implementar parsers del Collector en Python con fixtures y ejemplos entregados por LT.
- [ ] **IA** — crear `bruteforce.json` y su ground truth.
- [ ] **IB** — instrumentar métricas de disponibilidad, latencia, eventos, CPU, RAM y disco.
- [ ] **IB** — documentar el runbook de ejecución del pipeline.
- [ ] **Equipo** — crear pruebas unitarias de Normalizer y pruebas de integración contra ground truth.
- [ ] **LT** — medir precisión, recall, F1, cobertura y latencia para fuerza bruta.
- [ ] **Equipo** — ejecutar reinicio, duplicados, evento inválido y almacenamiento lleno.

## Criterio de salida

El escenario de fuerza bruta produce de extremo a extremo un `AttackTrace` reproducible y evaluable contra ground truth, sin depender de Raspberry Pi.
