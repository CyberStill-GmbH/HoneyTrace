# Preguntas de investigación

## Pregunta principal

**RQ0.** ¿En qué medida la telemetría heterogénea capturada por un honeypot web instrumentado permite reconstruir automáticamente, y con qué nivel de confianza, la secuencia de acciones de un atacante?

## Preguntas secundarias

- **RQ1.** ¿Qué atributos de correlación (IP, sesión, ventana temporal, endpoint, User-Agent, trace ID, relaciones causales) aportan mayor poder discriminante para agrupar eventos de una misma actividad de ataque?
- **RQ2.** ¿Qué precisión y qué tasa de falsos positivos/negativos presenta el motor de reconstrucción de HoneyTrace frente a un *ground truth* de ataques controlados (p. ej. fuerza bruta, enumeración, inyección)?
- **RQ3.** ¿Cómo se compara la reconstrucción producida por HoneyTrace con las alertas generadas por un SIEM tradicional (Wazuh) sobre la misma telemetría, en términos de granularidad, orden temporal y explicabilidad?
- **RQ4.** ¿Qué tipos de ataque son mejor caracterizados por el enfoque de correlación de HoneyTrace, y en cuáles el enfoque basado en reglas de un SIEM resulta más efectivo?
- **RQ5.** ¿Qué límites impone el hardware de bajo consumo (Raspberry Pi 4, 2GB RAM) sobre el volumen y la latencia de telemetría que el sistema puede procesar de forma confiable?
- **RQ6.** ¿Qué condiciones de aislamiento, operación y recuperación permiten ejecutar el piloto en una red institucional sin producir impacto fuera del honeypot?

## Relación con los experimentos

Cada pregunta debe poder responderse (o al menos acotarse) con un experimento documentado en `research/experiments/`, usando datasets de `research/datasets/` y produciendo resultados en `research/results/`. Ver `docs/investigacion/metodologia.md`.
