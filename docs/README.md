# Documentación de HoneyTrace

> [!NOTE]
> HoneyTrace cerró su alcance académico y fue presentado en la feria UNITEC 2026. Esta documentación se conserva como registro técnico final; los documentos de planificación histórica pueden contener propuestas que quedaron fuera del alcance entregado.

Utiliza este archivo únicamente como punto de entrada hacia la documentación correspondiente.

## Cierre y demostración

- [Registro de cierre de UNITEC 2026](cierre-unitec-2026.md)
- [Video de la visualización final](media/honeytrace-visualizacion-unitec-2026.mp4)

## Investigación

- [Índice del plan de investigación](research_plan.md)
- [Planteamiento del problema](investigacion/planteamiento-del-problema.md)
- [Objetivos](investigacion/objetivos.md)
- [Preguntas de investigación](investigacion/preguntas-de-investigacion.md)
- [Metodología](investigacion/metodologia.md)
- [Estado del arte](investigacion/estado-del-arte.md)
- [Referencias bibliográficas](investigacion/referencias.bib)

## Arquitectura

- [Arquitectura general](arquitectura/arquitectura.md)
- [Flujo de datos](arquitectura/flujo-de-datos.md)
- [Threat model](arquitectura/threat-model.md)
- [Diagrama de contexto](arquitectura/diagramas/contexto.md)
- [Diagrama de componentes](arquitectura/diagramas/componentes.md)
- [Diagrama de despliegue](arquitectura/diagramas/despliegue.md)
- [Observabilidad y contrato NDJSON](arquitectura/observabilidad.md)

## Decisiones de arquitectura

- [Índice de ADR](adr/README.md)
- [ADR 0001 — Estructura general](adr/0001-estructura-general.md)
- [ADR 0002 — Wazuh como SIEM](adr/0002-siem.md)
- [ADR 0003 — Esquema de eventos](adr/0003-esquema-eventos.md)
- [ADR del stack de base de datos](adr/adr_001_python_db_stack.md)

## Requisitos

- [Requisitos funcionales y no funcionales](requisitos/requisitos.md)

## Gestión Scrum

- [Roadmap ejecutivo](scrum_roadmap.md)
- [Sprint 0](scrum/sprint-0.md)
- [Sprint 1](scrum/sprint-1.md)
- [Sprint 2](scrum/sprint-2.md)
- [Sprint 3](scrum/sprint-3.md)
- [Sprint 4](scrum/sprint-4.md)
- [Definition of Ready](scrum/definition-of-ready.md)
- [Definition of Done](scrum/definition-of-done.md)

## Pruebas

- [Estrategia de pruebas](testing/estrategia-de-pruebas.md)
- [Escenarios de ataque](testing/escenarios-de-ataque.md)
- [Matriz de pruebas](testing/matriz-de-pruebas.md)

## Despliegue y operación

- [Plan de prueba en OTI UNI — archivado](oti_uni_test_plan.md)
- [Documentación de la base de datos](../honeypot/db_documentation.md)
- [README del backend honeypot](../honeypot/README.md)
- [Política de seguridad](../SECURITY.md)
- [Guía de contribución](../CONTRIBUTING.md)
- [Herramientas de laboratorio](../scripts/README.md): CLI Go para ataques reales controlados, con confirmación obligatoria del laboratorio.

## Componentes implementados

- [Pipeline de análisis](../pipeline/README.md)
- [Collector](../pipeline/collector/README.md)
- [Normalizer](../pipeline/normalizer/README.md)
- [Correlation Engine Rust](../pipeline/engine/README.md)
- [Método de reconstrucción](../pipeline/engine/metodo-seleccionado.md)
- [Schemas de entrada y salida](../schemas/README.md)
- [Backend del Visualizer](../visualizer/backend/README.md)
- [Frontend del Visualizer](../visualizer/frontend/README.md)
- [Modelo de datos del Visualizer](../visualizer/backend/DB.md)

## Proyecto

- [README principal](../README.md)
