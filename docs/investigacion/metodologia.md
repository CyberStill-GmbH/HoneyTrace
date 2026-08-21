# Metodología

## Enfoque general

Investigación aplicada de carácter **experimental**, basada en la construcción de un prototipo (HoneyTrace) y la ejecución de ataques controlados sobre él para medir su capacidad de reconstrucción, comparándola contra un SIEM tradicional (Wazuh).

## Fases

1. **Diseño e implementación del MVP**: honeypot → telemetría → collector → normalizer → correlation engine → attack reconstruction (ver `docs/requisitos/requisitos.md`).
2. **Definición de escenarios de ataque controlados**: cada escenario se documenta en `docs/testing/escenarios-de-ataque.md`, con su *ground truth* (secuencia real de acciones ejecutadas).
3. **Ejecución de experimentos**: cada ejecución de un escenario contra HoneyTrace (y en paralelo contra Wazuh) se registra en `research/experiments/`.
4. **Recolección de datos**: telemetría cruda, eventos normalizados y `AttackTrace` producido se guardan como datasets versionados en `research/datasets/` (o como fixtures sintéticas en `tests/fixtures/` para desarrollo sin hardware).
5. **Análisis y comparación**: se compara el `AttackTrace` reconstruido contra el *ground truth*, y las alertas de Wazuh contra el mismo *ground truth*, usando las métricas definidas abajo. Resultados en `research/analysis/` y `research/results/`.
6. **Síntesis**: los hallazgos alimentan de vuelta `estado-del-arte.md` y, si corresponde, ajustan el diseño del Correlation Engine (documentado vía ADR).
7. **Validación física y de campo**: se ejecuta primero un ensayo reproducible en la Raspberry Pi de 2 GB y, únicamente con autorización, una prueba controlada propuesta para el 10 de septiembre de 2026 en OTI UNI. El protocolo se define en `docs/oti_uni_test_plan.md`.

## Métricas de evaluación

Para cada escenario de ataque, comparando la reconstrucción automática contra el *ground truth*:

- **Precisión / recall / F1** de la asignación de eventos a un mismo `Attack #`.
- **Exactitud del orden de etapas** reconstruidas (p. ej. distancia de edición entre la secuencia reconstruida y la real).
- **Confidence score** del `AttackTrace` vs. corrección real de la reconstrucción (calibración).
- **Cobertura**: porcentaje de eventos relevantes del ataque que fueron capturados y correlacionados.
- **Latencia**: tiempo entre la generación del evento y su inclusión en un `AttackTrace`.
- **Comparación cualitativa** con las alertas de Wazuh: granularidad, explicabilidad, falsos positivos/negativos.
- **Viabilidad en hardware**: memoria, CPU, temperatura, crecimiento del SSD, pérdida de eventos y tiempo de recuperación.

## Ground truth

Todo ataque controlado se ejecuta desde un entorno separado del honeypot (ver `threat-model.md`), siguiendo un guion documentado (herramienta usada, pasos, timestamps). Ese guion **es** el ground truth contra el que se evalúa la reconstrucción automática.

## Reproducibilidad

- Cada experimento debe poder repetirse con los fixtures de `tests/fixtures/` sin necesidad de la Raspberry Pi.
- Los resultados publicados deben incluir la versión del Engine (commit hash) y el escenario exacto ejecutado.
- Cada ejecución debe registrar imagen, configuración, parámetros, responsable, timestamps y hashes de artefactos.

## Ética y alcance

Todos los ataques se ejecutan en un laboratorio controlado, contra el propio honeypot del equipo, sin afectar sistemas de terceros. No se recolecta información personal de terceros; el honeypot está aislado de redes de producción (ver `threat-model.md`).
