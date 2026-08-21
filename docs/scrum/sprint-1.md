# Sprint 1 — Honeypot instrumentado

## Duración

20–25 de agosto de 2026.

## Objetivo

Implementar las cinco superficies vulnerables sobre un honeypot señuelo y producir eventos estructurados suficientes para iniciar el pipeline de investigación. Los ataques E2E serán solicitudes reales contra este honeypot autorizado; los datos persistidos seguirán siendo de laboratorio.

## Backlog

- [x] **LT** — corregir `reasearch/` a `research/` y crear `schemas/`, `api/` y `frontend/` solo con estructura mínima.
- [x] **LT** — aceptar ADR 0001 y ADR 0003 después de revisar alcance y contrato.
- [x] **LT** — versionar `NormalizedEvent` y `AttackTrace` en `schemas/`.
- [x] **LT** — implementar `/auth` (Brute Force), `/products` (SQLi) y contención de `/files` (Path Traversal).
- [x] **IA** — implementar `/users` (IDOR) con datos sintéticos y guía del LT.
- [x] **IB + LT** — implementar `/orders` con Stored XSS mediante `Note` y renderizado aislado.
- [x] **IA** — crear datos semilla y pruebas funcionales de `/auth`, `/users` y `/products`.
- [x] **IB** — documentar y probar `/files` y `/orders`, incluyendo límites del filesystem señuelo.
- [x] **Equipo** — registrar `trace_id`, timestamp, ruta, técnica, respuesta y latencia en cada interacción.
- [x] **Equipo** — ejecutar Pytest para las cinco rutas y `/health` dentro de Docker.
- [x] **LT** — revisar que ninguna vulnerabilidad pueda acceder al host, secretos o red institucional.

## Criterio de salida

Cada técnica es reproducible por una prueba automatizada, genera un `NormalizedEvent` correlacionable y permanece contenida dentro del honeypot. No se acepta una ruta vulnerable sin prueba de contención.

## Fuera del sprint

Collector completo, Engine, Wazuh, API de resultados, frontend y Raspberry Pi; se atienden en los sprints siguientes.
