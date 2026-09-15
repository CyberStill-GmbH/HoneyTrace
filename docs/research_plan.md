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

## Estado al cierre de UNITEC 2026

- [x] Problema, objetivos, preguntas y metodología tienen borrador.
- [x] Arquitectura, requisitos, ADR iniciales y estrategia de pruebas tienen borrador.
- [x] Estado del arte y bibliografía base documentados en `referencias.bib`.
- [x] Contratos de eventos y trazas versionados en `schemas/`.
- [x] Cinco escenarios disponibles en la CLI de laboratorio y pipeline integrado hasta la visualización.
- [x] Evidencia funcional presentada en UNITEC 2026.
- [ ] Comparación cuantitativa ampliada contra *ground truth* versionado — extensión posterior al cierre.
- [ ] Validación física en Raspberry Pi y prueba OTI UNI — extensión posterior al cierre, no ejecutada en esta entrega.

El alcance académico se considera finalizado. Las dos extensiones abiertas se mantienen como oportunidades de investigación y no como requisitos pendientes del producto presentado.
