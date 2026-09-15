# Método seleccionado para el Correlation Engine

## Decisión

Para HoneyTrace se selecciona un método **híbrido, determinista y por fases**:

1. correlación temporal por ventanas y claves de identidad;
2. construcción de un grafo de procedencia ligero;
3. inferencia causal conservadora mediante reglas explícitas;
4. reconstrucción de una traza con evidencia y confianza calibrada;
5. evaluación offline contra ground truth antes de introducir aprendizaje automático.

La decisión es deliberada. ORTHRUS demuestra que los modelos temporales sobre grafos pueden mejorar la calidad de atribución, pero también advierte que la precisión publicada no equivale automáticamente a una salida útil para un analista. SLEUTH demuestra la utilidad de grafos de dependencia en tiempo real. ALchemist y ωLOG muestran que fusionar contexto de aplicación con auditoría reduce dependencias espurias. HoneyTrace ya posee contexto HTTP, vulnerabilidad, sesión, usuario y telemetría de base de datos; por tanto, debe aprovechar esa semántica antes de añadir un GNN costoso.

## Comparación de candidatos

| Método | A favor | Riesgo para HoneyTrace | Decisión |
|---|---|---|---|
| Reglas SIEM/ventanas | Determinista, barato, explicable | No representa causalidad ni dependencias entre recursos | Base de correlación |
| Grafo de procedencia estilo SLEUTH | Reconstrucción temporal y causal, apto para streaming | Requiere límites estrictos para no explotar en memoria | Adoptado |
| GNN temporal estilo ORTHRUS | Detecta patrones no conocidos y recupera nodos relacionados | Entrenamiento, memoria, calibración y alto riesgo de falsos positivos con pocos datos | Fase posterior experimental |
| Fusión semántica ALchemist/ωLOG | Reduce dependencias espurias y conserva contexto de aplicación | Requiere relaciones fiables entre fuentes | Adoptado de forma acotada |
| Aprendizaje de patrones/gráficas | Puede generalizar campañas repetidas | Dataset pequeño y riesgo de fuga entre train/test | No inicial |

## Pipeline lógico

### 1. Ingesta y validación

Consumir sólo `NormalizedEvent` válidos. Rechazar eventos desconocidos, timestamps imposibles, secuencias duplicadas y payloads fuera de límites. Preservar `event_id` y el origen para auditoría.

### 2. Correlación inicial

Generar grupos candidatos usando, en este orden:

- `trace_id` y `session_id` cuando existan;
- identidad de atacante (`source_ip`, actor y user-agent normalizado);
- entidad afectada (`endpoint`, `user`, `order`, `product`, `file`, `database`);
- ventana temporal configurable;
- continuidad de `sequence`.

La correlación debe ser reproducible: la misma entrada y configuración produce el mismo `correlation_id`. No debe afirmar que dos eventos son causales sólo porque estén cerca en tiempo.

### 3. Grafo de procedencia acotado

Crear nodos para eventos y entidades. Crear aristas sólo cuando exista una relación observable:

- solicitud HTTP → respuesta;
- sesión → usuario;
- usuario → pedido/producto/archivo;
- evento de aplicación → consulta o error de DB;
- evento → causa declarada por el normalizer.

Aplicar TTL, máximo de nodos/aristas por traza, deduplicación y poda conservadora. Toda arista debe incluir `source_event_id`, regla que la produjo y timestamp.

### 4. Reglas causales por vulnerabilidad

Las reglas iniciales deben ser pequeñas, versionadas y específicas del honeypot:

- `/auth`: repetición de fallos seguida de éxito para el mismo actor/sesión.
- `/users`: acceso a identificador distinto del autorizado y posterior lectura/modificación.
- `/products`: entrada que genera error SQL o patrón de consulta anómala y respuesta correlacionada.
- `/files`: ruta solicitada que escapa al directorio permitido y evento de lectura resultante.
- `/orders`: nota persistida con contenido activo y posterior lectura/renderizado.

Estas reglas describen señales observables; no sustituyen la validación del ataque ni deben emitir una técnica ATT&CK si falta evidencia.

### 5. Reconstrucción

Ordenar la traza por timestamp y `sequence`, identificar el primer evento sustentado, enlazar causas y producir `AttackTrace`. Cada etapa debe contener eventos de evidencia. Las inferencias deben distinguirse de hechos observados y poder explicarse con una regla/version.

### 6. Scoring y salida

La confianza debe ser calibrada, no una probabilidad inventada. Inicialmente usar una puntuación interpretable por señales y penalizaciones por datos faltantes, conflicto temporal o aristas heurísticas. Emitir JSON/NDJSON compacto con:

- `trace_id`, intervalo temporal y versión de reglas;
- `event_ids` y evidencias;
- etapas y técnicas ATT&CK sólo cuando correspondan;
- `confidence`, razones y límites de la inferencia;
- contadores de nodos, aristas, descartes y latencia.

## Restricciones de Raspberry Pi 2 GB

- Procesamiento incremental; no cargar todo el histórico en memoria.
- Buffer acotado por traza y TTL configurable.
- Sin embeddings ni GNN en el camino online inicial.
- Hash de payloads y compresión/rotación de NDJSON.
- Métricas de memoria RSS, eventos por segundo, descartes y latencia p50/p95/p99.
- El SSD conserva el histórico; la Pi conserva sólo ventana activa y cola de salida.

## Plan de validación

1. Fixtures unitarios por vulnerabilidad y casos benignos.
2. Integración con NDJSON real del collector, normalizer y Wazuh.
3. Ataques E2E repetibles con `event_id` y ground truth versionados.
4. Prueba física en Raspberry Pi midiendo memoria, temperatura, pérdida de eventos y latencia.
5. Comparación contra baseline de reglas simples y, sólo después, prototipo ORTHRUS reducido.

Métricas mínimas: precisión de trazas, recall de eventos maliciosos, F1 por etapa, falsos positivos por hora, tiempo hasta la primera traza, tamaño de salida, memoria máxima y porcentaje de eventos descartados. Reportar intervalos de confianza y separar estrictamente escenarios de entrenamiento y evaluación.

## Por qué no empezar con GNN

ORTHRUS es una referencia importante, pero su evaluación está construida sobre grafos de procedencia de datasets de investigación y su objetivo es la atribución a nivel de nodo. HoneyTrace comienza con cinco vulnerabilidades web controladas, pocos tipos de entidad y hardware limitado. Un pipeline determinista permite comprobar primero la calidad de la telemetría y del ground truth; posteriormente se podrá añadir un módulo de aprendizaje como comparativa, sin convertirlo en dependencia del camino crítico.

## Referencias principales

- [SLEUTH, USENIX Security 2017](https://www.usenix.org/system/files/conference/usenixsecurity17/sec17-hossain.pdf)
- [ORTHRUS, USENIX Security 2025](https://www.usenix.org/system/files/usenixsecurity25-jiang-baoxiang.pdf)
- [ALchemist, NDSS 2021](https://www.ndss-symposium.org/wp-content/uploads/ndss2021_7A-2_24445_paper.pdf)
- [ωLOG, NDSS 2020](https://www.ndss-symposium.org/wp-content/uploads/2020/02/24270.pdf)
- [ProvCon, NDSS WoSoC 2025](https://www.ndss-symposium.org/wp-content/uploads/wosoc25-final8.pdf)
- [Cost-effective Attack Forensics, USENIX Security 2024](https://www.usenix.org/conference/usenixsecurity24/presentation/yu-le)
