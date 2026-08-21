# Planteamiento del problema

## Contexto

Los honeypots web tradicionales están orientados principalmente a **detectar** y **registrar** actividad maliciosa: generan alertas o almacenan logs de las interacciones de un atacante, pero rara vez van más allá de la constatación del evento aislado. Herramientas de SOC como los SIEM (p. ej. Wazuh) complementan esta labor correlacionando reglas predefinidas sobre los eventos que reciben, pero su capacidad de reconstruir una secuencia de ataque de forma explicable y evaluable frente a un *ground truth* conocido es limitada.

Esto deja una brecha entre:

- **Detección** (¿ocurrió algo sospechoso?)
- **Comprensión** (¿qué hizo exactamente el atacante, en qué orden, con qué evidencia?)

HoneyTrace nace para explorar esa segunda pregunta desde un honeypot instrumentado, en lugar de depender únicamente de reglas de correlación de un SIEM genérico.

## Problema

No existe, dentro del alcance evaluado, una arquitectura ligera y desplegable en hardware modesto (Raspberry Pi) que:

1. Capture telemetría heterogénea (HTTP, aplicación, base de datos, sistema) de un honeypot web.
2. Normalice esos eventos a un modelo común.
3. Correlacione eventos dispersos en el tiempo y por fuente para agruparlos en una misma actividad de ataque.
4. Reconstruya automáticamente una secuencia de etapas (reconocimiento, explotación, post-explotación, etc.) con evidencia trazable y una puntuación de confianza.
5. Permita comparar sus resultados contra los de un SIEM tradicional usando un *ground truth* de ataques controlados.

## Relevancia

- **Investigativa:** aporta evidencia empírica sobre qué tan bien puede automatizarse la reconstrucción de ataques a partir de telemetría de honeypot, y qué features/heurísticas de correlación son más informativas.
- **Práctica:** un prototipo funcional permite comparar el enfoque experimental frente al comportamiento de un SOC tradicional (Wazuh) sobre el mismo tráfico.
- **Académica:** el proyecto se presenta como entregable en UNICTEC, por lo que debe ser reproducible, medible y defendible con datos, no solo una demo visual.

## Alcance del problema en esta iteración (≈1 mes)

Dado el tiempo disponible, el problema se acota al **MVP**: honeypot → telemetría → collector → normalizer → correlation engine → attack reconstruction, ejecutado mediante solicitudes reales y controladas contra el honeypot propio. Los datos persistidos son de laboratorio; la integración con Wazuh, la API y la visualización 3D se consideran extensiones de demostración.

## Fuera de alcance

- Honeypots de interacción total (no se busca comprometer sistemas reales de terceros).
- Ataques contra infraestructura fuera del laboratorio controlado del equipo.
- Modelos de machine learning complejos para clasificación de ataques (se prioriza un motor de reglas/heurísticas explicable, evaluado empíricamente; el ML queda como trabajo futuro si el tiempo lo permite).
