# Roadmap Scrum — índice ejecutivo

**Horizonte ejecutado:** 17 de agosto a septiembre de 2026

**Equipo:** LT (Líder Técnico), IA e IB (integrantes junior)  
**Hito final:** proyecto presentado en la feria UNITEC 2026.

## Estado

- [x] Sprint 0: base Docker/PostgreSQL/Alembic/FastAPI verificada; quedan deudas de estructura y validación independiente.
- [x] Sprint 1: cinco APIs vulnerables contenidas e instrumentadas.
- [x] Sprint 2: Collector, Normalizer y `AttackTrace` integrados de extremo a extremo.
- [x] Sprint 3: escenarios de laboratorio, CLI Go y automatización de Raspberry Pi entregados.
- [x] Sprint 4: integración del visualizador, demostración y cierre documental para UNITEC 2026.

La prueba física en OTI UNI y la evaluación cuantitativa ampliada contra *ground truth* no formaron parte del cierre presentado. Se conservaron como extensiones de investigación, sin atribuirles ejecución.

## Sprints canónicos

- [Sprint 0](scrum/sprint-0.md) — 17–19 ago.
- [Sprint 1](scrum/sprint-1.md) — 20–25 ago.
- [Sprint 2](scrum/sprint-2.md) — 26–31 ago.
- [Sprint 3](scrum/sprint-3.md) — 1–5 sep.
- [Sprint 4](scrum/sprint-4.md) — 6–10 sep.
- [Definition of Ready](scrum/definition-of-ready.md).
- [Definition of Done](scrum/definition-of-done.md).

## Reglas de planificación históricas

- LT toma arquitectura, Engine, aislamiento, vulnerabilidades de mayor riesgo e integración.
- IA e IB reciben tareas guiadas de máximo un día, con ejemplos, pairing y revisión del LT.
- La ruta crítica es: contrato → APIs → eventos → correlación → ground truth → Raspberry → autorización → ensayo → campo.
- Wazuh, API de consulta y visualización son extensiones; no desplazan el MVP investigativo, la seguridad ni las pruebas.
- El Go/No-Go previsto para OTI UNI queda archivado con su plan original; no condicionó la presentación final en UNITEC 2026.

## Ceremonias

- Daily de 15 minutos con evidencia y bloqueos.
- Planificación y review al inicio y cierre de cada sprint.
- Refinamiento a mitad de sprint.
- Retrospectiva con una acción concreta, responsable y fecha.
