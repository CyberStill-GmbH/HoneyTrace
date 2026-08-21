# Roadmap Scrum — índice ejecutivo

**Horizonte:** 17 de agosto al 10 de septiembre de 2026  
**Equipo:** LT (Líder Técnico), IA e IB (integrantes junior)  
**Hito:** piloto controlado propuesto en OTI UNI el 10 de septiembre, sujeto a autorización.

## Estado

- [x] Sprint 0: base Docker/PostgreSQL/Alembic/FastAPI verificada; quedan deudas de estructura y validación independiente.
- [ ] Sprint 1: cinco APIs vulnerables contenidas e instrumentadas.
- [ ] Sprint 2: Collector, Normalizer y primer `AttackTrace`.
- [ ] Sprint 3: cinco escenarios, Raspberry Pi/SSD y autorización OTI.
- [ ] Sprint 4: regresión, ensayo, Go/No-Go, campo y cierre.

## Sprints canónicos

- [Sprint 0](scrum/sprint-0.md) — 17–19 ago.
- [Sprint 1](scrum/sprint-1.md) — 20–25 ago.
- [Sprint 2](scrum/sprint-2.md) — 26–31 ago.
- [Sprint 3](scrum/sprint-3.md) — 1–5 sep.
- [Sprint 4](scrum/sprint-4.md) — 6–10 sep.
- [Definition of Ready](scrum/definition-of-ready.md).
- [Definition of Done](scrum/definition-of-done.md).

## Reglas de planificación

- LT toma arquitectura, Engine, aislamiento, vulnerabilidades de mayor riesgo e integración.
- IA e IB reciben tareas guiadas de máximo un día, con ejemplos, pairing y revisión del LT.
- La ruta crítica es: contrato → APIs → eventos → correlación → ground truth → Raspberry → autorización → ensayo → campo.
- Wazuh, API de consulta y visualización son extensiones; no desplazan el MVP investigativo, la seguridad ni las pruebas.
- El 9 de septiembre se decide Go/No-Go. Falta de autorización, aislamiento o estabilidad implica reprogramar la prueba.

## Ceremonias

- Daily de 15 minutos con evidencia y bloqueos.
- Planificación y review al inicio y cierre de cada sprint.
- Refinamiento a mitad de sprint.
- Retrospectiva con una acción concreta, responsable y fecha.
