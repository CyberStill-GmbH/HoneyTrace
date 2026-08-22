# Estado del arte

> Documento vivo. Cada entrada debe referenciarse en `referencias.bib` con una clave BibTeX y citarse aquí como `[clave]`.

## 1. Honeypots

- Honeypots de baja interacción (p. ej. Cowrie, Dionaea): capturan intentos de explotación con bajo riesgo pero interacción limitada.
- Honeypots de alta interacción: mayor fidelidad de comportamiento del atacante, mayor riesgo y complejidad operativa.
- HoneyTrace se ubica en un punto intermedio: interacción media (web app deliberadamente vulnerable, no un sistema productivo real) priorizando la **riqueza de telemetría** sobre el realismo total.

## 2. Correlación de eventos de seguridad

- Los SIEM tradicionales correlacionan principalmente mediante reglas estáticas (firmas, umbrales, ventanas de tiempo) — enfoque similar al de Wazuh, que se usará como línea base de comparación.
- Enfoques de correlación basados en grafos de causalidad y cadenas de eventos (p. ej. inspirados en *provenance graphs*) permiten reconstrucciones más ricas que una simple lista de alertas.
- Líneas de trabajo en *alert correlation* y *attack scenario reconstruction* son la referencia directa para el diseño del Correlation Engine y el módulo de Attack Reconstruction de HoneyTrace.

## 3. Modelos de ataque y frameworks de referencia

- **Cyber Kill Chain** y **MITRE ATT&CK**: marcos de referencia para etiquetar y validar las etapas producidas por el módulo de reconstrucción (reconocimiento, acceso inicial, escalada, etc.).
- Se evaluará mapear las etapas del `AttackTrace` de HoneyTrace a técnicas de ATT&CK cuando sea posible, para dar interpretabilidad a los resultados.

## 4. Visualización de incidentes

- Herramientas de *attack graph visualization* existentes (comerciales y académicas) como referencia de diseño para el Attack Explorer (timeline + grafo + reconstrucción 3D).

## 5. Brecha identificada

La literatura revisada hasta ahora no ofrece un sistema ligero, desplegable en hardware de bajo costo, que combine (a) telemetría propia de un honeypot web instrumentado, (b) un motor de correlación explicable y (c) evaluación cuantitativa contra *ground truth* y contra un SIEM real. Esa combinación es la contribución que persigue HoneyTrace en esta iteración.

## 6. Decisiones aplicadas al collector

- **Modelo de eventos común:** Khoury et al. describen un modelo de eventos capaz de representar información causal a través de plataformas y niveles de granularidad distintos [khoury2020event]. HoneyTrace conserva identidad, tiempo, entidades y relaciones `causes` antes de entregar al Engine.
- **Reconstrucción temporal y causal:** SLEUTH utiliza una abstracción de grafo de dependencias en memoria y técnicas de etiquetado para reconstruir escenarios en tiempo real [hossain2017sleuth]. Por eso el collector conserva `sequence`, `trace_id`, `event_id` y relaciones causales, sin intentar clasificar el ataque durante la ingesta.
- **Control de explosión de datos:** Yu et al. muestran que la forensia en dispositivos restringidos debe reducir el costo de registrar eventos de alta frecuencia [yu2024costeffective]. HoneyTrace aplica límites de tamaño, metadata, buffer, rotación y payload por hash.
- **Etiquetado reproducible:** AutoLabel correlaciona logs de aplicación y tráfico con auditoría para extraer subgrafos de ataque y producir datasets etiquetados [peng2025autolabel]. La salida del collector conserva `event_id`, `trace_id`, `sequence` y `causes` para que los fixtures y ataques reales puedan compararse con ground truth.
- **Calidad de la salida:** ORTHRUS advierte que grandes volúmenes de resultados irrelevantes aumentan la carga analítica [jiang2025orthrus]. El collector no emite alertas ambiguas: entrega eventos acotados y deja la correlación y la reconstrucción al Engine.

## 7. Preparación del engine Rust

El directorio `engine/` implementa el primer camino determinista y mantiene puertos para fases avanzadas. La división `ingest → correlate → provenance → reconstruct → scoring` sigue los retos de streaming, orden parcial y relaciones explícitas descritos por Han et al. [han2018provenance]. SLEUTH fundamenta el grafo de dependencias y la reconstrucción en tiempo real [hossain2017sleuth]; ORTHRUS fundamenta la poda conservadora, la representación temporal y la atribución [jiang2025orthrus]. ALchemist respalda guardar la fuente y razón de cada evidencia al fusionar logs [alchemist].

Esta evidencia no autoriza a afirmar un porcentaje de éxito general: cada publicación evalúa escenarios y datasets propios. HoneyTrace deberá medir precisión, cobertura, falsos positivos, latencia, memoria y tamaño de salida en sus ataques reales, con ground truth versionado.

La evaluación metodológica completa y la decisión de iniciar con un pipeline determinista híbrido están en [`engine/metodo-seleccionado.md`](../../engine/metodo-seleccionado.md). OmegaLog aporta la reconciliación entre contexto de aplicación y auditoría [omegalog], mientras ProvCon refuerza la necesidad de transformar observaciones en una representación de procedencia explicable [provcon2025].

## Pendiente de completar

- [x] Añadir referencias concretas con año, autores y hallazgo relevante.
- [x] Completar `referencias.bib` en paralelo a esta sección.
