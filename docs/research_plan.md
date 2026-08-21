# Plan de investigación — índice de ejecución

La documentación canónica de investigación se mantiene en `docs/investigacion/`. Este archivo conecta sus partes con la ejecución técnica y evita duplicar la metodología.

## Documentos canónicos

- [Planteamiento del problema](investigacion/planteamiento-del-problema.md).
- [Objetivos](investigacion/objetivos.md).
- [Preguntas de investigación](investigacion/preguntas-de-investigacion.md).
- [Metodología y métricas](investigacion/metodologia.md).
- [Estado del arte](investigacion/estado-del-arte.md).
- [Escenarios de ataque](testing/escenarios-de-ataque.md).
- [Matriz de pruebas](testing/matriz-de-pruebas.md).
- [Plan OTI UNI](oti_uni_test_plan.md).

## Evidencia requerida por experimento

- Commit e imagen ejecutados.
- Escenario, herramienta, parámetros, timestamps y responsable.
- Eventos crudos, normalizados, ground truth y `AttackTrace`.
- Precisión, recall, F1, cobertura, orden de etapas y latencia.
- CPU, RAM, temperatura, disco y pérdida de eventos cuando se use Raspberry Pi.
- Hashes de artefactos, desviaciones y limitaciones.

## Estado al 19 de agosto de 2026

- [x] Problema, objetivos, preguntas y metodología tienen borrador.
- [x] Arquitectura, requisitos, ADR iniciales y estrategia de pruebas tienen borrador.
- [ ] Estado del arte con 5–10 referencias y `referencias.bib`.
- [ ] Directorios `research/`, `schemas/` y fixtures reales.
- [ ] Cinco escenarios con ground truth ejecutable.
- [ ] Pipeline y resultados cuantitativos.
- [ ] Validación Raspberry Pi y prueba OTI UNI.
