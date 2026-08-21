# Objetivos

## Objetivo general

Estudiar la capacidad de la telemetría capturada mediante un honeypot web para correlacionar eventos heterogéneos y reconstruir y caracterizar automáticamente secuencias de ataque.

## Objetivos específicos

1. **Diseñar e implementar** un honeypot web deliberadamente vulnerable, instrumentado para producir telemetría de múltiples fuentes (HTTP, aplicación, base de datos, sistema).
2. **Definir un modelo común de eventos** (esquema normalizado) capaz de representar telemetría proveniente de fuentes heterogéneas.
3. **Diseñar e implementar un motor de correlación** que agrupe eventos dispersos pertenecientes a una misma actividad de ataque, usando atributos como IP, sesión, ventana temporal, endpoint y relaciones causales.
4. **Diseñar e implementar un módulo de reconstrucción** que, a partir de eventos correlacionados, produzca un *Attack Trace* con etapas, evidencias y una puntuación de confianza.
5. **Evaluar la precisión de la reconstrucción** frente a un *ground truth* de ataques controlados ejecutados por el propio equipo.
6. **Comparar los resultados de HoneyTrace con los de un SIEM tradicional (Wazuh)** operando sobre la misma telemetría, para caracterizar ventajas y limitaciones de cada enfoque.
7. **(Extensión, si el tiempo lo permite)** Exponer las reconstrucciones mediante una API y una interfaz visual (React + Three.js) que facilite la exploración de un ataque reconstruido.
8. **Validar la viabilidad operativa** del MVP en una Raspberry Pi de 2 GB con SSD SATA externo y documentar una prueba de campo controlada en OTI UNI.

## Objetivos no perseguidos en esta iteración

- Detección en tiempo real a gran escala / producción.
- Generalización a honeypots no-web (IoT, SCADA, etc.).
- Un frontend visualmente terminado si eso compromete la calidad del motor de correlación/reconstrucción.
